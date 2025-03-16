// Types for user guesses in the results view
export interface UserGuess {
  name: string;
  fid?: string;
  pfpUrl?: string;
  position: {
    lat: number;
    lng: number;
  };
  score: number;
  distance: number;
}

// Type for the SDK context
export interface FrameSDKContext {
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
  };
  frames?: {
    frameUrl?: string;
    castId?: {
      fid?: number;
      hash?: string;
    };
  };
}

// Type for countdown timer
export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
} 