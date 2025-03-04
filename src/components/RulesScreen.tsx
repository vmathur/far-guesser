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
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto',
    },
    title: {
      fontSize: '2.5em',
      color: '#333',
      marginBottom: '20px',
    },
    rulesContainer: {
      textAlign: 'left',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px',
    },
    rule: {
      fontSize: '1.1em',
      color: '#444',
      marginBottom: '10px',
      lineHeight: '1.5',
    },
    playButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '12px 30px',
      fontSize: '1.2em',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.3s',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FarGuesser</h1>
      
      <div style={styles.rulesContainer}>
        <p style={styles.rule}>1. Explore a location for up to 10 seconds</p>
        <p style={styles.rule}>2. Guess the location on the map. Closer to the target, better the score</p>
        <p style={styles.rule}>3. New round each day. Compete with others on Farcaster</p>
      </div>
      
      <button 
        style={styles.playButton} 
        onClick={onPlay}
      >
        Play
      </button>
    </div>
  );
};

export default RulesScreen; 