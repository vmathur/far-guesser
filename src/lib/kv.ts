import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";
import { ROUND_DURATION_MS } from '../data/gameConfig';

// Add better error handling for Redis configuration
const createRedisClient = () => {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    console.warn('Redis credentials missing: KV_REST_API_URL or KV_REST_API_TOKEN not found in environment variables');
    // Return dummy Redis client for development that logs operations instead of failing
    return {
      get: async (key: string) => { 
        console.log(`[DEV Redis] GET ${key}`);
        return null;
      },
      set: async (key: string, value: any) => {
        console.log(`[DEV Redis] SET ${key}`, value);
        return null;
      },
      del: async (key: string) => {
        console.log(`[DEV Redis] DEL ${key}`);
        return null;
      },
      scan: async (options: any) => {
        console.log('[DEV Redis] SCAN', options);
        return { keys: [], cursor: 0 };
      }
    } as unknown as Redis;
  }
  
  return new Redis({
    url,
    token,
  });
};

const redis = createRedisClient();

// Consolidated user data interface
interface ConsolidatedUserData {
  notification?: FrameNotificationDetails;
  guess?: {
    position: { lat: number; lng: number };
    distance: number;
  };
  lastRoundPlayed?: number;
}

// Get the key for consolidated user data
function getUserDataKey(fid: number): string {
  return `far-guesser:user:${fid}`;
}

/**
 * Gets all FIDs that have notification details stored
 * @returns Array of user FIDs that have subscribed to notifications
 */
export async function getAllSubscribedUserFids(): Promise<number[]> {
  try {
    // Use SCAN instead of KEYS for better performance with large datasets
    const userFids: number[] = [];
    let cursor = 0;
    
    do {
      // Scan for keys with pattern and get data in chunks
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: 'far-guesser:user:*',
        count: 100
      });
      
      cursor = parseInt(nextCursor, 10);
      
      if (keys.length > 0) {
        // Get user data for all keys in this batch
        const userDataPromises = keys.map(key => {
          const fidStr = key.split(':').pop();
          const fid = parseInt(fidStr || '0', 10);
          return redis.get<ConsolidatedUserData>(key).then(data => ({ fid, data }));
        });
        
        const batchUserData = await Promise.all(userDataPromises);
        
        // Filter for users with notification details and add to results
        userFids.push(
          ...batchUserData
            .filter(item => item.data && item.data.notification)
            .map(item => item.fid)
            .filter(fid => fid > 0)
        );
      }
    } while (cursor !== 0); // Continue until cursor returns 0
    
    return userFids;
  } catch (error) {
    console.error('Error getting subscribed user FIDs:', error);
    return [];
  }
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  const userData = await redis.get<ConsolidatedUserData>(getUserDataKey(fid));
  return userData?.notification || null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  console.log('setting notification details for', fid, notificationDetails);
  
  // Update consolidated data
  const userData = await redis.get<ConsolidatedUserData>(getUserDataKey(fid)) || {} as ConsolidatedUserData;
  userData.notification = notificationDetails;
  await redis.set(getUserDataKey(fid), userData);
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  // Update consolidated data by removing notification field
  const userData = await redis.get<ConsolidatedUserData>(getUserDataKey(fid));
  if (userData) {
    delete userData.notification;
    await redis.set(getUserDataKey(fid), userData);
  }
}

// Leaderboard functions
interface LeaderboardEntry {
  name: string;
  score: number;  // Score calculated as 100*e^(-distance/2000)
  distance: number; // Original distance in km
  timestamp: number;
  fid?: string; // Farcaster ID
  position?: { 
    lat?: number; 
    lng?: number; 
  }; // User's guess position
  pfpUrl?: string; // User's profile picture URL
}

function getAllTimeLeaderboardKey(): string {
  return `far-guesser:all-time-leaderboard`;
}

async function getDailyLeaderboardKey(): Promise<string> {
  // Get the current location index from Redis
  const locationIndex = await redis.get<number>(LOCATION_INDEX_KEY) || 0;
  return `far-guesser:daily-leaderboard:by-location:${locationIndex}`;
}

// Calculate score from distance using formula: 100*e^(-distance/2000)
function calculateScore(distance: number): number {
  return 100 * Math.exp(-distance / 2000);
}

export async function getAllTimeLeaderboard(): Promise<LeaderboardEntry[]> {
  const leaderboard = await redis.get<LeaderboardEntry[]>(getAllTimeLeaderboardKey());
  return leaderboard || [];
}

export async function getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  const leaderboard = await redis.get<LeaderboardEntry[]>(await getDailyLeaderboardKey());
  return leaderboard || [];
}

export async function submitScore(entry: Omit<LeaderboardEntry, 'score'> & { distance: number }): Promise<void> {
  // Calculate score from distance
  const calculatedScore = calculateScore(entry.distance);
  
  const fullEntry: LeaderboardEntry = {
    ...entry,
    score: calculatedScore
  };
  
  // Update daily leaderboard
  await updateLeaderboard(await getDailyLeaderboardKey(), fullEntry);
  
  // Update all-time leaderboard
  await updateLeaderboard(getAllTimeLeaderboardKey(), fullEntry);
}

