"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Guess, Location } from './types/LocationGuesserTypes';
import { useGoogleMapsLoader, useGoogleMapsLoaded } from './utils/GoogleMapsUtil';
import { UserGuess } from './types/UserGuess';
import CountdownTimer from './CountdownTimer';

interface ResultsMapProps {
  guess: Guess;
  pfpUrl: string;
  actualLocation: Location;
  otherUsersGuesses: UserGuess[];
  timeUntilNextRound?: number;
  selectedFont?: string;
}

const ResultsMap: React.FC<ResultsMapProps> = ({
  guess,
  pfpUrl,
  actualLocation,
  otherUsersGuesses,
  timeUntilNextRound,
  selectedFont = 'Chalkboard SE'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any | null>(null);
  const initializationAttemptedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [mapsInitAttempts, setMapsInitAttempts] = useState(0);
  const { isLoaded: googleMapsLoaded } = useGoogleMapsLoaded();
  const [mapReady, setMapReady] = useState(false);
  
  // Load Google Maps API
  const loadGoogleMapsAPI = useGoogleMapsLoader(setLoading);
  
  // Handle Google Maps loading
  useEffect(() => {
    if (!googleMapsLoaded) {
      loadGoogleMapsAPI(() => {}, 'ResultsMap');
    }
  }, [googleMapsLoaded, loadGoogleMapsAPI]);
  
  // Initialize the results map when Google Maps is loaded
  useEffect(() => {
    // Skip if:
    // - Google Maps is not loaded yet
    // - Map container doesn't exist
    // - Map is already initialized
    // - We've reached max retry attempts
    if (!googleMapsLoaded || !mapRef.current || googleMapRef.current || mapsInitAttempts >= 5) {
      return;
    }
    
    // Set flag to indicate we've attempted initialization
    initializationAttemptedRef.current = true;
        
    try {
      // Type assertion for Google Maps
      const maps = window.google.maps as any;
      
      // Safety check - if maps API is not fully loaded yet
      if (!maps || !maps.Map || !maps.LatLng || !maps.LatLngBounds) {
        throw new Error("Google Maps API not fully loaded");
      }
      
      // Create the map bounds
      const bounds = new maps.LatLngBounds();
      
      // Ensure the positions are valid before extending bounds
      if (guess?.position?.lat && guess?.position?.lng) {
        bounds.extend(new maps.LatLng(
          guess.position.lat,
          guess.position.lng
        ));
      }
      
      if (actualLocation?.position?.lat && actualLocation?.position?.lng) {
        bounds.extend(new maps.LatLng(
          actualLocation.position.lat,
          actualLocation.position.lng
        ));
      }
      
      // Add other users' guesses to bounds
      otherUsersGuesses.forEach(userGuess => {
        if (userGuess.position?.lat && userGuess.position?.lng) {
          bounds.extend(new maps.LatLng(
            userGuess.position.lat,
            userGuess.position.lng
          ));
        }
      });
        
      // Create the map
      const map = new maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
        
      // Store the map instance
      googleMapRef.current = map;
      
      // Fit the map to show all markers
      map.fitBounds(bounds);
      
      // Add padding to the bounds
      const paddings = {
        top: 100,
        right: 100,
        bottom: 100,
        left: 100
      };
      
      // Ensure the map is fully loaded before fitting bounds
      maps.event.addListenerOnce(map, 'idle', function() {
        const boundsWithPadding = {
          north: bounds.getNorthEast().lat() + paddings.top/5000,
          east: bounds.getNorthEast().lng() + paddings.right/5000,
          south: bounds.getSouthWest().lat() - paddings.bottom/5000,
          west: bounds.getSouthWest().lng() - paddings.left/5000
        };
        
        map.fitBounds(boundsWithPadding, 0);
        
        // Signal that the map is ready for markers
        setMapReady(true);
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error initializing results map:", error);
      
      // Retry after delay with exponential backoff
      const retryDelay = Math.pow(2, mapsInitAttempts) * 500;
      
      setTimeout(() => {
        setMapsInitAttempts(prev => prev + 1);
      }, retryDelay);
    }
  }, [actualLocation, guess, googleMapsLoaded, mapsInitAttempts, otherUsersGuesses]);

  // Add markers for user guess and actual location after map is ready
  useEffect(() => {
    // Skip if:
    // - Map isn't ready yet
    // - No map instance
    // - No valid positions
    if (!mapReady || !googleMapRef.current || !guess?.position || !actualLocation?.position) {
      return;
    }

    const map = googleMapRef.current;
    const maps = window.google.maps as any;
    
    // Try to create a profile picture marker for user's guess if pfpUrl is provided
    if (pfpUrl) {
      try {
        // Create a canvas to make a circular image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 96; // Larger size for better quality
        canvas.width = size;
        canvas.height = size;
        
        // Create a new Image element
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
        
        img.onload = () => {
          // Draw circular image on canvas
          if (ctx) {
            // Draw circle
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            
            // Draw white circle border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 6;
            ctx.stroke();
            
            // Draw the image
            ctx.drawImage(img, 0, 0, size, size);
            
            try {
              // Convert canvas to data URL
              const dataUrl = canvas.toDataURL('image/png');
              
              // Create marker with circular image
              const markerIcon = {
                url: dataUrl,
                scaledSize: new maps.Size(48, 48),
                origin: new maps.Point(0, 0),
                anchor: new maps.Point(24, 24)
              };
              
              // Create enhanced marker with user's profile picture
              new maps.Marker({
                position: guess.position,
                map,
                icon: markerIcon,
                title: "Your guess",
                zIndex: 900 // Higher than the fallback marker
              });
              
            } catch (canvasError) {
              console.warn("Canvas operation failed for user's guess marker:", canvasError);
              // Fallback was already created, so no additional action needed
            }
          }
        };
        
        img.onerror = () => {
          console.warn(`Failed to load user's profile picture for marker: ${pfpUrl}`);
          // Fallback already created, so no additional action needed
        };
                
        // Set the source to trigger the load
        img.src = pfpUrl;
      } catch (error) {
        console.warn("Failed to create enhanced marker for user's guess:", error);
        // Fallback already created, so we're good
      }
    }

    // Create the actual location marker using the default Google Maps pin
    const actualLocationMarker = new maps.Marker({
      position: actualLocation.position,
      map,
      title: "Actual location",
      zIndex: 1000 // Make sure it's on top of other markers
    });
    
    // Create info window for the actual location
    const actualLocationInfoWindow = new maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 250px; font-family: Arial, sans-serif;">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">Actual Location</div>
          <div>This is where the location actually was!</div>
        </div>
      `
    });
    
    // Add click listener to show info window
    maps.event.addListener(actualLocationMarker, 'click', function() {
      actualLocationInfoWindow.open(map, actualLocationMarker);
    });
    
    // Line between the two points
    new maps.Polyline({
      path: [
        guess.position,
        actualLocation.position
      ],
      map,
      geodesic: false,
      strokeColor: "#000000",
      strokeOpacity: 0.5,
      strokeWeight: 1,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 4
        },
        offset: '0',
        repeat: '20px'
      }]
    });
  }, [mapReady, guess, actualLocation]);
  
  // Add markers for other users' guesses
  useEffect(() => {
    // Skip if:
    // - Map isn't ready yet 
    // - No map instance
    // - No other users' guesses
    if (!mapReady || !googleMapRef.current || otherUsersGuesses.length === 0) {
      return;
    }
    
    const map = googleMapRef.current;
    const maps = window.google.maps as any;
    
    // Add markers for other users' guesses
    otherUsersGuesses.forEach(userGuess => {
      try {
        // Create a reliable marker first, to ensure something shows up regardless of pfp loading
        const fallbackMarkerIcon = {
          path: maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#3B82F6",  // Blue color
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: "#FFFFFF"
        };
        
        const marker = new maps.Marker({
          position: userGuess.position,
          map,
          icon: fallbackMarkerIcon,
          title: `${userGuess.name}'s guess (${Math.round(userGuess.distance)} km, ${Math.round(userGuess.score)} pts)`,
          zIndex: 800 // Lower than the main markers but still high
        });
        
        // Create info window with user info
        const infoWindow = new maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 250px; font-family: Arial, sans-serif;">
              <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${userGuess.name}</div>
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background-color: #3B82F6; 
                         color: white; display: flex; justify-content: center; align-items: center; 
                         font-weight: bold; margin-right: 12px; font-size: 18px; border: 3px solid #FFFFFF;">
                  ${userGuess.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style="margin-bottom: 4px;"><strong>Distance:</strong> ${Math.round(userGuess.distance).toLocaleString()} km</div>
                  <div><strong>Score:</strong> ${Math.round(userGuess.score)} points</div>
                </div>
              </div>
            </div>
          `
        });
        
        // Add click listener to show info window
        maps.event.addListener(marker, 'click', function() {
          infoWindow.open(map, marker);
        });
                
        // If the user has a profile picture, try to use it for an enhanced marker
        if (userGuess.pfpUrl) {
          // Try to create a profile picture marker as an enhancement
          // but don't depend on it for the marker to show up
          try {
            // Create a canvas to make a circular image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 96; // Larger size for better quality
            canvas.width = size;
            canvas.height = size;
            
            // Create a new Image element
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
            
            img.onload = () => {
              // Draw circular image on canvas
              if (ctx) {
                // Draw circle
                ctx.beginPath();
                ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                
                // Draw white circle border
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 6;
                ctx.stroke();
                
                // Draw the image
                ctx.drawImage(img, 0, 0, size, size);
                
                try {
                  // Convert canvas to data URL
                  const dataUrl = canvas.toDataURL('image/png');
                  
                  // Create marker with circular image
                  const markerIcon = {
                    url: dataUrl,
                    scaledSize: new maps.Size(48, 48),
                    origin: new maps.Point(0, 0),
                    anchor: new maps.Point(24, 24)
                  };
                  
                  // Image loaded successfully, create enhanced marker
                  const pfpMarker = new maps.Marker({
                    position: userGuess.position,
                    map,
                    icon: markerIcon,
                    title: `${userGuess.name}'s guess (${Math.round(userGuess.distance)} km, ${Math.round(userGuess.score)} pts)`,
                    zIndex: 900 // Higher than the fallback marker
                  });
                  
                  // Create info window with circular profile picture
                  const infoWindow = new maps.InfoWindow({
                    content: `
                      <div style="padding: 12px; max-width: 250px; font-family: Arial, sans-serif;">
                        <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${userGuess.name}</div>
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                          <div style="width: 50px; height: 50px; overflow: hidden; border-radius: 50%; border: 3px solid #3B82F6; margin-right: 12px;">
                            <img src="${userGuess.pfpUrl}" 
                                onerror="this.onerror=null; this.parentNode.innerHTML='<div style=\\'width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:#3B82F6;color:white;font-weight:bold;font-size:18px;\\'>${userGuess.name.slice(0, 1).toUpperCase()}</div>';"
                                style="width: 100%; height: 100%; object-fit: cover;">
                          </div>
                          <div>
                            <div style="margin-bottom: 4px;"><strong>Distance:</strong> ${Math.round(userGuess.distance).toLocaleString()} km</div>
                            <div><strong>Score:</strong> ${Math.round(userGuess.score)} points</div>
                          </div>
                        </div>
                      </div>
                    `
                  });
                  
                  // Close any other info windows when this one is opened
                  maps.event.addListener(pfpMarker, 'click', function() {
                    infoWindow.open(map, pfpMarker);
                  });
                  
                } catch (canvasError) {
                  console.warn("Canvas operation failed:", canvasError);
                }
              }
            };
            
            img.onerror = () => {
              console.warn(`Failed to load profile picture for circular crop: ${userGuess.pfpUrl}`);
              // Fallback was already created, so no action needed
            };
                      
            // Set the source to trigger the load
            img.src = userGuess.pfpUrl;
          } catch (error) {
            console.warn("Failed to create enhanced marker for:", userGuess.name, error);
            // Fallback already created, so we're good
          }
        }
      } catch (error) {
        console.error("Error creating marker for user:", userGuess.name, error);
      }
    });
    
  }, [mapReady, otherUsersGuesses]);
  
  // Reset map instance when component unmounts
  useEffect(() => {
    return () => {
      googleMapRef.current = null;
      initializationAttemptedRef.current = false;
    };
  }, []);

  return (
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
      
      {/* Countdown Timer */}
      <CountdownTimer timeUntilNextRound={timeUntilNextRound} selectedFont={selectedFont} />
      
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      ></div>
    </div>
  );
};

export default ResultsMap; 