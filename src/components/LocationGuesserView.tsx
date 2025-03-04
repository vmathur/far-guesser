"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Game states
type GameState = 'viewing' | 'guessing' | 'results' | 'leaderboard';

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

// Define proper type-safe event listener for Google Maps
interface GoogleMapsEventListener {
  remove(): void;
}

// Define interface for Google Maps options
interface GoogleMapOptions {
  center: { lat: number; lng: number };
  zoom: number;
  streetViewControl?: boolean;
  mapTypeControl?: boolean;
  fullscreenControl?: boolean;
  zoomControl?: boolean;
  [key: string]: unknown;
}

// Define interface for Google Marker options
interface GoogleMarkerOptions {
  position: google.maps.LatLng | google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  draggable?: boolean;
  animation?: number;
  icon?: string | {
    path?: number;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
  };
  label?: string | {
    text: string;
    color?: string;
    fontWeight?: string;
  };
  [key: string]: unknown;
}

// Define a type for dynamic indexing of the window object
interface DynamicWindow extends Window {
  [key: string]: unknown;
}

// Add TypeScript type augmentations using ES2015 module syntax
declare global {
  interface Window {
    initializeStreetView?: () => void;
    initializeMap?: () => void;
    [key: string]: any; // Using any here is acceptable for global window properties
    google: {
      maps: {
        Map: new (
          container: HTMLElement,
          options: GoogleMapOptions
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
        ) => google.maps.StreetViewPanorama;
        Marker: new (options: GoogleMarkerOptions) => google.maps.Marker;
        Animation: {
          DROP: number;
        };
        SymbolPath: {
          CIRCLE: number;
        };
        event: {
          removeListener: (listener: GoogleMapsEventListener) => void;
        }
      };
    };
  }
}

// Augment existing Google Maps types with ES2015 module syntax
declare global {
  namespace google {
    namespace maps {
      interface Map {
        addListener(event: string, handler: (e: any) => void): GoogleMapsEventListener;
        getCenter(): LatLng;
        getZoom(): number;
        setCenter(center: LatLngLiteral | LatLng): void;
        setZoom(zoom: number): void;
      }
      
      interface Marker {
        setMap(map: Map | null): void;
        getPosition(): {lat(): number, lng(): number} | null;
        addListener(event: string, handler: () => void): GoogleMapsEventListener;
      }
      
      interface MapMouseEvent {
        latLng: {lat(): number, lng(): number} | null;
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
        addListener(event: string, handler: () => void): GoogleMapsEventListener;
        getStatus(): string;
      }
    }
  }
}

// Interface for leaderboard entry
interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
  timestamp?: number;
  isCurrentUser?: boolean;
}

