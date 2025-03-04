"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Game states
type GameState = 'viewing' | 'guessing' | 'results';

// Interface for location data
interface Location {
  position: { lat: number; lng: number };
  answer: string;
  hint: string;
}

// Interface for guess data
interface Guess {
  position: { lat: number; lng: number };
  distance: number;
}

const LocationGuesserView = () => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // New refs to track Google Maps objects
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState<GameState>('viewing');
  const [loading, setLoading] = useState(true);
  const [guess, setGuess] = useState<Guess | null>(null);
  // Keep the marker state for React rendering, but use the ref for Google Maps operations
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  // Array of interesting locations for guessing
  const locations: Location[] = [
    { position: { lat: 40.7580, lng: -73.9855 }, answer: 'New York', hint: 'Times Square' },
    { position: { lat: 48.858093, lng: 2.294694 }, answer: 'Paris', hint: 'Near Eiffel Tower' },
    { position: { lat: 51.510020, lng: -0.134730 }, answer: 'London', hint: 'Near Hyde Park' },
    { position: { lat: 1.283404, lng: 103.863134 }, answer: 'Singapore', hint: 'Marina Bay' },
    { position: { lat: 37.809307, lng: -122.475891 }, answer: 'San Francisco', hint: 'Golden Gate Bridge' },
    { position: { lat: 35.6595, lng: 139.7004 }, answer: 'Tokyo', hint: 'Shibuya Crossing' },
    { position: { lat: -33.8567, lng: 151.2131 }, answer: 'Sydney', hint: 'Near Sydney Opera House' },
  ];
  
  // Select a random location on component mount
  const [currentLocation, setCurrentLocation] = useState<Location>(() => {
    return locations[Math.floor(Math.random() * locations.length)];
  });

  // Calculate distance between two geographical points in kilometers (Haversine formula)
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return Math.round(distance);
  };

  // Reset the game and move to the next location
  const goToNextLocation = useCallback(() => {
    // Reset the game state
    setGameState('viewing');
    setTimeLeft(10);
    setGuess(null);
    setLoading(true);
    
    // Ensure marker is cleared for next round
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
      setMarker(null);
    }
    
    // Select a new random location
    let newLocation: Location;
    do {
      newLocation = locations[Math.floor(Math.random() * locations.length)];
    } while (newLocation.position.lat === currentLocation.position.lat && 
             newLocation.position.lng === currentLocation.position.lng);
    
    setCurrentLocation(newLocation);
  }, [currentLocation, locations]);

  // Timer effect
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    
    if (gameState === 'viewing' && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'viewing' && timeLeft === 0) {
      // Time's up, move to guessing state
      setGameState('guessing');
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timeLeft, gameState]);

  // Initialize Street View
  useEffect(() => {
    // Only initialize Street View when in viewing state
    if (gameState !== 'viewing' || !streetViewRef.current) return;

    console.log("Initializing Street View for viewing state");
    setLoading(true);

    // Load the Google Maps JavaScript API - simplified approach
    const loadGoogleMapsAPI = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error("Google Maps API key is not defined");
        return;
      }
      
      // Check if the API is already loaded
      if (window.google && window.google.maps) {
        console.log("Google Maps API already loaded, initializing Street View");
        initializeStreetView();
        return;
      }
      
      console.log("Loading Google Maps API...");
      
      // Create a unique callback name to avoid conflicts
      const callbackName = 'googleMapsInitialize' + new Date().getTime();
      
      // Define the callback function globally
      window[callbackName] = () => {
        console.log("Google Maps API loaded via script");
        if (streetViewRef.current && gameState === 'viewing') {
          initializeStreetView();
        }
        
        // Clean up
        delete window[callbackName];
      };
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      // Handle errors
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        setLoading(false);
      };
      
      // Remove any existing Google Maps scripts to avoid conflicts
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.remove();
      }
      
      document.head.appendChild(script);
    };
    
    // Initialize the Street View panorama with error handling
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
    
    loadGoogleMapsAPI();
    
    // Clean up
    return () => {
      console.log("Cleaning up Street View effect");
    };
  }, [currentLocation, gameState]);

  // Initialize the guessing map with shared API loading
  useEffect(() => {
    if (gameState !== 'guessing' || !mapRef.current) return;
    
    console.log("Initializing map for guessing state");
    
    // Prevent re-initialization if the map is already created
    if (googleMapRef.current) {
      console.log("Map already exists, skipping initialization");
      return;
    }
    
    // Simplified API check and initialization
    if (!window.google || !window.google.maps) {
      console.log("Google Maps API not loaded for map view, trying to load");
      
      // Check if we're already loading the API (script exists)
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        console.log("API is already loading, waiting...");
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            console.log("Google Maps API now available, initializing map");
            clearInterval(checkInterval);
            initializeMapForGuessing();
          }
        }, 500);
        
        // Clear interval after 10 seconds to avoid infinite checking
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 10000);
        return;
      }
      
      // Load the API if not already loading
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key is not defined");
        return;
      }
      
      const callbackName = 'googleMapsInitMap' + new Date().getTime();
      
      window[callbackName] = () => {
        console.log("Google Maps API loaded for map view");
        if (mapRef.current && gameState === 'guessing') {
          initializeMapForGuessing();
        }
        delete window[callbackName];
      };
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      script.onerror = () => {
        console.error("Failed to load Google Maps API for map view");
      };
      
      document.head.appendChild(script);
      return;
    }
    
    initializeMapForGuessing();
    
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
              mapTypeControl: true,
              fullscreenControl: true,
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
                
                // Create a very visible marker with no animation
                const newMarker = new window.google.maps.Marker({
                  position: event.latLng,
                  map: googleMapRef.current,
                  draggable: true,
                  // Use a custom highly visible marker
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: "#FF0000",
                    fillOpacity: 1.0,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 3,
                  },
                  // Add a label for extra visibility
                  label: {
                    text: "X",
                    color: "#FFFFFF",
                    fontWeight: "bold"
                  }
                });
                
                // Store marker in both ref and state
                markerRef.current = newMarker;
                setMarker(newMarker); // For React rendering purposes only
                
                // Update guess position
                const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
                const distance = calculateDistance(
                  newPosition.lat,
                  newPosition.lng,
                  currentLocation.position.lat,
                  currentLocation.position.lng
                );
                
                setGuess({
                  position: newPosition,
                  distance: distance
                });
                
                // Update guess when marker is dragged
                newMarker.addListener('dragend', () => {
                  const position = newMarker.getPosition();
                  if (position) {
                    setGuess({
                      position: { lat: position.lat(), lng: position.lng() },
                      distance: calculateDistance(
                        position.lat(),
                        position.lng(),
                        currentLocation.position.lat,
                        currentLocation.position.lng
                      )
                    });
                  }
                });
                
                console.log('Marker placed successfully and visible on map');
              } catch (error) {
                console.error("Error creating marker:", error);
              }
            };
            
            // Add click listener
            newMap.addListener('click', mapClickHandler);
            
            // Force a resize event to ensure map renders correctly
            window.dispatchEvent(new Event('resize'));
            
          } catch (error) {
            console.error("Error creating map:", error);
          }
        }, 300); // Longer delay for better reliability
        
      } catch (error) {
        console.error("Error in map initialization:", error);
      }
    }
    
    // Clean up function - only runs when component unmounts or gameState changes
    return () => {
      console.log("Cleaning up map effect");
    };
  }, [gameState, currentLocation.position.lat, currentLocation.position.lng, calculateDistance]); // Removed marker from dependencies

  // Function to handle the submit guess button
  const handleSubmitGuess = () => {
    if (guess) {
      // Add points based on how close the guess was (max 5000 points)
      const maxDistance = 20000; // km
      const newPoints = Math.max(0, Math.round(5000 * (1 - guess.distance / maxDistance)));
      setScore(prevScore => prevScore + newPoints);
      
      // Move to results state
      setGameState('results');
    }
  };

  // Function to handle the "Guess Location" button
  const handleGuessLocationClick = () => {
    console.log('Guess Location button clicked, current state:', gameState);
    
    // Clear the marker and guess
    setGuess(null);
    
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
      setMarker(null);
    }
    
    // Force state update
    setGameState('guessing');
    
    // Reset the map if it exists
    if (googleMapRef.current) {
      // Re-center and re-zoom the map
      googleMapRef.current.setCenter({ lat: 20, lng: 0 });
      googleMapRef.current.setZoom(2);
    }
    
    console.log('State change requested: viewing -> guessing');
    
    // Make sure the map container is visible
    if (mapRef.current) {
      mapRef.current.style.display = 'block';
      mapRef.current.style.visibility = 'visible';
      mapRef.current.style.opacity = '1';
    }
  };

  // Render different components based on game state
  const renderGameState = () => {
    console.log("Rendering game state:", gameState);
    
    switch (gameState) {
      case 'viewing':
        return (
          <div className="street-view-container" style={{
            height: '500px',
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px',
            overflow: 'hidden',
            position: 'relative'
          }}>
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
            
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              zIndex: 5
            }}>
              Time left: {timeLeft}s
            </div>
            
            <div
              ref={streetViewRef}
              style={{
                width: '100%',
                height: '100%'
              }}
            />
            
            {/* Improved button container with better visibility */}
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10 // Ensure button is above map
            }}>
              <button
                onClick={handleGuessLocationClick}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#388E3C';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#4CAF50';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Guess Location
              </button>
            </div>
          </div>
        );
      
      case 'guessing':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '15px', color: '#000' }}>Place your guess on the map</h2>
            <p style={{ marginBottom: '15px', color: '#555' }}>
              Tap anywhere on the map to place your marker
            </p>
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
              
              {guess && (
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  zIndex: 10,
                  fontWeight: 'bold'
                }}>
                  Marker placed at: {guess.position.lat.toFixed(4)}, {guess.position.lng.toFixed(4)}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSubmitGuess}
              disabled={!guess}
              style={{
                padding: '15px 30px',
                backgroundColor: guess ? '#4CAF50' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: guess ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: guess ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
                transition: 'background-color 0.2s ease'
              }}
            >
              Submit Guess
            </button>
          </div>
        );
      
      case 'results':
        return (
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            color: '#000'
          }}>
            <h2 style={{ marginBottom: '15px', color: '#000' }}>Results</h2>
            
            {guess && (
              <>
                <div style={{ fontSize: '24px', marginBottom: '10px', color: '#000' }}>
                  The actual location was <strong>{currentLocation.answer}</strong>
                </div>
                
                <div style={{ fontSize: '20px', marginBottom: '20px', color: '#000' }}>
                  Your guess was <strong>{guess.distance.toLocaleString()}</strong> km away
                </div>
                
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: 
                    guess.distance < 100 ? '#dff0d8' : 
                    guess.distance < 1000 ? '#fcf8e3' : '#f2dede',
                  color: 
                    guess.distance < 100 ? '#3c763d' : 
                    guess.distance < 1000 ? '#8a6d3b' : '#a94442',
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}>
                  {guess.distance < 100 
                    ? 'Amazing! That was very close!' 
                    : guess.distance < 1000 
                      ? 'Not bad! You were in the right region.' 
                      : 'Quite far off! Better luck next time.'}
                </div>
                
                <div style={{ fontSize: '18px', marginBottom: '20px', color: '#000' }}>
                  Current Score: <strong>{score}</strong>
                </div>
              </>
            )}
            
            <button
              onClick={goToNextLocation}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
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
          </div>
        );
        
      default:
        // Fallback in case of unknown state
        return <div>Unknown game state: {gameState}</div>;
    }
  };

  return (
    <div className="location-guesser">
      {renderGameState()}
    </div>
  );
};

