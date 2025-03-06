"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Guess, Location } from './types/LocationGuesserTypes';
import { calculateDistance } from './utils/GoogleMapsUtil';
import { locations } from '../data/locations';
import StreetView from './StreetView';
import GuessingMap from './GuessingMap';
import ResultsView from './ResultsView';
import LeaderboardView from './LeaderboardView';

interface LocationGuesserViewProps {
  selectedFont: string;
}

const LocationGuesserView: React.FC<LocationGuesserViewProps> = ({ selectedFont }) => {
  const [timeLeft, setTimeLeft] = useState(10000); // In milliseconds (10 seconds)
  const [gameState, setGameState] = useState<GameState>('viewing');
  const [guess, setGuess] = useState<Guess | null>(null);
  
  // Select a random location on component mount
  const [currentLocation, setCurrentLocation] = useState<Location>(() => {
    return locations[Math.floor(Math.random() * locations.length)];
  });

  // Timer effect - updates the timer in viewing state
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    
    if (gameState === 'viewing' && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => Math.max(0, prev - 100)); // Decrease by 100ms
      }, 100); // Update every 100ms
    } else if (gameState === 'viewing' && timeLeft === 0) {
      setGameState('guessing');
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [gameState, timeLeft]);

  // Handle time running out
  const handleTimeEnd = () => {
    setGameState('guessing');
  };

  // Handle guess submission
  const handleGuessSubmitted = useCallback((submittedGuess: Guess) => {
    // Calculate distance
    const distance = calculateDistance(
      submittedGuess.position.lat, 
      submittedGuess.position.lng, 
      currentLocation.position.lat,
      currentLocation.position.lng
    );
    
    // Create a new guess with the calculated distance
    const guessWithDistance: Guess = {
      ...submittedGuess,
      distance
    };
    
    setGuess(guessWithDistance);
    setGameState('results');
  }, [currentLocation]);

  // Handle going to next location or leaderboard
  const handleNextLocation = () => {
    setGameState('leaderboard');
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'viewing':
        return (
          <StreetView
            currentLocation={currentLocation}
            timeLeft={timeLeft}
            onTimeEnd={handleTimeEnd}
          />
        );
      case 'guessing':
        return <GuessingMap onGuessSubmitted={handleGuessSubmitted} />;
      case 'results':
        return guess ? (
          <ResultsView
            guess={guess}
            actualLocation={currentLocation}
            onNextLocation={handleNextLocation}
            selectedFont={selectedFont}
          />
        ) : null;
      case 'leaderboard':
        return <LeaderboardView onNextLocation={handleNextLocation} selectedFont={selectedFont} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: `"${selectedFont}", sans-serif`
    }}>
      {renderGameState()}
    </div>
  );
};

export default LocationGuesserView; 