async function updateLeaderboard(leaderboardKey: string, entry: LeaderboardEntry): Promise<void> {
  // Get current leaderboard
  const leaderboard = await redis.get<LeaderboardEntry[]>(leaderboardKey) || [];
  
  // Check if user with this FID already exists in leaderboard
  const existingEntryIndex = entry.fid 
    ? leaderboard.findIndex(e => e.fid === entry.fid)
    : -1;
  
  if (existingEntryIndex >= 0) {
    // Handle differently based on leaderboard type
    if (leaderboardKey === getAllTimeLeaderboardKey()) {
      // For all-time leaderboard, sum the scores
      leaderboard[existingEntryIndex].score += entry.score;
      // Update the distance to be the sum as well (though this isn't directly shown)
      leaderboard[existingEntryIndex].distance += entry.distance;
      // Update timestamp to the latest
      leaderboard[existingEntryIndex].timestamp = entry.timestamp;
    } else {
      // For daily leaderboard, if user already has an entry and new score is better, update it
      if (leaderboard[existingEntryIndex].score < entry.score) {
        leaderboard[existingEntryIndex] = entry;
      }
    }
  } else {
    // Otherwise add new entry
    leaderboard.push(entry);
  }
  
  // Sort by score (higher is better for our calculated score)
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Limit to top 2000 scores
  const topScores = leaderboard.slice(0, 2000);
  
  // Store back in KV
  await redis.set(leaderboardKey, topScores);
}

// For backwards compatibility
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return getAllTimeLeaderboard();
}

// Reset leaderboard functions
export async function resetDailyLeaderboard(): Promise<void> {
  // Delete the current day's leaderboard
  await redis.del(await getDailyLeaderboardKey());
}

export async function resetAllTimeLeaderboard(): Promise<void> {
  // Delete the all-time leaderboard
  await redis.del(getAllTimeLeaderboardKey());
}

export async function resetAllLeaderboards(): Promise<void> {
  // Reset both daily and all-time leaderboards
  await Promise.all([
    resetDailyLeaderboard(),
    resetAllTimeLeaderboard()
  ]);
}

// Function to reset all game data
export async function resetAll(): Promise<void> {
  try {
    // 1. Reset all-time leaderboard
    await resetAllTimeLeaderboard();
    
    // 2. Reset ALL daily leaderboards for all locations, not just the current one
    const dailyLeaderboardKeys = await redis.keys('far-guesser:daily-leaderboard:by-location:*');
    if (dailyLeaderboardKeys && dailyLeaderboardKeys.length > 0) {
      await Promise.all(dailyLeaderboardKeys.map(key => redis.del(key)));
    }
    
    // 3. Delete consolidated user data
    const consolidatedUserKeys = await redis.keys('far-guesser:user:*');
    if (consolidatedUserKeys && consolidatedUserKeys.length > 0) {
      await Promise.all(consolidatedUserKeys.map(key => redis.del(key)));
    }
    
    // 4. Reset location index to 0
    await redis.set(LOCATION_INDEX_KEY, 0);
    
    // 5. Update last location update time to current time
    await redis.set(LOCATION_UPDATED_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error in resetAll:', error);
    throw error;
  }
}

// Function to get user's round play data
export async function getUserRoundPlay(fid: number): Promise<any> {
  // Get the current location index
  const currentLocationIndex = await redis.get<number>(LOCATION_INDEX_KEY) || 0;
  
  // Get user data
  const userData = await redis.get<ConsolidatedUserData>(getUserDataKey(fid));
  
  // If user has data and has played the current round
  if (userData && userData.lastRoundPlayed === currentLocationIndex && userData.guess) {
    return userData.guess;
  }
  
  return null;
}

export async function recordUserPlay(fid: number, guessData?: any): Promise<void> {
  // Get the current location index
  const currentLocationIndex = await redis.get<number>(LOCATION_INDEX_KEY) || 0;
  
  // Update consolidated data
  const userData = await redis.get<ConsolidatedUserData>(getUserDataKey(fid)) || {} as ConsolidatedUserData;
  userData.lastRoundPlayed = currentLocationIndex;
  
  if (guessData) {
    // Make sure guessData has the right structure before assigning
    if (typeof guessData === 'object' && guessData.position && typeof guessData.distance === 'number') {
      userData.guess = {
        position: guessData.position,
        distance: guessData.distance
      };
    }
  }
  
  await redis.set(getUserDataKey(fid), userData);
}

export async function hasUserPlayedCurrentRound(fid: number): Promise<boolean> {
  // Get the current location index
  const currentLocationIndex = await redis.get<number>(LOCATION_INDEX_KEY) || 0;
  
  // Check if user has played the current round
  const userData = await redis.get<ConsolidatedUserData>(getUserDataKey(fid));
  return !!(userData && userData.lastRoundPlayed === currentLocationIndex);
}

// Round timing functions
export async function getLastRoundUpdateTime(): Promise<number> {
  const lastUpdate = await redis.get<string>(LOCATION_UPDATED_KEY);
  if (!lastUpdate) return 0;
  return new Date(lastUpdate).getTime();
}

// Constants
export const LOCATION_INDEX_KEY = 'current-location-index';
export const LOCATION_UPDATED_KEY = 'location-last-updated';

// Round duration is now imported from gameConfig.ts

export async function getTimeUntilNextRound(): Promise<number> {
  const lastUpdate = await getLastRoundUpdateTime();
  if (lastUpdate === 0) return 0;
  
  // Calculate time until next round using configurable duration
  const nextRound = lastUpdate + ROUND_DURATION_MS;
  const now = Date.now();
  
  return Math.max(0, nextRound - now);
}
