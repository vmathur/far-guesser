import React from 'react';
import { CSSProperties } from 'react';

interface RulesScreenProps {
  onPlay: () => void;
}

const RulesScreen: React.FC<RulesScreenProps> = ({ onPlay }) => {
  const styles: Record<string, CSSProperties> = {
    container: {
      textAlign: 'center' as const,
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
      maxWidth: '800px',
      margin: '0 auto',
    },
    title: {
      textAlign: 'center' as const,
      fontSize: '3.2em',
      color: '#333',
      marginBottom: '25px',
      fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    rulesContainer: {
      textAlign: 'left',
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '10px',
      marginBottom: '30px',
      border: '2px dashed #4CAF50',
    },
    rule: {
      position: 'relative' as const,
      backgroundColor: 'white',
      padding: '15px 15px 15px 35px',
      margin: '10px 0',
      borderRadius: '10px',
      fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive',
      fontSize: '1.3em',
      color: '#444',
      marginBottom: '15px',
      lineHeight: '1.5',
    },
    playButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '15px 35px',
      fontSize: '1.4em',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.3s',
      fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      transform: 'scale(1)',
    },
    emoji: {
      position: 'absolute',
      left: '0',
      fontSize: '1.4em',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FarGuesser</h1>
      
      <div style={styles.rulesContainer}>
        <p style={styles.rule}>
          <span style={styles.emoji}>🌍</span>
          1. Explore a location for 10 seconds
        </p>
        <p style={styles.rule}>
          <span style={styles.emoji}>🎯</span>
          2. Guess the location on the map. Closer to the target, better the score
        </p>
        <p style={styles.rule}>
          <span style={styles.emoji}>🏆</span>
          3. New round each day. Compete with others on Farcaster
        </p>
      </div>
      
      <button 
        style={styles.playButton}
        onClick={onPlay}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#45a049';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#4CAF50';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Play
      </button>
    </div>
  );
};

export default RulesScreen; 