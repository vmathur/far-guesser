// Game states
export type GameState = 'viewing' | 'guessing' | 'results' | 'leaderboard';

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

// Define a type for dynamic indexing of the window object
export interface DynamicWindow extends Window {
  [key: string]: unknown;
}

// Add TypeScript type augmentations using ES2015 module syntax
declare global {
  interface Window {
    initializeStreetView?: () => void;
    initializeMap?: () => void;
    [key: string]: any; // Using any here is acceptable for global window properties
    google: {
      maps: {
        Map: new (
          container: HTMLElement,
          options: GoogleMapOptions
        ) => google.maps.Map;
        StreetViewPanorama: new (
          container: HTMLElement,
          options: {
            position: { lat: number; lng: number };
            pov: { heading: number; pitch: number };
            zoom: number;
            addressControl: boolean;
            showRoadLabels: boolean;
            linksControl: boolean;
            panControl: boolean;
            enableCloseButton: boolean;
            fullscreenControl: boolean;
            motionTracking: boolean;
            motionTrackingControl: boolean;
            zoomControl: boolean;
          }
        ) => google.maps.StreetViewPanorama;
        Marker: new (options: GoogleMarkerOptions) => google.maps.Marker;
        Animation: {
          DROP: number;
        };
        SymbolPath: {
          CIRCLE: number;
        };
        event: {
          removeListener: (listener: GoogleMapsEventListener) => void;
        }
      };
    };
  }
}

// Augment existing Google Maps types with ES2015 module syntax
declare global {
  namespace google {
    namespace maps {
      interface Map {
        addListener(event: string, handler: (e: any) => void): GoogleMapsEventListener;
        getCenter(): LatLng;
        getZoom(): number;
        setCenter(center: LatLngLiteral | LatLng): void;
        setZoom(zoom: number): void;
      }
      
      interface Marker {
        setMap(map: Map | null): void;
        getPosition(): {lat(): number, lng(): number} | null;
        addListener(event: string, handler: () => void): GoogleMapsEventListener;
      }
      
      interface MapMouseEvent {
        latLng: LatLng | null;
      }
      
      interface LatLng {
        lat(): number;
        lng(): number;
        toJSON(): LatLngLiteral;
        toString(): string;
        equals(other: LatLng): boolean;
      }
      
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      
      interface Size {
        width: number;
        height: number;
      }
      
      interface Point {
        x: number;
        y: number;
      }
      
      interface StreetViewPanorama {
        addListener(event: string, handler: () => void): GoogleMapsEventListener;
        getStatus(): string;
      }
    }
  }
}

// Interface for leaderboard entry
export interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
  timestamp?: number;
  isCurrentUser?: boolean;
} 