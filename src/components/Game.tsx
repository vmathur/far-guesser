import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CSSProperties } from 'react';
import RulesScreen from './RulesScreen';
import AutoAuthFrame from './AutoAuthFrame';
import GoogleFontsLoader from './GoogleFontsLoader';
import { Location } from './types/LocationGuesserTypes';

// Use dynamic import for the LocationGuesserView component to avoid SSR issues
const LocationGuesserView = dynamic(() => import('./LocationGuesserView'), {
  ssr: false,
});

interface GameProps {
  dailyLocation: Location;
}

const FarGuesser = ({ dailyLocation }: GameProps) => {
  const [showRules, setShowRules] = useState(true);
  const selectedFont = 'Patrick Hand';
  
  const styles: Record<string, CSSProperties> = {
    container: {
      textAlign: 'center' as const,
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      maxWidth: '800px',
      margin: '0 auto',
    },
  };

  const handlePlay = () => {
    setShowRules(false);
  };

  return (
    <>
      {/* Load Google Fonts globally */}
      <GoogleFontsLoader />
      
      {/* Include the AutoAuthFrame component to handle authentication and frame addition */}
      <AutoAuthFrame />
      
      <div style={styles.container}>
        {showRules ? (
          <RulesScreen onPlay={handlePlay} selectedFont={selectedFont} />
        ) : (
          <LocationGuesserView selectedFont={selectedFont} dailyLocation={dailyLocation} />
        )}
      </div>
    </>
  );
};

export default FarGuesser;
