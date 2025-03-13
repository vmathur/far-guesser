"use client";

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from './types/LocationGuesserTypes';
import { useGameAnalytics } from '../lib/analytics';
import { getUserFid } from '../lib/analytics';

interface LeaderboardViewProps {
  onNextLocation?: () => void;
  selectedFont?: string;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ 
  onNextLocation, 
  selectedFont = 'Chalkboard SE' 
}) => {
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const analytics = useGameAnalytics();
  const userFid = getUserFid();

  // Track leaderboard_viewed event when component mounts
  useEffect(() => {
    analytics.leaderboardViewed();
  }, [analytics]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboards = async () => {
      setIsLoading(true);
      try {
        // Only fetch all-time leaderboard
        const allTimeResponse = await fetch('/api/leaderboard?type=all-time');
        const allTimeData = await allTimeResponse.json();
        
        if (allTimeData.success) {
          // Mark current user entries and ensure scores are processed correctly
          const processLeaderboard = (entries: LeaderboardEntry[]) => {
            return entries.map((entry, index) => ({
              ...entry,
              // Add rank if not provided by the API
              rank: entry.rank || index + 1,
              isCurrentUser: entry.fid === userFid
            }));
          };
          
          setAllTimeLeaderboard(processLeaderboard(allTimeData.leaderboard || allTimeData.data || []));
        } else {
          console.error("Error fetching all-time leaderboard", allTimeData);
        }
      } catch (error) {
        console.error("Error fetching all-time leaderboard:", error);
        
        // In case of error, use mock data
        const mockData: LeaderboardEntry[] = Array.from({ length: 10 }).map((_, i) => ({
          name: `Player ${i+1}`,
          score: Math.round((100 * Math.exp(-(1000 + i*500)/2000)) * 100) / 100,
          distance: 1000 + i*500,
          rank: i + 1,
          timestamp: Date.now() - i*1000000,
          isCurrentUser: i === 4,
          fid: i === 4 ? userFid || undefined : undefined
        }));
        
        setAllTimeLeaderboard(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboards();
  }, [userFid]);

  // Render leaderboard table
  const renderLeaderboardTable = (entries: LeaderboardEntry[]) => {
    return (
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
            <th style={{ padding: '10px', width: '15%' }}>Rank</th>
            <th style={{ padding: '10px', width: '45%' }}>Player</th>
            <th style={{ padding: '10px', width: '40%' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr 
              key={index}
              style={{ 
                backgroundColor: entry.isCurrentUser ? '#e6f7ff' : 'white',
                borderBottom: '1px solid #eee'
              }}
            >
              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                {entry.rank || index + 1}
              </td>
              <td style={{ padding: '10px' }}>
                {entry.isCurrentUser ? <strong>{entry.name} (You)</strong> : entry.name}
              </td>
              <td style={{ padding: '10px' }}>
                {/* Display the score directly from the API, already rounded appropriately */}
                {typeof entry.score === 'number' ? Math.round(entry.score) : entry.score}
                {entry.distance && (
                  <span style={{ fontSize: '0.8em', color: '#777', display: 'block' }}>
                    ({entry.distance.toLocaleString()} km)
                  </span>
                )}
              </td>
            </tr>
          ))}
          
          {entries.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: '20px', textAlign: 'center' }}>
                No scores recorded yet!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: `"${selectedFont}", "Comic Sans MS", cursive`
    }}>
      {/* Back Button */}
      <button
        onClick={onNextLocation}
        style={{
          padding: '8px 16px',
          marginBottom: '20px',
          backgroundColor: '#f0f0f0',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: `"${selectedFont}", "Comic Sans MS", cursive`,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'background-color 0.2s'
        }}
      >
        ← Back to Game
      </button>

      {/* Title */}
      {/* <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        color: '#333'
      }}>
        All Time Leaderboard
      </h2> */}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading leaderboard...
        </div>
      ) : (
        <>
          {/* Info about scoring */}
                  <div style={{
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            fontSize: '0.9em',
            color: '#666',
            marginBottom: '20px'
          }}>
            <p>All-time scores are the sum of all your daily scores.</p>
          </div>
          {/* Leaderboard Table Container */}
          <div style={{ 
            maxHeight: '500px',
            overflowY: 'auto',
            marginBottom: '20px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            {renderLeaderboardTable(allTimeLeaderboard)}
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardView; 