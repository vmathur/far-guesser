import { NextResponse } from 'next/server';
import { getLocationByIndex, gameLocations } from '../../../data/gameLocations';
import { kv } from '@vercel/kv';
import { LOCATION_INDEX_KEY, LOCATION_UPDATED_KEY } from '../../../lib/kv';

export async function POST(request: Request) {
  console.log('🔄 Set-location endpoint called');
  
  // Parse URL to get query parameters
  const url = new URL(request.url);
  const cronSecret = url.searchParams.get('cron_secret');
  const targetIndexParam = url.searchParams.get('index');
  
  console.log(`📊 Requested to set location index to: ${targetIndexParam}`);

  // If cron_secret is provided, validate it
  if (cronSecret) {
    // Compare with your stored secret (from environment variables or config)
    const expectedSecret = process.env.CRON_SECRET;

    if (cronSecret !== expectedSecret) {
        console.log('❌ Authentication failed: Invalid cron_secret parameter');
        return new Response('Unauthorized', {
          status: 401,
        });
      }
  } else {
    // Verify the request is from our cron job or admin
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Authentication failed: Invalid authorization header');
      return new Response('Unauthorized', {
        status: 401,
      });
    }
  }

  try {
    // Validate and parse the target index
    if (!targetIndexParam) {
      console.log('❌ Error: Missing required index parameter');
      return NextResponse.json({ 
        error: 'Missing required query parameter: index' 
      }, { status: 400 });
    }

    const targetIndex = parseInt(targetIndexParam, 10);
    
    // Validate the index is a number and within the valid range
    if (isNaN(targetIndex)) {
      console.log(`❌ Error: Invalid index parameter: "${targetIndexParam}" is not a number`);
      return NextResponse.json({ 
        error: 'Invalid index parameter: must be a number' 
      }, { status: 400 });
    }

    if (targetIndex < 0 || targetIndex >= gameLocations.length) {
      console.log(`❌ Error: Index out of range: ${targetIndex} (must be between 0 and ${gameLocations.length - 1})`);
      return NextResponse.json({ 
        error: `Index out of range: must be between 0 and ${gameLocations.length - 1}`,
        totalLocations: gameLocations.length
      }, { status: 400 });
    }

    // Get the location for the target index
    const location = getLocationByIndex(targetIndex);
    
    if (!location) {
      console.log(`❌ Error: Failed to get location for index ${targetIndex}`);
      return NextResponse.json({ error: 'Failed to get location for index' }, { status: 500 });
    }

    // Get the current index for logging
    const currentIndex = await kv.get<number>(LOCATION_INDEX_KEY);
    console.log(`🔄 Changing location index from ${currentIndex} to ${targetIndex} (${location.answer})`);

    // Store the index in KV
    await kv.set(LOCATION_INDEX_KEY, targetIndex);
    
    // Store the update timestamp
    const now = new Date();
    await kv.set(LOCATION_UPDATED_KEY, now.toISOString());
    
    console.log(`✅ Successfully set location to index ${targetIndex} (${location.answer})`);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: `Location set to index ${targetIndex} (${location.answer})`,
      locationIndex: targetIndex,
      locationName: location.answer,
      updatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('❌ Error setting location:', error);
    return NextResponse.json({ error: 'Failed to set location' }, { status: 500 });
  }
} 