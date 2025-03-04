import React from 'react';
import dynamic from 'next/dynamic';
import { CSSProperties } from 'react';

// Use dynamic import for the LocationGuesserView component to avoid SSR issues
const LocationGuesserView = dynamic(() => import('./LocationGuesserView'), {
  ssr: false,
});

const FarGuesser = () => {
  const styles: Record<string, CSSProperties> = {
    container: {
      textAlign: 'center' as const,
      padding: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto',
    },
    title: {
      fontSize: '2em',
      color: '#333',
    },
    paragraph: {
      fontSize: '1em',
      color: '#666',
      marginBottom: '20px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FarGuesser</h1>
      <p style={styles.paragraph}>Try to guess where this location is!</p>
      
      {/* Add the LocationGuesserView component */}
      <LocationGuesserView />
    </div>
  );
};

export default FarGuesser;
