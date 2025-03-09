import { NextRequest } from "next/server";
import { 
  getDailyLeaderboard, 
  getAllTimeLeaderboard, 
  submitScore, 
  hasUserPlayedCurrentRound,
  recordUserPlay
} from "~/lib/kv";
import { z } from "zod";

// Schema for score submission
const scoreSubmissionSchema = z.object({
  name: z.string().min(1).max(50),
  distance: z.number().positive(),
  fid: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'all-time';
    
    let leaderboard;
    if (type === 'daily') {
      leaderboard = await getDailyLeaderboard();
    } else {
      leaderboard = await getAllTimeLeaderboard();
    }
    
    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
    
    return Response.json({ success: true, data: rankedLeaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return Response.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    console.log("Received leaderboard submission:", requestJson);
    
    const result = scoreSubmissionSchema.safeParse(requestJson);
    
    if (!result.success) {
      console.error("Validation error:", result.error.errors);
      return Response.json(
        { success: false, error: result.error.errors },
        { status: 400 }
      );
    }
    
    // Check if the user has a FID (Farcaster ID)
    const userFidStr = result.data.fid;
    
    // If user has a FID, check if they've already played today
    if (userFidStr) {
      // Convert FID to number for the tracking functions
      const userFid = parseInt(userFidStr, 10);
      
      // Check if conversion was successful and is a valid number
      if (!isNaN(userFid)) {
        const hasPlayed = await hasUserPlayedCurrentRound(userFid);
        
        if (hasPlayed) {
          console.log(`User ${userFid} has already played today. Rejecting score submission.`);
          return Response.json(
            { 
              success: false, 
              error: "You have already submitted a score today. Come back tomorrow for a new round!" 
            },
            { status: 403 }
          );
        }
        
        // If they haven't played yet, record that they're playing now
        await recordUserPlay(userFid);
      } else {
        console.warn(`Invalid FID format: ${userFidStr}. Allowing score submission without play tracking.`);
      }
    }
    
    // Add timestamp to the entry
    const entry = {
      ...result.data,
      name: result.data.name,
      distance: result.data.distance,
      timestamp: Date.now(),
      fid: result.data.fid || undefined
    };
    
    await submitScore(entry);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error submitting score:", error);
    return Response.json(
      { success: false, error: "Failed to submit score" },
      { status: 500 }
    );
  }
} 