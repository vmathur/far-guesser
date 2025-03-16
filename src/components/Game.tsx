import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CSSProperties } from 'react';
import RulesScreen from './RulesScreen';
import AutoAuthFrame from './AutoAuthFrame';
import GoogleFontsLoader from './GoogleFontsLoader';
import { Location } from './types/LocationGuesserTypes';
import { useGameAnalytics } from '~/lib/analytics';
import sdk from '@farcaster/frame-sdk';
import { checkUserPlayStatus } from '~/lib/playStatusHelpers';

// Use dynamic import for the LocationGuesserView component to avoid SSR issues
const LocationGuesserView = dynamic(() => import('./LocationGuesserView'), {
  ssr: false,
});

interface GameProps {
  dailyLocation: Location;
}

const FarGuesser = ({ dailyLocation }: GameProps) => {
  // New game flow states
  const [gameFlow, setGameFlow] = useState<'loading' | 'rules' | 'playing' | 'results'>('loading');
  const [userGuess, setUserGuess] = useState<any>(null);
  const [timeUntilNextRound, setTimeUntilNextRound] = useState<number | undefined>(undefined);
  // New state variables for user information
  const [fid, setFid] = useState<number | null>(null);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const analytics = useGameAnalytics();
  
  const styles: Record<string, CSSProperties> = {
    container: {
      textAlign: 'center' as const,
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '300px',
      fontSize: '1.2rem',
      fontFamily: 'Patrick Hand',
    }
  };

  // Track page view event when component mounts
  useEffect(() => {
    analytics.pageView();
  }, [analytics]);

  // Load Farcaster SDK context and extract user information
  useEffect(() => {
    const loadSdkContext = async () => {
      try {
        if (sdk) {
          const context = await sdk.context;
          console.log('Game component loaded SDK Context:', context);
          
          // Extract and save user information
          if (context?.user) {
            setFid(context.user.fid || null);
            setPfpUrl(context.user.pfpUrl || null);
            setUsername(context.user.username || null);
            console.log('User info extracted:', {
              fid: context.user.fid,
              pfpUrl: context.user.pfpUrl,
              username: context.user.username
            });
          }
        }
      } catch (error) {
        console.error('Error loading SDK context:', error);
      }
    };
    
    loadSdkContext();
  }, []);

  // Check if user has already played today's game
  useEffect(() => {
    const checkPlayStatus = async () => {
      // Use the helper function to check play status with fid directly
      const playStatus = await checkUserPlayStatus(fid);
      
      if (playStatus.error) {
        console.error('Error checking play status:', playStatus.error);
        setGameFlow('rules');
        return;
      }
      
      // Store the timeUntilNextRound value
      if (playStatus.timeUntilNextRound !== undefined) {
        setTimeUntilNextRound(playStatus.timeUntilNextRound);
      }
      
      if (playStatus.hasPlayed && playStatus.userGuess) {
        // User has played and we have their guess - show results
        setUserGuess(playStatus.userGuess);
        setGameFlow('results');
      } else {
        // User hasn't played or we couldn't get their guess - show rules
        setGameFlow('rules');
      }
    };

    // Only run the check when the fid is loaded
    if (fid) {
      checkPlayStatus();
    }
  }, [fid]);

  const handlePlay = () => {
    setGameFlow('playing');
  };

  const handleGameComplete = (guess: any) => {
    setUserGuess(guess);
    setGameFlow('results');
  };

  // Render appropriate component based on game flow
  const renderGameFlow = () => {
    switch (gameFlow) {
      case 'loading':
        return <div style={styles.loading}>Loading...</div>;
      case 'rules':
        return <RulesScreen onPlay={handlePlay} fid={fid} />;
      case 'playing':
        return (
          <LocationGuesserView 
            dailyLocation={dailyLocation} 
            onGameComplete={handleGameComplete}
            initialGameState="viewing"
            fid={fid}
            username={username}
            pfpUrl={pfpUrl}
          />
        );
      case 'results':
        return (
          <LocationGuesserView 
            dailyLocation={dailyLocation}
            initialGameState="results"
            initialGuess={userGuess}
            timeUntilNextRound={timeUntilNextRound}
            fid={fid}
            username={username}
            pfpUrl={pfpUrl}
          />
        );
      default:
        return <div style={styles.loading}>Something went wrong</div>;
    }
  };

  return (
    <>
      {/* Load Google Fonts globally */}
      <GoogleFontsLoader />
      
      {/* Include the AutoAuthFrame component to handle authentication and frame addition */}
      <AutoAuthFrame />
      
      <div style={styles.container}>
        {renderGameFlow()}
      </div>
    </>
  );
};

export default FarGuesser;
