"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FrameSDKContext } from './types/UserGuess';
import { LeaderboardEntry } from './types/LocationGuesserTypes';

interface LeaderboardPreviewProps {
  dailyLeaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  sdkContext: FrameSDKContext | null;
  selectedFont?: string;
  onNextLocation: () => void;
}

const LeaderboardPreview: React.FC<LeaderboardPreviewProps> = ({
  dailyLeaderboard,
  leaderboardLoading,
  sdkContext,
  selectedFont = 'Chalkboard SE',
  onNextLocation
}) => {
  if (leaderboardLoading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard-preview" style={{ 
      marginTop: '30px', 
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      fontFamily: selectedFont
    }}>
      {dailyLeaderboard.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Player</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Score</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Distance</th>
              </tr>
            </thead>
            <tbody>
              {dailyLeaderboard.map((entry, index) => (
                <tr key={index} style={{ 
                  borderBottom: '1px solid #ddd',
                  backgroundColor: sdkContext?.user?.fid && 
                    entry.fid && 
                    entry.fid.toString() === sdkContext.user.fid.toString() 
                    ? '#fffde7' 
                    : 'transparent'
                }}>
                  <td style={{ padding: '8px', width: '40px' }}>{index + 1}</td>
                  <td style={{ padding: '8px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        overflow: 'hidden',
                        marginRight: '10px',
                        backgroundColor: '#3B82F6',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        border: '2px solid white',
                        flexShrink: 0
                      }}>
                        {entry.pfpUrl ? (
                          <img 
                            src={entry.pfpUrl} 
                            alt={entry.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              console.warn(`Failed to load profile image for ${entry.name}:`, entry.pfpUrl);
                              // Replace with initial if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement.innerHTML = entry.name.slice(0, 1).toUpperCase();
                            }}
                          />
                        ) : (
                          entry.name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div style={{ fontWeight: sdkContext?.user?.fid && 
                          entry.fid && 
                          entry.fid.toString() === sdkContext.user.fid.toString() ? 'bold' : 'normal' }}>
                        {entry.name}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{Math.round(entry.score)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{Math.round(entry.distance).toLocaleString()} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No entries in the leaderboard yet. Be the first!</p>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
        <motion.button
          onClick={onNextLocation}
          className="bg-gray-200 text-black font-bold py-3 px-8 rounded-lg text-lg select-none touch-none"
          initial={{ 
            boxShadow: "0px 5px 0px rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)" 
          }}
          whileTap={{ 
            y: 5,
            boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
            transition: { duration: 0.1 }
          }}
        >
          All time scores →
        </motion.button>
      </div>
    </div>
  );
};

export default LeaderboardPreview; 