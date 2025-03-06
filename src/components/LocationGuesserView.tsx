"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Guess, Location } from './types/LocationGuesserTypes';
import { calculateDistance } from './utils/GoogleMapsUtil';
import { locations } from '../data/locations';
import StreetView from './StreetView';
import GuessingMap from './GuessingMap';
import ResultsView from './ResultsView';
import LeaderboardView from './LeaderboardView';

const LocationGuesserView = () => {
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
      // Time's up, move to guessing state
      setGameState('guessing');
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timeLeft, gameState]);

  // Time's up handler (passed to StreetView component)
  const handleTimeEnd = useCallback(() => {
    setGameState('guessing');
  }, []);

  // Reset the game and move to the next location
  const goToNextLocation = useCallback(() => {
    // If we're on the results screen, go to leaderboard instead of starting a new game
    if (gameState === 'results') {
      setGameState('leaderboard');
      return;
    }
    
    // Reset the game state
    setGameState('viewing');
    setTimeLeft(10000); // Reset to 10 seconds in milliseconds
    setGuess(null);
    
    // Select a new random location
    let newLocation: Location;
    do {
      newLocation = locations[Math.floor(Math.random() * locations.length)];
    } while (newLocation.position.lat === currentLocation.position.lat && 
             newLocation.position.lng === currentLocation.position.lng);
    
    setCurrentLocation(newLocation);
  }, [currentLocation, gameState]);

  // Handle guess submission (passed to GuessingMap component)
  const handleGuessSubmitted = useCallback((submittedGuess: Guess) => {
    // Calculate the distance between the guess and actual location
    const distance = calculateDistance(
      submittedGuess.position.lat,
      submittedGuess.position.lng,
      currentLocation.position.lat,
      currentLocation.position.lng
    );
    
    // Update the guess with the calculated distance
    const guessWithDistance: Guess = {
      ...submittedGuess,
      distance
    };
    
    setGuess(guessWithDistance);
    setGameState('results');
  }, [currentLocation]);

  // Content based on game state
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
        if (!guess) return <div>Error: No guess data available.</div>;
        
        return (
          <ResultsView
            guess={guess}
            actualLocation={currentLocation}
            onNextLocation={goToNextLocation}
          />
        );
      
      case 'leaderboard':
        return <LeaderboardView onPlayAgain={goToNextLocation} />;
      
      default:
        return <div>Unknown game state.</div>;
    }
  };

  return (
    <div>
      {/* Game Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>        
        {/* Game content based on state */}
        {renderGameState()}
      </div>
    </div>
  );
};

export default LocationGuesserView; 