const LocationGuesserView = () => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // New refs to track Google Maps objects
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(10000); // Now tracking in milliseconds (10 seconds)
  const [gameState, setGameState] = useState<GameState>('viewing');
  const [loading, setLoading] = useState(true);
  const [guess, setGuess] = useState<Guess | null>(null);
  // Keep the marker state for React rendering, but use the ref for Google Maps operations
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  // Add state for leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

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
    // If we're on the results screen, go to leaderboard instead of starting a new game
    if (gameState === 'results') {
      // Here we would upload the user's score - to be implemented
      setGameState('leaderboard');
      return;
    }
    
    // Reset the game state
    setGameState('viewing');
    setTimeLeft(10000); // Reset to 10 seconds in milliseconds
    setGuess(null);
    setLoading(true);
    
    // Ensure marker is cleared for next round
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
      setMarker(null);
    }
    
    // Reset the map reference to ensure it's reinitialized on next round
    googleMapRef.current = null;
    
    // Select a new random location
    let newLocation: Location;
    do {
      newLocation = locations[Math.floor(Math.random() * locations.length)];
    } while (newLocation.position.lat === currentLocation.position.lat && 
             newLocation.position.lng === currentLocation.position.lng);
    
    setCurrentLocation(newLocation);
  }, [currentLocation, locations, gameState]);

  // Timer effect
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    
    if (gameState === 'viewing' && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => Math.max(0, prev - 100)); // Decrease by 100ms
      }, 100); // Update every 100ms
    } else if (gameState === 'viewing' && timeLeft === 0) {
      // Time's up, move to guessing state
      setGameState('guessing');
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timeLeft, gameState]);

  // Ref to track if Google Maps API is already loading or loaded
  const googleMapsLoadingRef = useRef(false);
  
  // Shared function to load Google Maps API
  const loadGoogleMapsAPI = useCallback((callback: () => void, callerName: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error("Google Maps API key is not defined");
      return;
    }
    
    // Check if the API is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps API already loaded, initializing", callerName);
      callback();
      return;
    }
    
    // Check if already loading
    if (googleMapsLoadingRef.current) {
      console.log("Google Maps API is already being loaded, waiting for it...");
      
      // Set up an interval to check when the API is ready
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          console.log("Google Maps API now available, initializing", callerName);
          clearInterval(checkInterval);
          callback();
        }
      }, 500);
      
      // Clear interval after 10 seconds to avoid infinite checking
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
      
      return;
    }
    
    // Set loading flag
    googleMapsLoadingRef.current = true;
    console.log("Loading Google Maps API for", callerName);
    
    // Create a unique callback name to avoid conflicts
    const callbackName = 'googleMapsCallback' + new Date().getTime();
    
    // Use direct indexing with any
    window[callbackName] = () => {
      console.log("Google Maps API loaded via script");
      googleMapsLoadingRef.current = false;
      
      // Call the initialization function
      callback();
      
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
      googleMapsLoadingRef.current = false;
      setLoading(false);
    };
    
    // Remove any existing Google Maps scripts to avoid conflicts
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
  }, []);

  // Initialize Street View
  useEffect(() => {
    // Only initialize Street View when in viewing state
    if (gameState !== 'viewing' || !streetViewRef.current) return;

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
  }, [currentLocation, gameState]); // Removed loadGoogleMapsAPI from dependencies

  // Initialize the guessing map with shared API loading
  useEffect(() => {
    if (gameState !== 'guessing' || !mapRef.current) return;
    
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
                
                // Create a standard Google Maps marker with default pin
                const newMarker = new window.google.maps.Marker({
                  position: event.latLng,
                  map: googleMapRef.current,
                  draggable: true,
                  animation: window.google.maps.Animation.DROP // Optional animation
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
                
                console.log('Standard marker placed successfully');
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
  }, [gameState, currentLocation.position.lat, currentLocation.position.lng, calculateDistance]); // Removed loadGoogleMapsAPI from dependencies

  // Initialize the results map with both pins and a line between them
  useEffect(() => {
    if (gameState !== 'results' || !mapRef.current || !guess) return;
    
    console.log("Initializing map for results state");
    
    // Reset the map reference to ensure proper reinitialization
    if (googleMapRef.current) {
      console.log("Resetting map reference for results view");
      googleMapRef.current = null;
    }
    
    // Use the shared function to load Google Maps API
    loadGoogleMapsAPI(initializeResultsMap, 'Results Map');
    
    function initializeResultsMap() {
      if (!mapRef.current || !guess) {
        console.error("Map container or guess is not available");
        return;
      }
      
      try {
        console.log("Creating new map instance for results");
        
        const mapElement = mapRef.current;
        
        // Make sure the map element is visible with dimensions
        mapElement.style.display = 'block';
        mapElement.style.height = '100%';
        mapElement.style.width = '100%';
        
        // Add a slight delay to ensure the container is ready and visible
        setTimeout(() => {
          try {
            console.log("Creating map with bounds for both locations");
            
            // Calculate bounds to fit both markers
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(new window.google.maps.LatLng(guess.position.lat, guess.position.lng));
            bounds.extend(new window.google.maps.LatLng(currentLocation.position.lat, currentLocation.position.lng));
            
            // Create the map
            const resultsMap = new window.google.maps.Map(mapElement, {
              center: bounds.getCenter(),
              zoom: 2,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
            });
            
            // Store the map in the ref
            googleMapRef.current = resultsMap;
            
            // Create a marker for user's guess (blue pin)
            new window.google.maps.Marker({
              position: guess.position,
              map: resultsMap,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#EA4335',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              },
              title: 'Your guess'
            });
            
            // Create a marker for actual location (red pin)
            new window.google.maps.Marker({
              position: currentLocation.position,
              map: resultsMap,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              },
              title: 'Actual location'
            });
            
            // Create a dotted polyline between the two points
            const line = new window.google.maps.Polyline({
              path: [guess.position, currentLocation.position],
              geodesic: true,
              strokeColor: '#000000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              // Use a dotted line by setting the strokeOpacity
              icons: [{
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 1,
                  scale: 4
                },
                offset: '0',
                repeat: '10px'
              }]
            });
            
            line.setMap(resultsMap);
            
            // Fit the map to the bounds
            resultsMap.fitBounds(bounds);
            
            // Add some padding to the bounds
            const padding = {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50
            };
            
            resultsMap.fitBounds(bounds, padding);
            
            // Force a resize event to ensure map renders correctly
            window.dispatchEvent(new Event('resize'));
            
            // Remove loading indicator when map is ready
            const loadingIndicator = mapElement.parentElement?.querySelector('.map-loading-indicator');
            if (loadingIndicator && loadingIndicator instanceof HTMLElement) {
              loadingIndicator.style.display = 'none';
            }
            
            // Add an additional delay to ensure the map is fully rendered
            setTimeout(() => {
              if (resultsMap) {
                console.log("Forcing map resize and recentering");
                window.dispatchEvent(new Event('resize'));
                resultsMap.fitBounds(bounds, padding);
              }
            }, 1000);
            
          } catch (error) {
            console.error("Error creating results map:", error);
          }
        }, 300); // Delay to ensure DOM is ready
      } catch (error) {
        console.error("Error initializing results map:", error);
      }
    }
    
    // Clean up function
    return () => {
      console.log("Cleaning up results map effect");
    };
  }, [gameState, guess, currentLocation.position]); // Removed loadGoogleMapsAPI from dependencies

  // Load leaderboard data when entering leaderboard state
  useEffect(() => {
    if (gameState !== 'leaderboard') return;
    
    setIsLeaderboardLoading(true);
    
    // Submit user score to API
    if (guess) {
      const submitScore = async () => {
        try {
          const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'You', // In a real app, this would be the user's name from authentication
              score: guess.distance,
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to submit score');
          } else {
            console.log('Score submitted successfully');
          }
        } catch (error) {
          console.error('Error submitting score:', error);
        }
      };
      
      submitScore();
    }
    
    // Fetch leaderboard data from API
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // Highlight the user's score by changing the name
          const leaderboardWithUser = data.data.map((entry: LeaderboardEntry) => 
            entry.name === 'You' ? { ...entry, isCurrentUser: true } : entry
          );
          
          setLeaderboardData(leaderboardWithUser);
        } else {
          console.error('Invalid leaderboard data format');
          // Fallback to empty array
          setLeaderboardData([]);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback to empty array
        setLeaderboardData([]);
      } finally {
        setIsLeaderboardLoading(false);
      }
    };
    
    // Delay fetching to allow score submission to complete
    setTimeout(fetchLeaderboard, 500);
    
  }, [gameState, guess]);

  // Function to handle the submit guess button
  const handleSubmitGuess = () => {
    if (guess) {
      console.log("Submitting guess, transitioning to results screen");
      
      // Clear any existing map for proper reinitialization
      if (googleMapRef.current) {
        console.log("Clearing existing map for results view");
        googleMapRef.current = null;
      }
      
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
          <div>
            {/* Timer now at the top of the component */}
            <div style={{ 
              backgroundColor: '#f0f0f0',
              color: '#333',
              padding: '8px 15px',
              borderRadius: '8px',
              fontSize: '36px',  // Increased from 28px to 36px
              fontWeight: 'bold',
              marginBottom: '15px',
              display: 'inline-block',
              border: '2px solid #ddd',
              fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive', // Enhanced playful font choices
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              transform: timeLeft < 3000 ? 'scale(1.1)' : 'scale(1)', // Increased scale effect
              width: '160px',  // Increased from 120px to 160px for better spacing
              textAlign: 'center', // Center the text within the fixed width
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
      
      case 'guessing':
        return (
          <div style={{ textAlign: 'center' }}>
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
            </div>
            
            <button
              onClick={handleSubmitGuess}
              disabled={!guess || !marker} // Use marker state to validate submit button
              style={{
                padding: '15px 30px',
                backgroundColor: (guess && marker) ? '#4CAF50' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (guess && marker) ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: (guess && marker) ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
                transition: 'background-color 0.2s ease'
              }}
            >
              Go
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
            
            {guess && (
              <>
                <div style={{ 
                  fontSize: '20px', 
                  marginBottom: '20px', 
                  color: '#000',
                  fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive'
                }}>
                  Your guess was <strong>{guess.distance.toLocaleString()}</strong> km away
                </div>
                
                <div style={{ 
                  height: '500px', 
                  width: '100%', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  marginBottom: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#e8e8e8',
                }}>
                  {/* Loading indicator for results map */}
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
                    pointerEvents: 'none',
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading results map...</div>
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
                      zIndex: 2,
                      opacity: 1,
                      display: 'block'
                    }}
                  ></div>
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
              Next
            </button>
          </div>
        );
        
      case 'leaderboard':
        return (
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>            
            {isLeaderboardLoading ? (
              <div style={{ 
                padding: '40px',
                textAlign: 'center',
                fontSize: '18px',
                color: '#666'
              }}>
                Loading leaderboard...
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  border: '5px solid #f3f3f3',
                  borderTop: '5px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '20px auto'
                }}></div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '30px' }}>
                  <p style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold',
                    color: '#444'
                  }}>
                    New rounds each day
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '30px'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '30px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Rank</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Player</th>
                        <th style={{ padding: '15px', textAlign: 'right' }}>Distance (km)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((entry: LeaderboardEntry, index) => (
                        <tr 
                          key={index}
                          style={{ 
                            backgroundColor: entry.isCurrentUser ? '#e7f5e7' : 'transparent',
                            borderBottom: '1px solid #eee'
                          }}
                        >
                          <td style={{ 
                            padding: '15px',
                            color: index < 3 ? '#4CAF50' : '#666',
                            fontWeight: index < 3 ? 'bold' : 'normal'
                          }}>
                            {entry.rank}
                          </td>
                          <td style={{ 
                            padding: '15px',
                            fontWeight: entry.isCurrentUser ? 'bold' : 'normal'
                          }}>
                            {entry.name}
                          </td>
                          <td style={{ 
                            padding: '15px',
                            textAlign: 'right',
                            color: entry.score < 100 ? '#4CAF50' : (entry.score < 300 ? '#FF9800' : '#F44336')
                          }}>
                            {entry.score.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Call to Action buttons */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <button style={{
                    padding: '12px 24px',
                    backgroundColor: '#4267B2', // Facebook blue
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive'
                  }}>
                    <span>Share</span>
                  </button>
                  
                  <button style={{
                    padding: '12px 24px',
                    backgroundColor: '#FF9800', // Orange
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    fontFamily: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive'
                  }}>
                    <span>Notify Me</span>
                  </button>
                </div>
              </div>
            )}
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

export default LocationGuesserView; 