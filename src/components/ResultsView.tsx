"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Guess, Location } from './types/LocationGuesserTypes';
import { useGoogleMapsLoader } from './utils/GoogleMapsUtil';
import sdk from '@farcaster/frame-sdk';
import { useGameAnalytics } from '../lib/analytics';

interface ResultsViewProps {
  guess: Guess;
  actualLocation: Location;
  onNextLocation: () => void;
  selectedFont?: string;
}

// Define a type for the SDK context
type FrameSDKContext = {
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
  };
  frames?: {
    frameUrl?: string;
    castId?: {
      fid?: number;
      hash?: string;
    };
  };
}

// Define a type for the session update event
interface SessionUpdateEvent extends CustomEvent {
  detail: {
    session: any;
    status: string;
    sdkContext?: FrameSDKContext;
  };
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  guess, 
  actualLocation, 
  onNextLocation,
  selectedFont = 'Chalkboard SE'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playRecorded, setPlayRecorded] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string>('');
  const [sdkContext, setSdkContext] = useState<FrameSDKContext | null>(null);
  const [customSessionData, setCustomSessionData] = useState<any>(null);
  
  const loadGoogleMapsAPI = useGoogleMapsLoader(setLoading);
  const analytics = useGameAnalytics();
  
  // Load SDK context directly
  useEffect(() => {
    const loadSdkContext = async () => {
      try {
        if (sdk) {
          const context = await sdk.context;
          console.log('ResultsView loaded SDK Context:', context);
          setSdkContext(context);
        }
      } catch (error) {
        console.error('Error loading SDK context:', error);
      }
    };
    
    loadSdkContext();
  }, []);
  
  // Listen for custom session update events
  useEffect(() => {
    const handleSessionUpdate = (event: SessionUpdateEvent) => {
      console.log('ResultsView received session update:', event.detail);
      setCustomSessionData(event.detail.session);
      if (event.detail.sdkContext) {
        setSdkContext(event.detail.sdkContext);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('farGuesserSessionUpdate', handleSessionUpdate as EventListener);
      
      return () => {
        window.removeEventListener('farGuesserSessionUpdate', handleSessionUpdate as EventListener);
      };
    }
  }, []);
  
  const getUserFid = () => {
    return (
      sdkContext?.user?.fid?.toString() || 
      customSessionData?.user?.fid?.toString()
    );
  };
  
  // Record that the user has played
  useEffect(() => {
    // Prevent multiple recording attempts
    if (playRecorded) return;
    
    const recordPlay = async () => {
      // Only proceed if we have a user FID
      const userFid = getUserFid();
      if (!userFid) {
        setDebugMessage('Waiting for user FID...');
        return;
      }
      
      setDebugMessage(`Using FID: ${userFid}, recording play...`);
      
      try {
        // Log the request for debugging
        console.log(`Recording play for FID: ${userFid}`);
        
        const response = await fetch('/api/record-play', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Farcaster-User-FID': userFid
          },
          body: JSON.stringify({ fid: userFid }),
        });
        
        console.log('Record play API response status:', response.status);
        
        const data = await response.json();
        console.log('Record play API response data:', data);
        
        if (data.success) {
          setPlayRecorded(true);
          setDebugMessage(`Play recorded successfully for FID: ${userFid}`);
        } else {
          setDebugMessage(`API responded with error: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error recording play:', error);
        setDebugMessage(`Error recording play: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    recordPlay();
  }, [playRecorded]);

  // Initialize the results map
  useEffect(() => {
    if (!mapRef.current) return;
    
    console.log("Initializing results map");
    
    // Prevent re-initialization if the map is already created
    if (googleMapRef.current) {
      console.log("Results map already exists, skipping initialization");
      return;
    }
    
    loadGoogleMapsAPI(initializeResultsMap, 'Results Map');
    
    function initializeResultsMap() {
      if (!mapRef.current) {
        console.error("Results map container not available");
        return;
      }
      
      try {
        // Calculate the bounds to show both markers
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new window.google.maps.LatLng(
          guess.position.lat,
          guess.position.lng
        ));
        bounds.extend(new window.google.maps.LatLng(
          actualLocation.position.lat,
          actualLocation.position.lng
        ));
        
        // Create the map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 }, // Will be overridden by fitBounds
          zoom: 2, // Will be overridden by fitBounds
          streetViewControl: false,
          mapTypeControl: true
        });
        
        // Store the map instance
        googleMapRef.current = map;
        
        // Create the user's guess marker (red)
        new window.google.maps.Marker({
          position: guess.position,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#FF0000",
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: "#FFFFFF"
          }
        });
        
        // Create the actual location marker (green)
        new window.google.maps.Marker({
          position: actualLocation.position,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#00FF00",
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: "#000000"
          }
        });
        
        // Draw a line between the two points
        new window.google.maps.Polyline({
          path: [
            guess.position,
            actualLocation.position
          ],
          map,
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 3
        });
        
        // Make sure the bounds include both markers
        map.fitBounds(bounds);
        
        // Add some padding to the bounds
        const paddings = {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100
        };
        
        // Only call fitBounds after the map is loaded
        google.maps.event.addListenerOnce(map, 'idle', function() {
          const boundsWithPadding = {
            north: bounds.getNorthEast().lat() + paddings.top/5000,
            east: bounds.getNorthEast().lng() + paddings.right/5000,
            south: bounds.getSouthWest().lat() - paddings.bottom/5000,
            west: bounds.getSouthWest().lng() - paddings.left/5000
          };
          
          map.fitBounds(boundsWithPadding, 0);
        });
      } catch (error) {
        console.error("Error initializing results map:", error);
      } finally {
        setLoading(false);
      }
    }
    
    return () => {
      // Clean up if needed
      console.log("Cleaning up results map effect");
    };
  }, [actualLocation, guess, loadGoogleMapsAPI]);

  const handleShare = () => {
    analytics.shareClicked();
    
    const message = `I scored ${guess.distance.toLocaleString()} km away from today's mystery location 📍. Can you beat me?\n\n`;
    // URL encode the message, ensuring newlines are properly encoded
    const encodedMessage = encodeURIComponent(message);
    const encodedFrameUrl = encodeURIComponent(process.env.NEXT_PUBLIC_URL);

    // Use the Farcaster SDK to open the Warpcast compose page
    sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodedMessage}&embeds[]=${encodedFrameUrl}`);
  };

  const handleShowLeaderboard = () => {
    // Navigate to the leaderboard view using the onNextLocation callback
    onNextLocation();
  };

  // Add debug info to the results view
  const debugStyles = {
    debugInfo: {
      marginTop: '12px',
      padding: '8px',
      fontSize: '0.8em',
      color: '#666',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      textAlign: 'left' as const,
      whiteSpace: 'pre-wrap',
      display: process.env.NODE_ENV === 'development' ? 'block' : 'none',
    }
  };

  // Track results_viewed event when component mounts
  useEffect(() => {
    if (guess?.distance) {
      analytics.resultsViewed({ distance: guess.distance });
    }
  }, [guess, analytics]);

  return (
    <div style={{ 
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      color: '#000'
    }}>
      
      <div style={{ 
        height: '500px', 
        width: '100%', 
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#e8e8e8', // Light background to show loading
      }}>
        {/* Loading indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(240, 240, 240, 0.9)',
            zIndex: 5
          }}>
            <div style={{ fontSize: '18px' }}>Loading results map...</div>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%'
          }}
        ></div>
      </div>
      
      <div style={{ 
        fontSize: '20px', 
        marginBottom: '20px', 
        color: '#000',
        fontFamily: `"${selectedFont}", "Comic Sans MS", cursive`
      }}>
        Your guess was <strong>{guess.distance.toLocaleString()}</strong> km away
      </div>
      
      {!showLeaderboard ? (
        <div style={{ marginBottom: '20px' }}>
          <div>
            <button
              onClick={handleShare}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              Share
            </button>
            <button
              onClick={handleShowLeaderboard}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Leaderboard
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onNextLocation}
          style={{
            padding: '15px 30px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          Next Location
        </button>
      )}
      
    </div>
  );
};

export default ResultsView; 