// Add a TypeScript declaration for the global functions and objects
declare global {
  interface Window {
    initializeStreetView?: () => void;
    initializeMap?: () => void;
    [key: string]: any; // Allow dynamic properties for callbacks
    google: {
      maps: {
        Map: new (
          container: HTMLElement,
          options: any
        ) => google.maps.Map;
        StreetViewPanorama: new (
          container: HTMLElement,
          options: {
            position: { lat: number; lng: number };
            pov: { heading: number; pitch: number };
            zoom: number;
            addressControl: boolean;
            showRoadLabels: boolean;
            linksControl: boolean;
            panControl: boolean;
            enableCloseButton: boolean;
            fullscreenControl: boolean;
            motionTracking: boolean;
            motionTrackingControl: boolean;
            zoomControl: boolean;
          }
        ) => unknown;
        Marker: new (options: any) => google.maps.Marker;
        MapMouseEvent: any;
        Animation: {
          DROP: number;
        };
        SymbolPath: {
          CIRCLE: number;
        };
        event: {
          removeListener: (listener: any) => void;
        }
      };
    };
  }
}

// Add Google Maps types that are missing
declare namespace google.maps {
  interface Map {
    addListener(event: string, handler: (e: any) => void): any;
    getCenter(): google.maps.LatLng;
    getZoom(): number;
    setCenter(center: google.maps.LatLngLiteral | google.maps.LatLng): void;
    setZoom(zoom: number): void;
  }
  
  interface Marker {
    setMap(map: Map | null): void;
    getPosition(): {lat(): number, lng(): number} | null;
    addListener(event: string, handler: () => void): any;
  }
  
  interface MapMouseEvent {
    latLng?: {
      lat(): number;
      lng(): number;
    };
  }
  
  interface LatLng {
    lat(): number;
    lng(): number;
    toJSON(): LatLngLiteral;
    toString(): string;
    equals(other: LatLng): boolean;
  }
  
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  
  interface Size {
    width: number;
    height: number;
  }
  
  interface Point {
    x: number;
    y: number;
  }
  
  interface StreetViewPanorama {
    addListener(event: string, handler: () => void): any;
    getStatus(): string;
  }
}

export default LocationGuesserView; 