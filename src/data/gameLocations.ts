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
  { 
    position: { lat: 41.8902, lng: 12.4922 }, 
    answer: 'Rome', 
    hint: 'Colosseum' 
  },
  { 
    position: { lat: 25.1972, lng: 55.2744 }, 
    answer: 'Dubai', 
    hint: 'Burj Khalifa' 
  },
  { 
    position: { lat: 40.4168, lng: -3.7038 }, 
    answer: 'Madrid', 
    hint: 'Plaza Mayor' 
  },
  { 
    position: { lat: 52.5200, lng: 13.4050 }, 
    answer: 'Berlin', 
    hint: 'Brandenburg Gate' 
  },
  { 
    position: { lat: 55.7558, lng: 37.6173 }, 
    answer: 'Moscow', 
    hint: 'Red Square' 
  },
  { 
    position: { lat: -22.9068, lng: -43.1729 }, 
    answer: 'Rio de Janeiro', 
    hint: 'Christ the Redeemer' 
  },
  { 
    position: { lat: 30.0444, lng: 31.2357 }, 
    answer: 'Cairo', 
    hint: 'Near the Pyramids' 
  },
  { 
    position: { lat: 13.7563, lng: 100.5018 }, 
    answer: 'Bangkok', 
    hint: 'Grand Palace' 
  },
  { 
    position: { lat: 45.4215, lng: -75.6972 }, 
    answer: 'Ottawa', 
    hint: 'Parliament Hill' 
  },
  { 
    position: { lat: -34.6037, lng: -58.3816 }, 
    answer: 'Buenos Aires', 
    hint: 'Plaza de Mayo' 
  },
  { 
    position: { lat: 59.3293, lng: 18.0686 }, 
    answer: 'Stockholm', 
    hint: 'Gamla Stan' 
  },
  { 
    position: { lat: 37.9838, lng: 23.7275 }, 
    answer: 'Athens', 
    hint: 'Acropolis' 
  },
  { 
    position: { lat: 41.0082, lng: 28.9784 }, 
    answer: 'Istanbul', 
    hint: 'Hagia Sophia' 
  },
  { 
    position: { lat: 19.4326, lng: -99.1332 }, 
    answer: 'Mexico City', 
    hint: 'Zócalo' 
  },
  { 
    position: { lat: 31.2304, lng: 121.4737 }, 
    answer: 'Shanghai', 
    hint: 'The Bund' 
  },
  { 
    position: { lat: 43.7696, lng: 11.2558 }, 
    answer: 'Florence', 
    hint: 'Duomo' 
  },
  { 
    position: { lat: 45.4408, lng: 12.3155 }, 
    answer: 'Venice', 
    hint: 'Grand Canal' 
  },
  { 
    position: { lat: 48.2082, lng: 16.3738 }, 
    answer: 'Vienna', 
    hint: 'Schönbrunn Palace' 
  },
  { 
    position: { lat: 50.0755, lng: 14.4378 }, 
    answer: 'Prague', 
    hint: 'Charles Bridge' 
  },
  { 
    position: { lat: 33.8688, lng: 151.2093 }, 
    answer: 'Sydney', 
    hint: 'Harbour Bridge' 
  },
  { 
    position: { lat: 22.3193, lng: 114.1694 }, 
    answer: 'Hong Kong', 
    hint: 'Victoria Harbour' 
  },
  { 
    position: { lat: 1.3521, lng: 103.8198 }, 
    answer: 'Singapore', 
    hint: 'Gardens by the Bay' 
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