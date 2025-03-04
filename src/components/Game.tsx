import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CSSProperties } from 'react';
import RulesScreen from './RulesScreen';
import AutoAuthFrame from './AutoAuthFrame';

// Use dynamic import for the LocationGuesserView component to avoid SSR issues
const LocationGuesserView = dynamic(() => import('./LocationGuesserView'), {
  ssr: false,
});

const FarGuesser = () => {
  const [showRules, setShowRules] = useState(true);
  
  const styles: Record<string, CSSProperties> = {
    container: {
      textAlign: 'center' as const,
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto',
    },
  };

  const handlePlay = () => {
    setShowRules(false);
  };

  return (
    <>
      {/* Include the AutoAuthFrame component to handle authentication and frame addition */}
      <AutoAuthFrame />
      
      <div style={styles.container}>
        {showRules ? (
          <RulesScreen onPlay={handlePlay} />
        ) : (
          <LocationGuesserView />
        )}
      </div>
    </>
  );
};

export default FarGuesser;
