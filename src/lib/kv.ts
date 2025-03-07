import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";

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
  score: number;
  timestamp: number;
}

function getLeaderboardKey(): string {
  return `far-guesser:leaderboard`;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const leaderboard = await redis.get<LeaderboardEntry[]>(getLeaderboardKey());
  return leaderboard || [];
}

export async function submitScore(entry: LeaderboardEntry): Promise<void> {
  // Get current leaderboard
  const leaderboard = await getLeaderboard();
  
  // Add new entry
  leaderboard.push(entry);
  
  // Sort by score (lower is better for distance)
  leaderboard.sort((a, b) => a.score - b.score);
  
  // Limit to top 100 scores
  const topScores = leaderboard.slice(0, 100);
  
  // Store back in KV
  await redis.set(getLeaderboardKey(), topScores);
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

// Round duration in milliseconds
// Can be configured via ROUND_DURATION_MINUTES environment variable (default: 1440 minutes = 24 hours)
export const ROUND_DURATION_MS = 
  (parseInt(process.env.ROUND_DURATION_MINUTES || '1440', 10) * 60 * 1000);

export async function getTimeUntilNextRound(): Promise<number> {
  const lastUpdate = await getLastRoundUpdateTime();
  if (lastUpdate === 0) return 0;
  
  // Calculate time until next round using configurable duration
  const nextRound = lastUpdate + ROUND_DURATION_MS;
  const now = Date.now();
  
  return Math.max(0, nextRound - now);
}
