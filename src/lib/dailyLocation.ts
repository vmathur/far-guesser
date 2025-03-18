import { kv } from '@vercel/kv';
import { getLocationByIndex, getRandomLocation } from '../data/gameLocations';
import { Location } from '../components/types/LocationGuesserTypes';

// Key for storing the current location index
const LOCATION_INDEX_KEY = 'current-location-index';

/**
 * Get the current game location
 * Priority order:
 * 1. Location index from KV storage (set by cron job or manual update)
 * 2. Random location (fallback)
 */
export async function getDailyLocation(): Promise<Location> {
  try {
    // Try to get the current location index from KV storage
    console.log('Getting location index from KV storage');
    const locationIndex = await kv.get<number>(LOCATION_INDEX_KEY);
    console.log('Location index:', locationIndex);
    if (locationIndex !== null && locationIndex !== undefined) {
      // Get the location using the stored index
      const location = getLocationByIndex(locationIndex);
      
      if (location) {
        console.log(`Using location index ${locationIndex} from KV storage: ${location.answer}`);
        return location;
      } else {
        console.log(`Invalid location index ${locationIndex} in KV storage, using random fallback`);
      }
    } else {
      console.log('No location index found in KV storage, using random fallback');
    }
    
    console.log('Location index:', locationIndex);
    // No valid location index in KV - use random location as fallback
    return getRandomLocation();
  } catch (error) {
    console.error('Error getting location:', error);
    
    // Fallback to random location if there's an error
    console.log('Using random location after error');
    return getRandomLocation();
  }
} 