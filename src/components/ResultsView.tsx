"use client";

import React, { useEffect, useState } from 'react';
import { Guess, Location } from './types/LocationGuesserTypes';
import { useGameAnalytics } from '../lib/analytics';
import { UserGuess } from './types/UserGuess';
import ResultsMap from './ResultsMap';
import LeaderboardPreview from './LeaderboardPreview';
import ActionButtons from './ActionButtons';

interface ResultsViewProps {
  guess: Guess;
  actualLocation: Location;
  onNextLocation: () => void;
  errorMessage?: string | null;
  timeUntilNextRound?: number;
  fid?: number | null;
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  guess, 
  actualLocation, 
  onNextLocation,
  errorMessage = null,
  timeUntilNextRound,
  fid = null
}) => {
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<any[]>([]);
  const analytics = useGameAnalytics();
  const [otherUsersGuesses, setOtherUsersGuesses] = useState<UserGuess[]>([]);
  console.log("Component rendering"); // Will run on every render

  // Track results_viewed event when component mounts
  useEffect(() => {
    if (guess?.distance) {
      analytics.resultsViewed({ distance: guess.distance });
    }
  }, [guess, analytics]);
  
  // Fetch other users' guesses when fid is loaded and process leaderboard data
  useEffect(() => {
    const fetchOtherUsersGuesses = async () => {
      try {
        setLeaderboardLoading(true);
        
        // Add FID to headers if available
        const headers = new Headers();
        if (fid) {
          headers.append('X-Farcaster-User-FID', fid.toString());
        }

        const response = await fetch('/api/leaderboard?type=daily&include_guesses=true', {
          headers
        });
        const data = await response.json();
        
        console.log("Leaderboard API response:", data);
        
        if (data.success && data.leaderboard) {
          // Store the full daily leaderboard
          setDailyLeaderboard(data.leaderboard);
          
          // Filter out the current user's guess and entries without position data for map markers
          const otherGuesses = data.leaderboard
            .filter((entry: any) => {
              const isCurrentUser = fid && 
                entry.fid && 
                entry.fid.toString() === fid.toString();
              
              const hasValidPosition = entry.position && entry.position.lat && entry.position.lng;
              
              return !isCurrentUser && hasValidPosition;
            })
            .map((entry: any) => ({
              name: entry.name,
              fid: entry.fid,
              pfpUrl: entry.pfpUrl,
              position: {
                lat: entry.position.lat,
                lng: entry.position.lng
              },
              score: entry.score,
              distance: entry.distance
            }));
          
          setOtherUsersGuesses(otherGuesses);
        } else {
          console.warn("API response missing success or leaderboard data", data);
        }
        
        setLeaderboardLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setLeaderboardLoading(false);
      }
    };
    
    fetchOtherUsersGuesses();
  }, [fid]);

  return (
    <div style={{ 
      textAlign: 'center',
      padding: '10px',
      color: '#000'
    }}>
      
      {errorMessage && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ffcdd2',
          fontFamily: `"Patrick Hand", "Comic Sans MS", cursive`
        }}>
          {errorMessage}
        </div>
      )}
      
      <div style={{ 
        fontSize: '20px', 
        marginBottom: '20px', 
        color: '#000',
        fontFamily: `"Patrick Hand", "Comic Sans MS", cursive`
      }}>
        <p style={{ fontSize: '30px' }}><b>You were <strong>{guess.distance.toLocaleString()}</strong> km away</b></p>
      </div>
      
      {/* Action Buttons for Mint and Share */}
      <ActionButtons distance={guess.distance} />
      
      {/* Results Map */}
      <ResultsMap 
        guess={guess}
        actualLocation={actualLocation}
        otherUsersGuesses={otherUsersGuesses}
        timeUntilNextRound={timeUntilNextRound}
      />
      
      {/* Leaderboard Preview */}
      <LeaderboardPreview
        dailyLeaderboard={dailyLeaderboard}
        leaderboardLoading={leaderboardLoading}
        fid={fid}
        onNextLocation={onNextLocation}
      />
    </div>
  );
};

export default ResultsView; 