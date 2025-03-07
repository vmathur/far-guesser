import { NextResponse } from 'next/server';
import { getLocationByIndex, gameLocations } from '../../../data/gameLocations';
import { kv } from '@vercel/kv';

// Key for storing the current location index
const LOCATION_INDEX_KEY = 'current-location-index';

// Key for storing when the location was last updated
const LOCATION_UPDATED_KEY = 'location-last-updated';

export async function GET(request: Request) {
  // Verify the request is from our cron job or admin
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    let locationIndex: number;
    
    // Get the current index and increment it
    const currentIndex = await kv.get<number>(LOCATION_INDEX_KEY);
    
    if (currentIndex !== null && currentIndex !== undefined) {
      // Increment the index, wrapping around if needed
      locationIndex = (currentIndex + 1) % gameLocations.length;
      console.log(`Incrementing location from ${currentIndex} to ${locationIndex}`);
    } else {
      // No current index found, start from the beginning
      locationIndex = 0;
      console.log(`No current index found, starting from index 0`);
    }

    // Get the location for the selected index
    const location = getLocationByIndex(locationIndex);
    
    if (!location) {
      return NextResponse.json({ error: 'Failed to get location for index' }, { status: 500 });
    }

    // Store the index in KV
    await kv.set(LOCATION_INDEX_KEY, locationIndex);
    
    // Store the update timestamp
    const now = new Date();
    await kv.set(LOCATION_UPDATED_KEY, now.toISOString());
    
    return NextResponse.json({ 
      success: true, 
      message: `Location updated to ${location.answer}`,
      locationIndex,
      locationName: location.answer,
      updatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
} 