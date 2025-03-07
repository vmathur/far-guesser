import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordUserPlay } from '../../../lib/kv';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';

// Schema for validation
const recordPlaySchema = z.object({
  fid: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Received record-play request');
    
    // Get FID from header or from session
    const fidFromHeader = request.headers.get('X-Farcaster-User-FID');
    console.log('FID from header:', fidFromHeader);
    
    // Ensure the user is authenticated via session or header
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Exists' : 'Not found', 'User FID:', session?.user?.fid);
    
    // Use header FID first, then fallback to session FID
    const headerFid = fidFromHeader ? parseInt(fidFromHeader, 10) : null;
    const sessionFid = session?.user?.fid;
    
    // Parse and validate the request body
    const requestJson = await request.json().catch(err => {
      console.error('Error parsing JSON:', err);
      return null;
    });
    
    console.log('Request body:', requestJson);
    
    if (!requestJson) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const result = recordPlaySchema.safeParse(requestJson);
    
    if (!result.success) {
      console.log('Validation error:', result.error.errors);
      return NextResponse.json(
        { success: false, error: result.error.errors },
        { status: 400 }
      );
    }
    
    // Get the FID from the body
    const bodyFid = result.data.fid;
    
    // Prioritize which FID to use based on availability
    // 1. Use header FID if available
    // 2. Otherwise use session FID if available
    // 3. Finally use body FID if no other option
    const fidToUse = headerFid || sessionFid || bodyFid;
    
    if (!fidToUse) {
      console.log('No valid FID available from any source');
      return NextResponse.json(
        { success: false, error: 'No valid FID available' },
        { status: 400 }
      );
    }
    
    // Validate if body FID matches the authenticated FID
    if (bodyFid !== fidToUse) {
      console.log(`FID mismatch: body=${bodyFid}, using=${fidToUse}`);
      console.log('Warning: Body FID does not match authenticated FID, using authenticated FID instead');
    }
    
    // Record the user's play
    console.log(`Recording play for user ${fidToUse}`);
    await recordUserPlay(fidToUse);
    console.log(`Successfully recorded play for user ${fidToUse}`);
    
    return NextResponse.json({ success: true, fid: fidToUse });
  } catch (error) {
    console.error("Error recording play:", error);
    return NextResponse.json(
      { success: false, error: `Failed to record play: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 