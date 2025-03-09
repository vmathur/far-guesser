import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";
import { ROUND_DURATION_MS } from './gameConfig';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function getUserNotificationDetailsKey(fid: number): string {
  return `far-guesser-notifications:user:${fid}`;
}

// Get the prefix for user notification keys
function getUserNotificationKeysPrefix(): string {
  return `far-guesser-notifications:user:`;
}

/**
 * Gets all FIDs that have notification details stored
 * @returns Array of user FIDs that have subscribed to notifications
 */
export async function getAllSubscribedUserFids(): Promise<number[]> {
  try {
    // In Upstash Redis SDK, scan returns { keys: string[], cursor: number }
    // We need to use scanIterator for patterns
    const prefix = getUserNotificationKeysPrefix();
    
    // Use redis.keys instead of scan for simplicity
    // Note: In a production app with many users, you might want to paginate this
    const userKeys = await redis.keys(`${prefix}*`);
    
    if (!userKeys || !Array.isArray(userKeys)) {
      console.log('No user keys found or unexpected response format:', userKeys);
      return [];
    }
    
    // Extract the FIDs from the keys
    return userKeys.map(key => {
      // Keys from scan are strings
      if (typeof key === 'string') {
        // Extract the FID from the key format "far-guesser-notifications:user:123"
        const fidStr = key.split(':').pop();
        return parseInt(fidStr || '0', 10);
      }
      return 0;
    }).filter(fid => fid > 0); // Filter out any invalid FIDs
  } catch (error) {
    console.error('Error getting subscribed user FIDs:', error);
    return [];
  }
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  return await redis.get<FrameNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await redis.del(getUserNotificationDetailsKey(fid));
}

// Leaderboard functions
interface LeaderboardEntry {
  name: string;
  score: number;  // Score calculated as 100*e^(-distance/2000)
  distance: number; // Original distance in km
  timestamp: number;
  fid?: string; // Farcaster ID
}

function getAllTimeLeaderboardKey(): string {
  return `far-guesser:all-time-leaderboard`;
}

function getDailyLeaderboardKey(): string {
  // Use the current date (YYYY-MM-DD format) to generate a daily key
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  return `far-guesser:daily-leaderboard:${dateString}`;
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
  const leaderboard = await redis.get<LeaderboardEntry[]>(getDailyLeaderboardKey());
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
  await updateLeaderboard(getDailyLeaderboardKey(), fullEntry);
  
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
  
  // Limit to top 100 scores
  const topScores = leaderboard.slice(0, 100);
  
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
  await redis.del(getDailyLeaderboardKey());
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

// User round play tracking functions
function getUserRoundPlayKey(fid: number): string {
  return `far-guesser:user-play:${fid}`;
}

export async function recordUserPlay(fid: number): Promise<void> {
  await redis.set(getUserRoundPlayKey(fid), Date.now());
}

export async function hasUserPlayedCurrentRound(fid: number): Promise<boolean> {
  const lastPlayed = await redis.get<number>(getUserRoundPlayKey(fid));
  if (!lastPlayed) return false;
  
  const lastRoundUpdate = await getLastRoundUpdateTime();
  // User has played if their last play timestamp is after the last round update
  return lastPlayed > lastRoundUpdate;
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
