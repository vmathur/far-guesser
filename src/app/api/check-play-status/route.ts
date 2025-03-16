import { NextRequest, NextResponse } from 'next/server';
import { hasUserPlayedCurrentRound, getTimeUntilNextRound, getUserRoundPlay } from '../../../lib/kv';

export async function GET(request: NextRequest) {
  try {
    console.log('Received check-play-status request');
    
    // Get FID from header
    const userFidStr = request.headers.get('X-Farcaster-User-FID');
    
    if (!userFidStr) {
      console.log('No FID available from header');
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No FID available' 
      }, { status: 401 });
    }
    
    // Convert string FID to number
    const userFid = parseInt(userFidStr, 10);
    if (isNaN(userFid)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid FID format' 
      }, { status: 400 });
    }
    
    // Check if the user has played the current round
    const hasPlayed = await hasUserPlayedCurrentRound(userFid);
    console.log(`User ${userFid} has played:`, hasPlayed);
    
    // Get the time until the next round
    const timeUntilNextRound = await getTimeUntilNextRound();
    
    // Get the user's guess if they have played
    let userGuess = null;
    if (hasPlayed) {
      userGuess = await getUserRoundPlay(userFid);
      console.log(`Retrieved user ${userFid}'s guess:`, userGuess);
    }
    
    const response = {
      success: true,
      hasPlayed,
      userGuess,
      timeUntilNextRound
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking play status:", error);
    return NextResponse.json(
      { success: false, error: `Failed to check play status: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}