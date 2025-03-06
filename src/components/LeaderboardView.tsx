"use client";

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from './types/LocationGuesserTypes';

interface LeaderboardViewProps {
  onPlayAgain: () => void;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onPlayAgain }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be a real API call
        // For now, let's simulate some data
        const mockData: LeaderboardEntry[] = [
          { name: 'Player 1', score: 2345, rank: 1, timestamp: Date.now() - 1000000 },
          { name: 'Player 2', score: 3456, rank: 2, timestamp: Date.now() - 2000000 },
          { name: 'Player 3', score: 4567, rank: 3, timestamp: Date.now() - 3000000 },
          { name: 'Player 4', score: 5678, rank: 4, timestamp: Date.now() - 4000000 },
          { name: 'You', score: 6789, rank: 5, timestamp: Date.now(), isCurrentUser: true },
          { name: 'Player 6', score: 7890, rank: 6, timestamp: Date.now() - 6000000 },
          { name: 'Player 7', score: 8901, rank: 7, timestamp: Date.now() - 7000000 },
          { name: 'Player 8', score: 9012, rank: 8, timestamp: Date.now() - 8000000 },
          { name: 'Player 9', score: 10123, rank: 9, timestamp: Date.now() - 9000000 },
          { name: 'Player 10', score: 11234, rank: 10, timestamp: Date.now() - 10000000 },
        ];
        
        // Sort the mock data by score (ascending, since lower is better)
        mockData.sort((a, b) => a.score - b.score);
        
        // Set ranks
        mockData.forEach((entry, index) => {
          entry.rank = index + 1;
        });
        
        setLeaderboardData(mockData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Format the timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ 
        color: '#333', 
        marginBottom: '20px',
        textAlign: 'center',
        fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive'
      }}>
        Leaderboard
      </h2>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading leaderboard...
        </div>
      ) : (
        <>
          <div style={{ 
            maxHeight: '500px',
            overflowY: 'auto',
            marginBottom: '20px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f0f0f0', 
                  borderBottom: '1px solid #ddd'
                }}>
                  <th style={{ padding: '10px', width: '10%' }}>Rank</th>
                  <th style={{ padding: '10px', width: '30%' }}>Player</th>
                  <th style={{ padding: '10px', width: '20%' }}>Score</th>
                  <th style={{ padding: '10px', width: '40%' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => (
                  <tr 
                    key={index}
                    style={{ 
                      backgroundColor: entry.isCurrentUser ? '#e6f7ff' : 'white',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                      {entry.rank}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {entry.isCurrentUser ? <strong>{entry.name} (You)</strong> : entry.name}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {entry.score.toLocaleString()} km
                    </td>
                    <td style={{ padding: '10px', fontSize: '0.9em', color: '#777' }}>
                      {formatTimestamp(entry.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={onPlayAgain}
              style={{
                padding: '15px 30px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              Play Again
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardView; 