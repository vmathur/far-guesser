"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMapsLoader } from './utils/GoogleMapsUtil';
import { Guess } from './types/LocationGuesserTypes';
import { motion } from 'framer-motion';

interface GuessingMapProps {
  onGuessSubmitted: (guess: Guess) => void;
}

const GuessingMap: React.FC<GuessingMapProps> = ({ onGuessSubmitted }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  const [guess, setGuess] = useState<Guess | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const loadGoogleMapsAPI = useGoogleMapsLoader(setLoading);

  // Initialize the guessing map
  useEffect(() => {
    if (!mapRef.current) return;
    
    console.log("Initializing map for guessing state");
    
    // Prevent re-initialization if the map is already created
    if (googleMapRef.current) {
      console.log("Map already exists, skipping initialization");
      return;
    }
    
    // Use the shared function to load Google Maps API
    loadGoogleMapsAPI(initializeMapForGuessing, 'Guessing Map');
    
    function initializeMapForGuessing() {
      if (!mapRef.current) {
        console.error("Map container is not available");
        return;
      }
      
      try {
        console.log("Creating new map instance in container:", mapRef.current);
        
        const mapElement = mapRef.current;
        
        // Make sure the map element is visible with dimensions
        mapElement.style.display = 'block';
        mapElement.style.height = '100%';
        mapElement.style.width = '100%';
        mapElement.style.backgroundColor = '#e8e8e8';
        
        // Remove any existing loading indicator
        const loadingIndicator = document.querySelector('.map-loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
        
        // Create map with a small delay to ensure the container is ready
        setTimeout(() => {
          try {
            // Create map with better default config
            const newMap = new window.google.maps.Map(mapElement, {
              center: { lat: 20, lng: 0 },
              zoom: 2,
              streetViewControl: false,
              fullscreenControl: true,
              mapTypeControl: false,
              zoomControl: true,
            });
            
            // Store the map in the ref for future access
            googleMapRef.current = newMap;
            
            console.log("Map created successfully");
            
            // *** FIXED APPROACH: STABLE CLICK HANDLER ***
            const mapClickHandler = (event: google.maps.MapMouseEvent) => {
              if (!googleMapRef.current || !event.latLng) return;
              
              console.log("Map click detected at:", event.latLng.lat(), event.latLng.lng());
              
              // Clear existing marker
              if (markerRef.current) {
                console.log("Removing existing marker");
                markerRef.current.setMap(null);
              }
              
              try {
                console.log("Creating new marker");
                
                // Create a standard Google Maps marker with default pin
                const newMarker = new window.google.maps.Marker({
                  position: event.latLng,
                  map: googleMapRef.current,
                  draggable: true,
                  animation: window.google.maps.Animation.DROP // Optional animation
                });
                
                // Update the marker position when the user drags it
                newMarker.addListener('dragend', () => {
                  const position = newMarker.getPosition();
                  if (position) {
                    setGuess({
                      position: { lat: position.lat(), lng: position.lng() },
                      distance: 0, // This will be calculated when submitted
                    });
                  }
                });
                
                // Update React state for the marker
                markerRef.current = newMarker;
                setMarker(newMarker);
                
                // Update guess state with the marker position
                const position = event.latLng;
                setGuess({
                  position: { lat: position.lat(), lng: position.lng() },
                  distance: 0, // This will be calculated when submitted
                });
                
                console.log("New marker created at:", position.lat(), position.lng());
              } catch (error) {
                console.error("Error creating marker:", error);
              }
            };
            
            // Add click listener to the map
            newMap.addListener('click', mapClickHandler);
            
          } catch (error) {
            console.error("Error creating map:", error);
          }
        }, 200);
        
      } catch (error) {
        console.error("Error in map initialization:", error);
      }
    }
    
    // Clean up function
    return () => {
      // Clean up map if needed
      console.log("Cleaning up guessing map effect");
    };
  }, [loadGoogleMapsAPI]);

  const handleSubmitGuess = () => {
    if (!guess || submitting) return;
    
    // Set submitting state to true
    setSubmitting(true);
    
    // Call the parent component's onGuessSubmitted function with the current guess
    onGuessSubmitted(guess);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ marginBottom: '15px', color: '#555' }}>
        Tap anywhere on the map to place your marker
      </p>
      <div style={{ 
        height: '400px', 
        width: '100%', 
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#e8e8e8', // Light background to show loading
      }}>
        {/* Improved loading indicator for map */}
        <div className="map-loading-indicator" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(240, 240, 240, 0.9)',
          zIndex: 5,
          pointerEvents: 'none', // Allow clicks to pass through
        }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading world map...</div>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            zIndex: 2, // Ensure map is above loading indicator
            opacity: 1,  // Ensure full opacity
            display: 'block' // Ensure it's visible
          }}
          id="map-container"
        ></div>
      </div>
      
      <motion.button
        onClick={handleSubmitGuess}
        disabled={!guess || !marker || submitting}
        className={`font-bold py-3 px-8 rounded-lg text-lg select-none touch-none ${
          (!marker) || submitting ? "bg-gray-400 text-gray-200" : "bg-green-500 text-white"
        }`}
        animate={{ 
          y: (!marker) || submitting ? 5 : 0,
          boxShadow: (!marker) || submitting
            ? "0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px rgba(0, 0, 0, 0.2)"
            : "0px 5px 0px rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)"
        }}
        whileHover={(!marker) || submitting 
          ? {} 
          : { 
              scale: 1.05,
              transition: { duration: 0.2 }
            }
        }
        whileTap={(!marker) || submitting 
          ? {} 
          : { 
              y: 5,
              boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
              transition: { duration: 0.1 }
            }
        }
      >
        {submitting ? 'Loading...' : 'Go'}
      </motion.button>
    </div>
  );
};

export default GuessingMap; 