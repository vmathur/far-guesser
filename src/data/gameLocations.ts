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
    position: { lat: 33.987471, lng: -118.472732 }, 
    answer: 'Venice', 
    hint: 'Beach'
  },
  { 
    position: { lat: 45.4215, lng: -75.6972 }, 
    answer: 'Ottawa', 
    hint: 'Parliament Hill' 
  },
  { 
    position: { lat: 55.860085, lng: -4.265149 }, 
    answer: 'Glasgow', 
    hint: 'UK'
  },
  { 
    position: { lat: 32.759035, lng: 130.276722 }, 
    answer: 'Fukuoka', 
    hint: 'Japan'
  },
  {
    position: { lat: 42.9299596, lng: 25.867500 },
    answer: 'Sofia',
    hint: 'Bulgaria'
  },
  { 
    position: { lat: 6.509123, lng: 3.366910 }, 
    answer: 'Lagos', 
    hint: 'Nigeria, Africa' 
  },
  { 
    position: { lat: 35.6595, lng: 139.7004 }, 
    answer: 'Tokyo', 
    hint: 'Shibuya Crossing' 
  },
  {
    position: { lat: -33.456180, lng: -70.968689 },
    answer: 'Santiago',
    hint: 'Chile'
  },
  {
    position: { lat: 37.529262, lng: 126.841435 },
    answer: 'Seoul',
    hint: 'South Korea'
  },
  { 
    position: { lat: 25.1972, lng: 55.2744 }, 
    answer: 'Dubai', 
    hint: 'Burj Khalifa' 
  },
  {
    position: { lat: 38.954994, lng: 1.446618 },
    answer: 'Barcelona',
    hint: 'Spain'
  },
  { 
    position: { lat: -33.8567, lng: 151.2131 }, 
    answer: 'Sydney', 
    hint: 'Near Sydney Opera House' 
  },
  {
    position: { lat: 52.00924, lng: 4.542049 }, 
    answer: 'Amsterdam',
    hint: 'Netherlands'
  },
  {
    position: { lat: 30.038488, lng: -99.121863 },
    answer: 'San Antonio',
    hint: 'Texas'
  },
  { 
    position: { lat: 40.4168, lng: -3.7038 }, 
    answer: 'Madrid', 
    hint: 'Plaza Mayor' 
  },
  {
    position: { lat: 20.685773, lng: -156.444236},
    answer: 'Hawaii', 
    hint: 'beach' 
  },
  {
    position: {lat: 46.228594, lng: 7.433393},
    answer: 'switzerland', //thursday
    hint :'mountains',
  },
  {
    position: {lat: 26.984327, lng: 75.853727},
    answer: 'Rajasthan', //friday
    hint: 'palace'
  },
  {
    position: {lat: -33.923370, lng: 18.417895},
    answer: 'cape town', //saturday
    hint: 'SA'
  },
  {
    position: {lat: 8.943565, lng:-79.564024},
    answer: 'panama', //sunday
    hint: 'bridge'
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
  {
    position: { lat: 43.6532, lng: -79.3832 },
    answer: 'Toronto',
    hint: 'CN Tower'
  },
  {
    position: { lat: 47.6062, lng: -122.3321 },
    answer: 'Seattle',
    hint: 'Space Needle'
  },
  {
    position: { lat: 39.9042, lng: 116.4074 },
    answer: 'Beijing',
    hint: 'Forbidden City'
  },
  {
    position: { lat: 41.3851, lng: 2.1734 },
    answer: 'Barcelona',
    hint: 'Sagrada Familia'
  },
  {
    position: { lat: 48.8566, lng: 2.3522 },
    answer: 'Paris',
    hint: 'Eiffel Tower'
  },
  {
    position: { lat: 51.5074, lng: -0.1278 },
    answer: 'London',
    hint: 'Big Ben'
  },
  {
    position: { lat: 40.7128, lng: -74.0060 },
    answer: 'New York',
    hint: 'Central Park'
  },
  {
    position: { lat: 34.0522, lng: -118.2437 },
    answer: 'Los Angeles',
    hint: 'Hollywood'
  },
  {
    position: { lat: 41.9028, lng: 12.4964 },
    answer: 'Rome',
    hint: 'Colosseum'
  },
  {
    position: { lat: 52.3676, lng: 4.9041 },
    answer: 'Amsterdam',
    hint: 'Canal District'
  },
  {
    position: { lat: 55.6761, lng: 12.5683 },
    answer: 'Copenhagen',
    hint: 'Nyhavn'
  },
  {
    position: { lat: 59.9139, lng: 10.7522 },
    answer: 'Oslo',
    hint: 'Viking Ship Museum'
  },
  {
    position: { lat: 60.1699, lng: 24.9384 },
    answer: 'Helsinki',
    hint: 'Market Square'
  },
  {
    position: { lat: 52.2297, lng: 21.0122 },
    answer: 'Warsaw',
    hint: 'Old Town'
  },
  {
    position: { lat: 47.4979, lng: 19.0402 },
    answer: 'Budapest',
    hint: 'Chain Bridge'
  },
  {
    position: { lat: 45.4642, lng: 9.1900 },
    answer: 'Milan',
    hint: 'Duomo'
  },
  {
    position: { lat: 37.7749, lng: -122.4194 },
    answer: 'San Francisco',
    hint: 'Golden Gate Bridge'
  },
  {
    position: { lat: 39.7392, lng: -104.9903 },
    answer: 'Denver',
    hint: 'Rocky Mountains'
  },
  {
    position: { lat: 29.7604, lng: -95.3698 },
    answer: 'Houston',
    hint: 'Space Center'
  },
  {
    position: { lat: 41.8781, lng: -87.6298 },
    answer: 'Chicago',
    hint: 'Cloud Gate'
  },
  {
    position: { lat: 25.7617, lng: -80.1918 },
    answer: 'Miami',
    hint: 'South Beach'
  },
  {
    position: { lat: 45.5155, lng: -122.6789 },
    answer: 'Portland',
    hint: 'Rose Garden'
  },
  {
    position: { lat: 36.1699, lng: -115.1398 },
    answer: 'Las Vegas',
    hint: 'Strip'
  },
  {
    position: { lat: 32.7157, lng: -117.1611 },
    answer: 'San Diego',
    hint: 'Zoo'
  },
  {
    position: { lat: 47.6062, lng: -122.3321 },
    answer: 'Seattle',
    hint: 'Pike Place'
  },
  {
    position: { lat: 39.9612, lng: -82.9988 },
    answer: 'Columbus',
    hint: 'Ohio State'
  },
  {
    position: { lat: 42.3601, lng: -71.0589 },
    answer: 'Boston',
    hint: 'Freedom Trail'
  },
  {
    position: { lat: 38.9072, lng: -77.0369 },
    answer: 'Washington DC',
    hint: 'National Mall'
  },
  {
    position: { lat: 35.6762, lng: 139.6503 },
    answer: 'Shibuya',
    hint: 'Tokyo District'
  },
  {
    position: { lat: 40.7484, lng: -73.9857 },
    answer: 'Manhattan',
    hint: 'NYC Borough'
  },
  {
    position: { lat: 22.5431, lng: 114.0579 },
    answer: 'Shenzhen',
    hint: 'Tech Hub'
  },
  {
    position: { lat: 19.4326, lng: -99.1332 },
    answer: 'Mexico City',
    hint: 'Zócalo'
  },
  {
    position: { lat: -33.4489, lng: -70.6693 },
    answer: 'Santiago',
    hint: 'Andes Mountains'
  },
  {
    position: { lat: 6.5244, lng: 3.3792 },
    answer: 'Lagos',
    hint: 'Nigeria'
  },
  {
    position: { lat: 1.2921, lng: 36.8219 },
    answer: 'Nairobi',
    hint: 'Kenya'
  },
  {
    position: { lat: 33.9716, lng: -6.8498 },
    answer: 'Rabat',
    hint: 'Morocco'
  }
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