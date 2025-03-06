"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Location } from './types/LocationGuesserTypes';
import { useGoogleMapsLoader } from './utils/GoogleMapsUtil';

interface StreetViewProps {
  currentLocation: Location;
  timeLeft: number;
  onTimeEnd: () => void;
}

const StreetView: React.FC<StreetViewProps> = ({ 
  currentLocation, 
  timeLeft, 
  onTimeEnd 
}) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const loadGoogleMapsAPI = useGoogleMapsLoader(setLoading);

  // Initialize Street View
  useEffect(() => {
    if (!streetViewRef.current) return;

    console.log("Initializing Street View for viewing state");
    setLoading(true);

    // Load the Google Maps JavaScript API - simplified approach
    const initializeStreetView = () => {
      if (!streetViewRef.current || !window.google || !window.google.maps) {
        console.error("Cannot initialize Street View: required objects missing");
        setLoading(false);
        return;
      }
      
      try {
        console.log("Creating Street View panorama with position:", currentLocation.position);
        
        // More robust error handling
        const panorama = new window.google.maps.StreetViewPanorama(
          streetViewRef.current,
          {
            position: currentLocation.position,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: false,
            linksControl: true,
            panControl: true,
            enableCloseButton: false,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            zoomControl: false
          }
        ) as google.maps.StreetViewPanorama;  // Cast to correct type
        
        panorama.addListener('status_changed', () => {
          const status = panorama.getStatus();
          console.log("Street View status:", status);
          if (status !== 'OK') {
            console.error("Street View data not found for this location");
          }
          setLoading(false);
        });
        
        // Set loading to false after a timeout in case the status event doesn't fire
        setTimeout(() => {
          setLoading(false);
        }, 3000);
      } catch (error) {
        console.error("Error initializing Street View:", error);
        setLoading(false);
      }
    };
    
    loadGoogleMapsAPI(initializeStreetView, 'Street View');
    
    // Clean up
    return () => {
      console.log("Cleaning up Street View effect");
    };
  }, [currentLocation, loadGoogleMapsAPI]);

  // Timer effect
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    
    if (timeLeft > 0) {
      timerId = setTimeout(() => {
        // No need to update timeLeft here, it's managed by the parent component
      }, 100);
    } else if (timeLeft === 0) {
      // Time's up, move to guessing state
      onTimeEnd();
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timeLeft, onTimeEnd]);

  return (
    <div>
      {/* Timer component at the top */}
      <div style={{ 
        backgroundColor: '#f0f0f0',
        color: timeLeft <= 5000 ? 'red' : '#333',
        padding: '8px 15px',
        borderRadius: '8px',
        fontSize: '36px',
        fontWeight: 'bold',
        marginBottom: '15px',
        display: 'inline-block',
        border: '2px solid #ddd',
        fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive',
        boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        transform: timeLeft < 3000 ? 'scale(1.1)' : 'scale(1)',
        width: '160px',
        textAlign: 'center',
      }}>
        {(timeLeft / 1000).toFixed(2) +' s'}
      </div>
      
      <div 
        style={{ 
          height: '500px', 
          width: '100%', 
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Street View container */}
        <div
          ref={streetViewRef}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
        
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
            backgroundColor: '#f0f0f0',
            zIndex: 10
          }}>
            Loading Street View...
          </div>
        )}
      </div>
    </div>
  );
};

export default StreetView; 