"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Guess, Location } from './types/LocationGuesserTypes';
import { calculateDistance } from './utils/GoogleMapsUtil';
import StreetView from './StreetView';
import GuessingMap from './GuessingMap';
import ResultsView from './ResultsView';
import LeaderboardView from './LeaderboardView';
import { gameConfig } from '../data/gameConfig';
import { useGameAnalytics } from '../lib/analytics';
import { submitUserGuess } from '../lib/playStatusHelpers';

interface LocationGuesserViewProps {
  dailyLocation: Location;
  initialGameState?: GameState;
  initialGuess?: Guess | null;
  onGameComplete?: (guess: Guess) => void;
  timeUntilNextRound?: number;
  fid?: number | null;
  username?: string | null;
  pfpUrl?: string | null;
}

const LocationGuesserView: React.FC<LocationGuesserViewProps> = ({ 
  dailyLocation, 
  initialGameState = 'viewing',
  initialGuess = null,
  onGameComplete,
  timeUntilNextRound,
  fid = null,
  username = null,
  pfpUrl = null
}) => {
  const [timeLeft, setTimeLeft] = useState(gameConfig.VIEWING_TIME_MS); // Use the configured time
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [guess, setGuess] = useState<Guess | null>(initialGuess);
  const [mapLoaded, setMapLoaded] = useState(false); // Add this state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const analytics = useGameAnalytics();

  // Timer effect - updates the timer in viewing state
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    
    // Only start the timer if the map has loaded
    if (gameState === 'viewing' && timeLeft > 0 && mapLoaded) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => Math.max(0, prev - 100)); // Decrease by 100ms
      }, 100); // Update every 100ms
    } else if (gameState === 'viewing' && timeLeft === 0) {
      // Track viewing_completed event when time runs out
      analytics.viewingCompleted();
      setGameState('guessing');
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [gameState, timeLeft, analytics, mapLoaded]); // Add mapLoaded to dependencies

  // Handle time running out
  const handleTimeEnd = () => {
    // Track viewing_completed event when time runs out
    analytics.viewingCompleted();
    setGameState('guessing');
  };

  // Handle map loaded event
  const handleMapLoaded = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Handle guess submission
  const handleGuessSubmitted = useCallback(async (submittedGuess: Guess) => {
    // Reset any previous error messages
    setErrorMessage(null);
    
    // Calculate distance
    const distance = calculateDistance(
      submittedGuess.position.lat, 
      submittedGuess.position.lng, 
      dailyLocation.position.lat,
      dailyLocation.position.lng
    );
    
    // Create a new guess with the calculated distance
    const guessWithDistance: Guess = {
      ...submittedGuess,
      distance
    };
    
    // Track guess_submitted event
    analytics.guessSubmitted({ distance });
    
    // Use the helper function to submit the guess
    if (fid) {
      const result = await submitUserGuess(fid, username, pfpUrl, guessWithDistance);
      
      if (!result.success) {
        setErrorMessage(result.error);
      }
    } else {
      // Handle case where user is not authenticated
      setErrorMessage("Unable to submit score - authentication required");
    }
    
    setGuess(guessWithDistance);
    setGameState('results');
    
    // Call the onGameComplete callback if provided
    if (onGameComplete) {
      onGameComplete(guessWithDistance);
    }
  }, [dailyLocation, analytics, fid, username, pfpUrl, onGameComplete]);

  // Handle going to next location or leaderboard
  const handleNextLocation = () => {
    if (gameState === 'results') {
      // When in results view, clicking "View Leaderboard" should go to leaderboard
      setGameState('leaderboard');
    } else if (gameState === 'leaderboard') {
      // When in leaderboard view, clicking "Back to Game" should go back to results or viewing
      if (guess) {
        setGameState('results');
      } else {
        setGameState('viewing');
      }
    } else {
      // Default fallback behavior
      setGameState('viewing');
    }
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'viewing':
        return (
          <StreetView
            currentLocation={dailyLocation}
            timeLeft={timeLeft}
            onTimeEnd={handleTimeEnd}
            onMapLoaded={handleMapLoaded}
          />
        );
      case 'guessing':
        return <GuessingMap onGuessSubmitted={handleGuessSubmitted} />;
      case 'results':
        return guess ? (
          <ResultsView
            guess={guess}
            pfpUrl={pfpUrl}
            actualLocation={dailyLocation}
            onNextLocation={handleNextLocation}
            errorMessage={errorMessage}
            timeUntilNextRound={timeUntilNextRound}
            fid={fid}
          />
        ) : null;
      case 'leaderboard':
        return <LeaderboardView onNextLocation={handleNextLocation} />;
      default:
        return null;
    }
  };

  return (
    <div className="game-container">
      {renderGameState()}
    </div>
  );
};

export default LocationGuesserView; 