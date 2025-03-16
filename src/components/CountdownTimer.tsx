"use client";

import React, { useEffect, useState } from 'react';
import { TimeRemaining } from './types/UserGuess';

interface CountdownTimerProps {
  timeUntilNextRound?: number; // Time in milliseconds
  selectedFont?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  timeUntilNextRound,
  selectedFont = 'Chalkboard SE' 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ 
    hours: 24, 
    minutes: 0, 
    seconds: 0 
  });

  // Calculate and update the countdown timer
  useEffect(() => {
    // Calculate end time based on timeUntilNextRound (in milliseconds) or default to 24 hours
    const now = new Date();
    const endTime = new Date();
    
    if (timeUntilNextRound !== undefined) {
      // Add timeUntilNextRound milliseconds to the current time
      endTime.setTime(now.getTime() + timeUntilNextRound);
    } else {
      // Fallback to 24 hours if timeUntilNextRound is not provided
      endTime.setHours(endTime.getHours() + 24);
    }
    
    const timerInterval = setInterval(() => {
      const currentTime = new Date();
      const diff = endTime.getTime() - currentTime.getTime();
      
      if (diff <= 0) {
        // Timer completed
        clearInterval(timerInterval);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds });
    }, 1000);
    
    // Cleanup
    return () => clearInterval(timerInterval);
  }, [timeUntilNextRound]);

  return (
    <div style={{
      position: 'absolute',
      top: '5px',
      left: '5px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      zIndex: 10,
      fontFamily: selectedFont,
      fontSize: '16px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ marginRight: '8px' }}>Next round:</div>
      <div style={{ fontWeight: 'bold' }}>
        {String(timeRemaining.hours).padStart(2, '0')}:
        {String(timeRemaining.minutes).padStart(2, '0')}:
        {String(timeRemaining.seconds).padStart(2, '0')}
      </div>
    </div>
  );
};

export default CountdownTimer; 