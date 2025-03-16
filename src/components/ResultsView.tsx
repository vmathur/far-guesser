"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Guess, Location } from './types/LocationGuesserTypes';
import { useGoogleMapsLoader, useGoogleMapsLoaded, calculateDistance } from './utils/GoogleMapsUtil';
import sdk from '@farcaster/frame-sdk';
import { useGameAnalytics } from '../lib/analytics';
import {
  useSendTransaction,
  useConnect
} from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { motion } from 'framer-motion';
// Calculate score based on distance (kilometers)
const calculateScore = (distanceInKm: number): number => {
  // Score formula: 100 * e^(-distance/2000)
  // This matches the formula used on the server
  return 100 * Math.exp(-distanceInKm / 2000);
};

interface ResultsViewProps {
  guess: Guess;
  actualLocation: Location;
  onNextLocation: () => void;
  selectedFont?: string;
  errorMessage?: string | null;
  timeUntilNextRound?: number;
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
// Define a simple type for Google Maps objects
type GoogleMapsInstance = any;

// Define a type for other users' guesses
interface UserGuess {
  name: string;
  fid?: string;
  pfpUrl?: string;
  position: {
    lat: number;
    lng: number;
  };
  score: number;
  distance: number;
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  guess, 
  actualLocation, 
  onNextLocation,
  selectedFont = 'Chalkboard SE',
  errorMessage = null,
  timeUntilNextRound
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMapsInstance | null>(null);
  const initializationAttemptedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sdkContext, setSdkContext] = useState<FrameSDKContext | null>(null);
  const [score, setScore] = useState<number>(0);
  const [leaderboardPreview, setLeaderboardPreview] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<any[]>([]);
  const [mapsInitAttempts, setMapsInitAttempts] = useState(0);
  const { isLoaded: googleMapsLoaded } = useGoogleMapsLoaded();
  const analytics = useGameAnalytics();
  const [otherUsersGuesses, setOtherUsersGuesses] = useState<UserGuess[]>([]);
  // Add a state to track if the map is ready
  const [mapReady, setMapReady] = useState(false);
  
  // Add states to track hover for each button
  const [mintButtonHovered, setMintButtonHovered] = useState(false);
  const [shareButtonHovered, setShareButtonHovered] = useState(false);
  const [allTimeScoresButtonHovered, setAllTimeScoresButtonHovered] = useState(false);
  
