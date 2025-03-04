import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function getUserNotificationDetailsKey(fid: number): string {
  return `frames-v2-demo:user:${fid}`;
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
