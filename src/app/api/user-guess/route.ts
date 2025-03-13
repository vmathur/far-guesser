import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';
import { getUserRoundPlay } from '../../../lib/kv';

export async function GET(request: NextRequest) {
  try {
    // Get FID from header or from session
    const fidFromHeader = request.headers.get('X-Farcaster-User-FID');
    
    // Ensure the user is authenticated via session or header
    const session = await getServerSession(authOptions);
    
    // Use header FID if available, otherwise use session FID
    const userFid = fidFromHeader ? parseInt(fidFromHeader, 10) : session?.user?.fid;
    
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