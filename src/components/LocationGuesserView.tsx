"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Guess, Location } from './types/LocationGuesserTypes';
import { calculateDistance } from './utils/GoogleMapsUtil';
import StreetView from './StreetView';
import GuessingMap from './GuessingMap';
import ResultsView from './ResultsView';
import LeaderboardView from './LeaderboardView';
import { gameConfig } from '../lib/gameConfig';
import { useGameAnalytics } from '../lib/analytics';
import { getUserFid, getUserName } from '../lib/analytics';

interface LocationGuesserViewProps {
  selectedFont: string;
  dailyLocation: Location;
}

const LocationGuesserView: React.FC<LocationGuesserViewProps> = ({ selectedFont, dailyLocation }) => {
  const [timeLeft, setTimeLeft] = useState(gameConfig.VIEWING_TIME_MS); // Use the configured time
  const [gameState, setGameState] = useState<GameState>('viewing');
  const [guess, setGuess] = useState<Guess | null>(null);
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
    
    // Submit score to leaderboard
    try {
      const userFid = getUserFid();
      const username = getUserName();
      console.log('Submitting score to leaderboard with FID:', userFid, 'and username:', username);
      
      // Create a valid name that doesn't exceed 20 characters
      let userName = "Anonymous";
      
      // Use Farcaster username if available, fall back to FID-based name
      if (username) {
        // Use the actual Farcaster username
        userName = username;
        // Truncate if necessary
        if (userName.length > 30) {
          userName = userName.slice(0, 30);
        }
      } else if (userFid) {
        // Fall back to FID-based name if no username is available
        userName = `User ${userFid.slice(0, 15)}`;
        // Further truncate if still too long
        if (userName.length > 30) {
          userName = userName.slice(0, 30);
        }
      }
      
      const leaderboardResponse = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName,
          distance: distance,
          fid: userFid || undefined // Ensure fid is undefined if null or empty
        }),
      });
      
      const data = await leaderboardResponse.json();
      if (!data.success) {
        console.error('Failed to submit score to leaderboard:', data.error);
        
        // Check if this is a duplicate submission error
        if (leaderboardResponse.status === 403) {
          setErrorMessage(data.error || "You've already played today. Your score was not saved.");
          // Still show results but with the error message
        }
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      setErrorMessage("An error occurred while submitting your score. Please try again later.");
    }
    
    setGuess(guessWithDistance);
    setGameState('results');
  }, [dailyLocation, analytics]);

  // Handle going to next location or leaderboard
  const handleNextLocation = () => {
    setGameState('leaderboard');
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
            actualLocation={dailyLocation}
            onNextLocation={handleNextLocation}
            selectedFont={selectedFont}
            errorMessage={errorMessage}
          />
        ) : null;
      case 'leaderboard':
        return <LeaderboardView onNextLocation={handleNextLocation} selectedFont={selectedFont} />;
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