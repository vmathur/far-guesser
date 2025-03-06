// Shared types for location guesser components

// Game states
export type GameState = 'viewing' | 'guessing' | 'results' | 'leaderboard';

// Game modes
export type GameMode = 'random' | 'daily';

// Interface for location data
export interface Location {
  position: { lat: number; lng: number };
  answer: string;
  hint: string;
}

// Interface for guess data
export interface Guess {
  position: { lat: number; lng: number };
  distance: number;
}

// Define proper type-safe event listener for Google Maps
export interface GoogleMapsEventListener {
  remove(): void;
}

// Define interface for Google Maps options
export interface GoogleMapOptions {
  center: { lat: number; lng: number };
  zoom: number;
  streetViewControl?: boolean;
  mapTypeControl?: boolean;
  fullscreenControl?: boolean;
  zoomControl?: boolean;
  [key: string]: unknown;
}

// Define interface for Google Marker options
export interface GoogleMarkerOptions {
  position: google.maps.LatLng | google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  draggable?: boolean;
  animation?: number;
  icon?: string | {
    path?: number;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
  };
  label?: string | {
    text: string;
    color?: string;
    fontWeight?: string;
  };
  [key: string]: unknown;
}

// Interface for leaderboard entry
export interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
  timestamp?: number;
  isCurrentUser?: boolean;
}

// Interface for user status
export interface UserStatus {
  authenticated: boolean;
  hasPlayed: boolean;
}

// Interface for daily location response
export interface DailyLocationResponse {
  success: boolean;
  location: Location;
  date: string;
  userStatus: UserStatus;
}

// Error response from the API
export interface ErrorResponse {
  success: false;
  error: string;
} 