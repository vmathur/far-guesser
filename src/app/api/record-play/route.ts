import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';
import { recordUserPlay } from '../../../lib/kv';

export async function POST(request: NextRequest) {
  try {
    // Get FID from header or from session
    const fidFromHeader = request.headers.get('X-Farcaster-User-FID');
    
    // Ensure the user is authenticated via session or header
    const session = await getServerSession(authOptions);
    
    // Use header FID if available, otherwise use session FID
    let userFid = fidFromHeader ? parseInt(fidFromHeader, 10) : session?.user?.fid;
    
    // Parse the request body
    const body = await request.json();
    
    // If FID is in the body, prefer that (useful for testing)
    if (body.fid) {
      userFid = body.fid;
    }
    
    if (!userFid) {
      return NextResponse.json({ success: false, error: 'Unauthorized - No FID available' }, { status: 401 });
    }
    
    // Get the guess data from the request body
    const { guessData } = body;
    
    // Record that the user has played this round with their guess data
    await recordUserPlay(userFid, guessData);
    
    return NextResponse.json({
      success: true,
      message: 'User play recorded successfully'
    });
  } catch (error) {
    console.error("Error recording user play:", error);
    return NextResponse.json(
      { success: false, error: `Failed to record user play: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 