  // Add state for the countdown timer
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number }>({ 
    hours: 24, 
    minutes: 0, 
    seconds: 0 
  });

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();
  const {connect} = useConnect()
  
  
  // Load Google Maps API
  const loadGoogleMapsAPI = useGoogleMapsLoader(setLoading);
  
  // Handle Google Maps loading
  useEffect(() => {
    if (!googleMapsLoaded) {
      console.log('Loading Google Maps in ResultsView');
      loadGoogleMapsAPI(() => {
        console.log('Google Maps loaded callback in ResultsView');
      }, 'ResultsView');
    }
  }, [googleMapsLoaded, loadGoogleMapsAPI]);
  
  // Calculate score when component mounts
  useEffect(() => {
    if (guess?.distance) {
      const calculatedScore = calculateScore(guess.distance);
      setScore(calculatedScore);
    }
  }, [guess]);
  
  // Load SDK context
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
  // Track results_viewed event when component mounts
  useEffect(() => {
    if (guess?.distance) {
      analytics.resultsViewed({ distance: guess.distance });
    }
  }, [guess, analytics]);
  
  // Fetch other users' guesses when SDK context is loaded and process leaderboard data
  useEffect(() => {
    const fetchOtherUsersGuesses = async () => {
      if (!sdkContext) return;
      
      try {
        setLeaderboardLoading(true);
        
        // Add FID to headers if available
        const headers = new Headers();
        if (sdkContext.user?.fid) {
          headers.append('X-Farcaster-User-FID', sdkContext.user.fid.toString());
        }
        
        console.log("Fetching leaderboard data and other users' guesses...");
        
        const response = await fetch('/api/leaderboard?type=daily&include_guesses=true', {
          headers
        });
        const data = await response.json();
        
        console.log("Leaderboard API response:", data);
        
        if (data.success && data.leaderboard) {
          // Store the full daily leaderboard
          setDailyLeaderboard(data.leaderboard);
          
          // No need to set preview since we'll show all entries
          
          // Try to find the user's rank if they have an FID
          const userFid = sdkContext?.user?.fid;
          if (userFid && data.leaderboard.length > 0) {
            const userIndex = data.leaderboard.findIndex((entry: any) => 
              entry.fid && entry.fid.toString() === userFid.toString()
            );
            
            if (userIndex !== -1) {
              setUserRank(userIndex + 1);
            }
          }
          
          // Filter out the current user's guess and entries without position data for map markers
          const otherGuesses = data.leaderboard
            .filter((entry: any) => {
              const isCurrentUser = sdkContext.user?.fid && 
                entry.fid && 
                entry.fid.toString() === sdkContext.user.fid.toString();
              
              const hasValidPosition = entry.position && entry.position.lat && entry.position.lng;
              
              console.log(`Entry ${entry.name}:`, 
                `isCurrentUser=${isCurrentUser}`, 
                `hasPosition=${!!entry.position}`, 
                `hasValidPosition=${hasValidPosition}`,
                `pfpUrl=${entry.pfpUrl || 'none'}`
              );
              
              return !isCurrentUser && hasValidPosition;
            })
            .map((entry: any) => ({
              name: entry.name,
              fid: entry.fid,
              pfpUrl: entry.pfpUrl,
              position: {
                lat: entry.position.lat,
                lng: entry.position.lng
              },
              score: entry.score,
              distance: entry.distance
            }));
          
          console.log(`Found ${otherGuesses.length} other users' guesses:`, otherGuesses);
          setOtherUsersGuesses(otherGuesses);
        } else {
          console.warn("API response missing success or leaderboard data", data);
        }
        
        setLeaderboardLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setLeaderboardLoading(false);
      }
    };
    
    fetchOtherUsersGuesses();
  }, [sdkContext]);
  
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
    
    console.log(`Initializing results map (attempt ${mapsInitAttempts + 1})`);
    
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
        console.log('Map initialized and ready for markers');
      });
      
      console.log('Map initialized successfully');
      setLoading(false);
    } catch (error) {
      console.error("Error initializing results map:", error);
      
      // Retry after delay with exponential backoff
      const retryDelay = Math.pow(2, mapsInitAttempts) * 500;
      console.log(`Will retry map initialization in ${retryDelay}ms`);
      
      setTimeout(() => {
        setMapsInitAttempts(prev => prev + 1);
      }, retryDelay);
    }
  }, [actualLocation, guess, googleMapsLoaded, mapsInitAttempts, otherUsersGuesses]);

  // Separate useEffect for adding markers after the map is ready
  useEffect(() => {
    // Skip if:
    // - Map isn't ready yet
    // - No map instance
    // - No valid positions
    if (!mapReady || !googleMapRef.current || !guess?.position || !actualLocation?.position) {
      return;
    }

    console.log('Adding markers to map');
    const map = googleMapRef.current;
    const maps = window.google.maps as any;

    // Clean up any existing user and actual location markers (if we're re-running this effect)
    // We'll keep this simple and just add the markers without tracking them for cleanup

    // User's guess marker (red)
    new maps.Marker({
          position: guess.position,
          map,
          icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 14,
            fillColor: "#FF0000",
            fillOpacity: 0.8,
        strokeWeight: 3,
            strokeColor: "#FFFFFF"
      },
      title: "Your guess"
    });
    
    // Actual location marker (green) - using a standard Google Maps marker
    console.log("Creating actual location marker at:", actualLocation.position);
    
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
      console.log("Actual location marker clicked");
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
  
  // Separate useEffect for adding other player markers
  useEffect(() => {
    // Skip if:
    // - Map isn't ready yet 
    // - No map instance
    // - No other users' guesses
    if (!mapReady || !googleMapRef.current || otherUsersGuesses.length === 0) {
      return;
    }
    
    console.log('Adding other player markers to map');
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
                                onerror="this.onerror=null; this.parentNode.innerHTML='<div style=\'width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:#3B82F6;color:white;font-weight:bold;font-size:18px;\'>${userGuess.name.slice(0, 1).toUpperCase()}</div>';"
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
                  
                  console.log("Successfully created circular profile picture marker for:", userGuess.name);
                } catch (canvasError) {
                  console.warn("Canvas operation failed:", canvasError);
                  // Fallback to the original approach
                  fallbackToOriginalImage();
                }
              } else {
                // Canvas context not available, fall back
                fallbackToOriginalImage();
              }
            };
            
            img.onerror = () => {
              console.warn(`Failed to load profile picture for circular crop: ${userGuess.pfpUrl}`);
              // Fallback was already created, so no action needed
            };
            
            // Function to fall back to original image if canvas approach fails
            const fallbackToOriginalImage = () => {
              const markerIcon = {
                url: userGuess.pfpUrl,
                scaledSize: new maps.Size(48, 48),
                origin: new maps.Point(0, 0),
                anchor: new maps.Point(24, 24)
              };
              
              // Create marker with the original image
              const pfpMarker = new maps.Marker({
                position: userGuess.position,
                map,
                icon: markerIcon,
                title: `${userGuess.name}'s guess (${Math.round(userGuess.distance)} km, ${Math.round(userGuess.score)} pts)`,
                zIndex: 900 // Higher than the fallback marker
              });
              
              // Add the same click listener to the enhanced marker
              maps.event.addListener(pfpMarker, 'click', function() {
                infoWindow.open(map, pfpMarker);
              });
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

  const handleShare = () => {
    analytics.shareClicked();
    
    const message = `I was ${guess.distance.toLocaleString()} km away from today's mystery location 📍. Can you beat me?\n\n`;
    // URL encode the message, ensuring newlines are properly encoded
    const encodedMessage = encodeURIComponent(message);
    const encodedFrameUrl = encodeURIComponent(process.env.NEXT_PUBLIC_URL || '');

    // Use the Farcaster SDK to open the Warpcast compose page
    sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodedMessage}&embeds[]=${encodedFrameUrl}`);
  };

  const handleMint = useCallback(() => {
    connect({connector: farcasterFrame()})
    sendTransaction(
      {
        // call mint() on Yoink contract
        to: "0x247757adefbf623b7762102da57ec881de308eea",
        data: '0x1249c58b', // Function selector for mint()
        value: BigInt("10000000000000")
      },
      {
        onSuccess: (hash) => {
          console.log('minted '+hash)
        },
      }
    );
  }, [sendTransaction]);

  // Render the leaderboard section
  const renderLeaderboardPreview = () => {
    if (leaderboardLoading) {
      return <div className="leaderboard-loading">Loading leaderboard...</div>;
    }
    
    // Debug leaderboard data to check pfpUrl
    console.log("Rendering leaderboard with data:", dailyLeaderboard);
    
    return (
      <div className="leaderboard-preview" style={{ 
        marginTop: '30px', 
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        fontFamily: selectedFont
      }}>
        {/* <h3 style={{
          textAlign: 'left',
          borderBottom: '2px solid #ddd',
          paddingBottom: '10px',
          marginTop: '0'
        }}>
          Daily Leaderboard
        </h3>
         */}
        {dailyLeaderboard.length > 0 ? (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Player</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Score</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Distance</th>
                </tr>
              </thead>
              <tbody>
                {dailyLeaderboard.map((entry, index) => {
                  
                  return (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: sdkContext?.user?.fid && 
                        entry.fid && 
                        entry.fid.toString() === sdkContext.user.fid.toString() 
                        ? '#fffde7' 
                        : 'transparent'
                    }}>
                      <td style={{ padding: '8px', width: '40px' }}>{index + 1}</td>
                      <td style={{ padding: '8px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            overflow: 'hidden',
                            marginRight: '10px',
                            backgroundColor: '#3B82F6',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            border: '2px solid white',
                            flexShrink: 0
                          }}>
                            {entry.pfpUrl && entry.pfpUrl.length > 0 ? (
                              <img 
                                src={entry.pfpUrl} 
                                alt={entry.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onLoad={() => console.log(`${entry.name}'s profile image loaded successfully`)}
                                onError={(e) => {
                                  console.warn(`Failed to load profile image for ${entry.name}:`, entry.pfpUrl);
                                  // Replace with initial if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.innerHTML = entry.name.slice(0, 1).toUpperCase();
                                }}
                              />
                            ) : (
                              entry.name.slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div style={{ fontWeight: sdkContext?.user?.fid && 
                              entry.fid && 
                              entry.fid.toString() === sdkContext.user.fid.toString() ? 'bold' : 'normal' }}>
                            {entry.name}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{Math.round(entry.score)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{Math.round(entry.distance).toLocaleString()} km</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <p>No entries in the leaderboard yet. Be the first!</p>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <motion.button
            onClick={onNextLocation}
            className="bg-gray-200 text-black font-bold py-3 px-8 rounded-lg text-lg select-none touch-none"
             initial={{ 
               boxShadow: "0px 5px 0px  rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)" 
             }}
             whileTap={{ 
               y: 5,
               boxShadow: "0px 0px 0px  rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
               transition: { duration: 0.1 }
             }}
           >
            All time scores →
          </motion.button>
        </div>
      </div>
    );
  };

  // Add a countdown timer effect
  useEffect(() => {
    // Calculate end time based on timeUntilNextRound (in milliseconds) or default to 7 hours
    const now = new Date();
    const endTime = new Date();
    
    if (timeUntilNextRound !== undefined) {
      // Add timeUntilNextRound milliseconds to the current time
      endTime.setTime(now.getTime() + timeUntilNextRound);
    } else {
      // Fallback to 7 hours if timeUntilNextRound is not provided
      endTime.setHours(endTime.getHours() + 24);
    }
    
    const timerInterval = setInterval(() => {
      const currentTime = new Date();
      const diff = endTime.getTime() - currentTime.getTime();
      
      if (diff <= 0) {
        // Timer completed
        clearInterval(timerInterval);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds });
    }, 1000);
    
    // Cleanup
    return () => clearInterval(timerInterval);
  }, [timeUntilNextRound]);

  return (
    <div style={{ 
      textAlign: 'center',
      padding: '10px',
      color: '#000'
    }}>
      
      {errorMessage && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ffcdd2',
          fontFamily: `"${selectedFont}", "Comic Sans MS", cursive`
        }}>
          {errorMessage}
        </div>
      )}
      
      <div style={{ 
        fontSize: '20px', 
        marginBottom: '20px', 
        color: '#000',
        fontFamily: `"${selectedFont}", "Comic Sans MS", cursive`
      }}>
        {/* Your guess was <strong>{guess.distance.toLocaleString()}</strong> km away (<strong>{Math.round(score)}</strong> points) */}
        <p style={{ fontSize: '30px' }}><b>You were <strong>{guess.distance.toLocaleString()}</strong> km away</b></p>

      </div>
      <div style={{ marginBottom: '20px' }}>
          <div>

            <motion.button
                onClick={handleMint}
                className="bg-gray-200 text-black font-bold py-3 px-8 rounded-lg text-lg mr-10 select-none touch-none"
                initial={{ 
                  boxShadow: "0px 5px 0px  rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)" 
                }}
                whileTap={{ 
                  y: 5,
                  boxShadow: "0px 0px 0px  rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
                  transition: { duration: 0.1 }
                }}
              >
                Mint
            </motion.button>
            <motion.button
                onClick={handleShare}
                className="bg-gray-200 text-black  font-bold py-3 px-8 rounded-lg text-lg select-none touch-none"
                initial={{ 
                  boxShadow: "0px 5px 0px  rgba(0, 0, 0, 0.5), 0px 5px 10px rgba(0, 0, 0, 0.5)" 
                }}
                whileTap={{ 
                  y: 5,
                  boxShadow: "0px 0px 0px  rgba(0, 0, 0, 0.5), 0px 0px 0px rgba(0, 0, 0, 0.5)",
                  transition: { duration: 0.1 }
                }}
              >
                Share
            </motion.button>
          </div>
        </div>
      
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
        <div style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          zIndex: 10,
          fontFamily: selectedFont,
          fontSize: '16px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ marginRight: '8px' }}>Next round:</div>
          <div style={{ fontWeight: 'bold' }}>
            {String(timeRemaining.hours).padStart(2, '0')}:
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
        </div>
        
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%'
          }}
        ></div>
      </div>
      {/* Add leaderboard preview at the end */}
      {renderLeaderboardPreview()}
    </div>
  );
};

export default ResultsView; 