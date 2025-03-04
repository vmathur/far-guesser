import { NextRequest } from "next/server";
import { getLeaderboard, submitScore } from "~/lib/kv";
import { z } from "zod";

// Schema for score submission
const scoreSubmissionSchema = z.object({
  name: z.string().min(1).max(20),
  score: z.number().int().positive(),
});

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    
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
    const result = scoreSubmissionSchema.safeParse(requestJson);
    
    if (!result.success) {
      return Response.json(
        { success: false, error: result.error.errors },
        { status: 400 }
      );
    }
    
    // Add timestamp to the entry
    const entry = {
      ...result.data,
      timestamp: Date.now(),
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