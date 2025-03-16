import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../auth';
import { getUserRoundPlay } from '../../../lib/kv';

export async function GET(request: NextRequest) {
  try {
    // Get FID from header
    const userFid = request.headers.get('X-Farcaster-User-FID');
    
    if (!userFid) {
      return NextResponse.json({ success: false, error: 'Unauthorized - No FID available' }, { status: 401 });
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