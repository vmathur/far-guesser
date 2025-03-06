import { Location } from '../components/types/LocationGuesserTypes';

// Interface for location
export interface GameLocation {
  // Location data
  position: { lat: number; lng: number };
  answer: string;
  hint: string;
  
  // No scheduledDate anymore - we'll use the index in the array instead
}

// Array of all game locations
export const gameLocations: GameLocation[] = [
  { 
    position: { lat: 1.283404, lng: 103.863134 }, 
    answer: 'Singapore', 
    hint: 'Marina Bay'
  },
  { 
    position: { lat: 40.7580, lng: -73.9855 }, 
    answer: 'New York', 
    hint: 'Times Square'
  },
  { 
    position: { lat: 48.858093, lng: 2.294694 }, 
    answer: 'Paris', 
    hint: 'Near Eiffel Tower'
  },
  { 
    position: { lat: 51.510020, lng: -0.134730 }, 
    answer: 'London', 
    hint: 'Near Hyde Park'
  },
  { 
    position: { lat: 37.809307, lng: -122.475891 }, 
    answer: 'San Francisco', 
    hint: 'Golden Gate Bridge' 
  },
  { 
    position: { lat: 35.6595, lng: 139.7004 }, 
    answer: 'Tokyo', 
    hint: 'Shibuya Crossing' 
  },
  { 
    position: { lat: -33.8567, lng: 151.2131 }, 
    answer: 'Sydney', 
    hint: 'Near Sydney Opera House' 
  },
];

/**
 * Get all available locations
 */
export const locations: Location[] = gameLocations;

/**
 * Get a location by its index
 * @param index The index of the location in the gameLocations array
 * @returns The location at the specified index or undefined if index is invalid
 */
export function getLocationByIndex(index: number): Location | undefined {
  if (index >= 0 && index < gameLocations.length) {
    return gameLocations[index];
  }
  return undefined;
}

/**
 * Get a random location 
 * @returns A random location
 */
export function getRandomLocation(): Location {
  const randomIndex = Math.floor(Math.random() * gameLocations.length);
  return gameLocations[randomIndex];
}

/**
 * Get the index of a random location
 * @returns A random location index
 */
export function getRandomLocationIndex(): number {
  return Math.floor(Math.random() * gameLocations.length);
} 