import { NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Helper function to get user play key (same as in kv.ts)
function getUserRoundPlayKey(fid: number): string {
  return `far-guesser:user-play:${fid}`;
}

export async function POST(request: Request) {
  console.log('🔄 Reset-play-status endpoint called');
  
  // Parse URL to get query parameters
  const url = new URL(request.url);
  const cronSecret = url.searchParams.get('secret');
  const fidParam = url.searchParams.get('fid');
  
  console.log(`📊 Requested to reset play status for FID: ${fidParam}`);

  // Check authentication using secret
  if (cronSecret) {
    // Compare with your stored secret (from environment variables)
    const expectedSecret = process.env.CRON_SECRET;

    if (cronSecret !== expectedSecret) {
      console.log('❌ Authentication failed: Invalid secret parameter');
      return new Response('Unauthorized', {
        status: 401,
      });
    }
  } else {
    // Verify using authorization header as fallback
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Authentication failed: Invalid authorization header');
      return new Response('Unauthorized', {
        status: 401,
      });
    }
  }

  try {
    // Validate FID parameter
    if (!fidParam) {
      console.log('❌ Error: Missing required fid parameter');
      return NextResponse.json({ 
        error: 'Missing required query parameter: fid' 
      }, { status: 400 });
    }

    const fid = parseInt(fidParam, 10);
    
    // Validate the FID is a number
    if (isNaN(fid) || fid <= 0) {
      console.log(`❌ Error: Invalid fid parameter: "${fidParam}" is not a valid FID`);
      return NextResponse.json({ 
        error: 'Invalid fid parameter: must be a positive number' 
      }, { status: 400 });
    }

    // Get the user play key
    const userPlayKey = getUserRoundPlayKey(fid);
    
    // Delete the user's play record
    await redis.del(userPlayKey);
    
    console.log(`✅ Successfully reset play status for FID ${fid}`);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: `Play status reset for FID ${fid}`,
      fid: fid
    });
  } catch (error) {
    console.error('❌ Error resetting play status:', error);
    return NextResponse.json({ 
      error: `Failed to reset play status: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 