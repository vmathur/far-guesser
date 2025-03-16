import { NextRequest, NextResponse } from 'next/server';
import { submitScore, recordUserPlay } from '../../../lib/kv';

export async function POST(request: NextRequest) {
  try {
    // Get FID from header
    const userFidStr = request.headers.get('X-Farcaster-User-FID');
    
    if (!userFidStr) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No FID available' }, 
        { status: 401 }
      );
    }
    
    // Convert string FID to number
    const userFid = parseInt(userFidStr, 10);
    if (isNaN(userFid)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid FID format' 
      }, { status: 400 });
    }
    
    // Get guess data from request body
    const { guessData, leaderboardData } = await request.json();
    
    if (!guessData) {
      return NextResponse.json(
        { success: false, error: 'No guess data provided' }, 
        { status: 400 }
      );
    }
    
    // Record the user's play (stores the location index and guess data)
    await recordUserPlay(userFid, guessData);
    
    // If leaderboard data provided, submit to leaderboards
    if (leaderboardData) {
      // Make sure to set timestamp to current time
      const formattedData = {
        ...leaderboardData,
        timestamp: Date.now()
      };
      
      await submitScore(formattedData);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Play recorded successfully'
    });
  } catch (error) {
    console.error("Error recording play:", error);
    return NextResponse.json(
      { success: false, error: `Failed to record play: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 