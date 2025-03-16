import { useEffect, useState, FC } from 'react';
import { CSSProperties } from 'react';
import { useGameAnalytics } from '~/lib/analytics';
import { gameConfig } from '~/data/gameConfig';
import { motion } from 'framer-motion';

interface RulesScreenProps {
  onPlay: () => void;
  fid: number | null;
}

const RulesScreen: FC<RulesScreenProps> = ({ onPlay, fid }) => {
  const [isLoading, setIsLoading] = useState(true);
  const analytics = useGameAnalytics();
  
  // Set loading to false after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const styles: Record<string, CSSProperties> = {
    container: {
      textAlign: 'center' as const,
      padding: '0',
      margin: '0',
      width: '100%',
      height: '100vh',
      backgroundImage: 'url("/map.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      zIndex: 1,
    },
    contentContainer: {
      position: 'relative',
      zIndex: 2,
      padding: '30px',
      maxWidth: '800px',
      borderRadius: '12px',
    },
    title: {
      textAlign: 'center' as const,
      fontSize: '3.2em',
      color: '#333',
      marginBottom: '25px',
      fontFamily: `"Patrick Hand", "Comic Sans MS", cursive`,
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    rulesContainer: {
      textAlign: 'left',
      // backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: '10px',
      marginBottom: '30px',
    },
    rule: {
      position: 'relative' as const,
      // backgroundColor: 'rgba(255, 255, 255, 0.7)',
      padding: '15px 15px 15px 15px',
      margin: '10px 0',
      borderRadius: '10px',
      fontFamily: `"Patrick Hand", "Comic Sans MS", cursive`,
      fontSize: '1.4em',
      color: '#444',
      marginBottom: '10px',
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
      fontFamily: `"Patrick Hand", "Comic Sans MS", cursive`,
      transform: 'scale(1)',
    },
    emoji: {
      position: 'absolute',
      left: '0',
      fontSize: '1.4em',
      marginLeft: '10px',
    },
    fontInfo: {
      marginTop: '10px',
      fontSize: '0.9em',
      color: '#666',
    },
    loadingIndicator: {
      marginTop: '20px',
      fontSize: '1.2em',
      color: '#666',
    },
    signInButton: {
      backgroundColor: '#f0f0f0',
      color: '#333',
      padding: '8px 16px',
      fontSize: '1em',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '10px',
      fontFamily: `"Patrick Hand", "Comic Sans MS", cursive`,
    }
  };

  // Add useEffect to handle body overflow
  useEffect(() => {
    // Add overflow: hidden to both html and body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Cleanup function to remove the styles when component unmounts
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handlePlayClick = () => {
    // Track the game_started event
    analytics.gameStarted();
    // Call the original onPlay function
    onPlay();
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <div style={styles.contentContainer}>
        {/* <h1 style={styles.title}>🔎 FarGuesser</h1> */}
        
        <div style={styles.rulesContainer}>
          <p style={styles.rule}>
            1. Explore a mystery location for {Math.round(gameConfig.VIEWING_TIME_MS / 1000)} seconds
          </p>
          <p style={styles.rule}>
            2. Guess where it is on the map
          </p>
          <p style={styles.rule}>
            3. Score points for being close to the actual location. New location each day
          </p>
        </div>
        
        {isLoading ? (
          <div style={styles.loadingIndicator}>Loading...</div>
        ) : (
          <>
            <motion.button
                onClick={handlePlayClick}
                className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg select-none touch-none"
                initial={{ 
                  boxShadow: "0px 5px 0px  rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)" 
                }}
                whileTap={{ 
                  y: 5,
                  boxShadow: "0px 0px 0px  rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
                  transition: { duration: 0.1 }
                }}
              >
                Play
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
};

export default RulesScreen; 