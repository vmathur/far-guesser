import { NextRequest } from "next/server";
import { resetAllTimeLeaderboard } from "~/lib/kv";

// Environment variable containing the admin API key
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');

    // Check if the authorization header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: "Unauthorized - Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    // Extract the API key from the authorization header
    const apiKey = authHeader.slice(7); // Remove "Bearer " prefix

    // Check if the API key matches the admin API key
    if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
      return Response.json(
        { success: false, error: "Unauthorized - Invalid API key" },
        { status: 401 }
      );
    }

    // If authentication is successful, reset the all-time leaderboard
    await resetAllTimeLeaderboard();

    // Return success response
    return Response.json({ 
      success: true, 
      message: "All-time leaderboard has been reset successfully" 
    });
  } catch (error) {
    console.error("Error resetting all-time leaderboard:", error);
    return Response.json(
      { success: false, error: "Failed to reset all-time leaderboard" },
      { status: 500 }
    );
  }
} 