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
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'all-time'>('daily');
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
        // Fetch daily leaderboard
        const dailyResponse = await fetch('/api/leaderboard?type=daily');
        const dailyData = await dailyResponse.json();
        
        // Fetch all-time leaderboard
        const allTimeResponse = await fetch('/api/leaderboard?type=all-time');
        const allTimeData = await allTimeResponse.json();
        
        if (dailyData.success && allTimeData.success) {
          // Mark current user entries
          const processLeaderboard = (entries: LeaderboardEntry[]) => {
            return entries.map(entry => ({
              ...entry,
              isCurrentUser: entry.fid === userFid
            }));
          };
          
          setDailyLeaderboard(processLeaderboard(dailyData.data));
          setAllTimeLeaderboard(processLeaderboard(allTimeData.data));
        } else {
          console.error("Error fetching leaderboards", dailyData, allTimeData);
        }
      } catch (error) {
        console.error("Error fetching leaderboards:", error);
        
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
        
        setDailyLeaderboard(mockData);
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
                {entry.rank}
              </td>
              <td style={{ padding: '10px' }}>
                {entry.isCurrentUser ? <strong>{entry.name} (You)</strong> : entry.name}
              </td>
              <td style={{ padding: '10px' }}>
                {Math.round(entry.score)} {/* Display calculated score rounded to nearest integer */}
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

  // Tab style
  const tabStyle = (isActive: boolean) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#4CAF50' : '#f0f0f0',
    color: isActive ? 'white' : '#333',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    fontFamily: `"${selectedFont}", "Comic Sans MS", cursive`,
    marginRight: '5px',
    transition: 'background-color 0.2s'
  });

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: `"${selectedFont}", "Comic Sans MS", cursive`
    }}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading leaderboard...
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ 
            display: 'flex',
            marginBottom: '10px'
          }}>
            <button 
              onClick={() => setActiveTab('daily')}
              style={tabStyle(activeTab === 'daily')}
            >
              Today&apos;s Scores
            </button>
            <button 
              onClick={() => setActiveTab('all-time')}
              style={tabStyle(activeTab === 'all-time')}
            >
              All Time Scores
            </button>
          </div>
          
          {/* Leaderboard Table Container */}
          <div style={{ 
            maxHeight: '500px',
            overflowY: 'auto',
            marginBottom: '20px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            {activeTab === 'daily' 
              ? renderLeaderboardTable(dailyLeaderboard)
              : renderLeaderboardTable(allTimeLeaderboard)
            }
          </div>
          
          {/* Info about scoring */}
          <div style={{
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            fontSize: '0.9em',
            color: '#666',
            marginBottom: '20px'
          }}>
            <p>Score calculation: 100 × e<sup>(-distance/2000)</sup></p>
            <p>Higher scores are better!</p>
            {activeTab === 'all-time' && (
              <p>All-time scores are the sum of all your daily scores.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardView; 