import { NextResponse } from 'next/server';
import { getLocationByIndex, gameLocations } from '../../../data/gameLocations';
import { kv } from '@vercel/kv';
import { sendNotificationToAllSubscribers } from '../../../lib/notifs';
import { LOCATION_INDEX_KEY, LOCATION_UPDATED_KEY } from '../../../lib/kv';
import { revalidatePath } from 'next/cache';

// Key for storing the current location index
// const LOCATION_INDEX_KEY = 'current-location-index';

// Key for storing when the location was last updated
// const LOCATION_UPDATED_KEY = 'location-last-updated';

export async function GET(request: Request) {
  // Parse URL to get query parameters
  const url = new URL(request.url);
  const cronSecret = url.searchParams.get('cron_secret');

  // If cron_secret is provided, validate it
  if (cronSecret) {
    // Compare with your stored secret (from environment variables or config)
    const expectedSecret = process.env.CRON_SECRET;

    if (cronSecret !== expectedSecret) {
        return new Response('Unauthorized', {
          status: 401,
        });
      }
  } else {
    // Verify the request is from our cron job or admin
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', {
        status: 401,
      });
    }
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
    
    // Revalidate the home page to ensure it shows the new location
    revalidatePath('/');
    
    // Send a notification to all users who have added the frame
    try {
      console.log('Sending notifications to all subscribers...');
      const notificationResult = await sendNotificationToAllSubscribers(
        `${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} round begins now`,
        "The mystery location awaits"
      );
      // const notificationResult = await sendNotificationToAllSubscribers(
      //   `New round begins now`,
      //   "The mystery location awaits"
      // );
      
      console.log(`Sent notifications to ${notificationResult.totalUsers} users: ` +
        `${notificationResult.successCount} success, ` +
        `${notificationResult.failedCount} failed, ` +
        `${notificationResult.rateLimitedCount} rate limited, ` +
        `${notificationResult.noTokenCount} no token`);
    } catch (notificationError) {
      // Don't let notification errors prevent the location update
      console.error('Error sending notifications:', notificationError);
    }
    
    // Return success response
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