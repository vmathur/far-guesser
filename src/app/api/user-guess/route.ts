import { NextRequest, NextResponse } from 'next/server';
import { getUserRoundPlay } from '../../../lib/kv';

export async function GET(request: NextRequest) {
  try {
    // Get FID from header
    const userFidStr = request.headers.get('X-Farcaster-User-FID');
    
    if (!userFidStr) {
      return NextResponse.json({ success: false, error: 'Unauthorized - No FID available' }, { status: 401 });
    }
    
    // Convert string FID to number
    const userFid = parseInt(userFidStr, 10);
    if (isNaN(userFid)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid FID format' 
      }, { status: 400 });
    }
    
    // Get the user's previous guess for the current round
    const userGuess = await getUserRoundPlay(userFid);
    
    return NextResponse.json({
      success: true,
      guess: userGuess
    });
  } catch (error) {
    console.error("Error fetching user guess:", error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch user guess: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 