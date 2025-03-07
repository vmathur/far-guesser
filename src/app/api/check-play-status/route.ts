import { NextRequest, NextResponse } from 'next/server';
import { hasUserPlayedCurrentRound, getTimeUntilNextRound } from '../../../lib/kv';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Received check-play-status request');
    
    // Get FID from header or from session
    const fidFromHeader = request.headers.get('X-Farcaster-User-FID');
    console.log('FID from header:', fidFromHeader);
    
    // Ensure the user is authenticated via session or header
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Exists' : 'Not found', 'User FID:', session?.user?.fid);
    
    // Use header FID if available, otherwise use session FID
    const userFid = fidFromHeader ? parseInt(fidFromHeader, 10) : session?.user?.fid;
    
    if (!userFid) {
      console.log('No FID available from header or session');
      return NextResponse.json({ success: false, error: 'Unauthorized - No FID available' }, { status: 401 });
    }
    
    // Check if the user has played the current round
    console.log(`Checking if user ${userFid} has played`);
    const hasPlayed = await hasUserPlayedCurrentRound(userFid);
    console.log(`User ${userFid} has played:`, hasPlayed);
    
    // Get the time until the next round
    console.log('Getting time until next round');
    const timeUntilNextRound = await getTimeUntilNextRound();
    console.log('Time until next round:', timeUntilNextRound, 'ms');
    
    // Format time for convenience
    const formattedTime = formatTimeRemaining(timeUntilNextRound);
    console.log('Formatted time until next round:', formattedTime);
    
    const response = {
      success: true,
      hasPlayed,
      timeUntilNextRound,
      formattedTimeUntilNextRound: formattedTime
    };
    
    console.log('Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking play status:", error);
    return NextResponse.json(
      { success: false, error: `Failed to check play status: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// Helper function to format time remaining
function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Available now";
  }
  
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
} 