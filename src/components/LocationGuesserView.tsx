"use client";

import React, { useEffect, useRef, useState } from 'react';

const LocationGuesserView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [guessInput, setGuessInput] = useState('');
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Array of interesting locations for guessing
  const locations = [
    { position: { lat: 40.7580, lng: -73.9855 }, answer: 'New York', hint: 'Times Square' },
    { position: { lat: 48.858093, lng: 2.294694 }, answer: 'Paris', hint: 'Near Eiffel Tower' },
    { position: { lat: 51.510020, lng: -0.134730 }, answer: 'London', hint: 'Near Hyde Park' },
    { position: { lat: 1.283404, lng: 103.863134 }, answer: 'Singapore', hint: 'Marina Bay' },
    { position: { lat: 37.809307, lng: -122.475891 }, answer: 'San Francisco', hint: 'Golden Gate Bridge' },
  ];
  
  // Select a random location on component mount
  const [currentLocation, setCurrentLocation] = useState(() => {
    return locations[Math.floor(Math.random() * locations.length)];
  });

  useEffect(() => {
    // Load the Google Maps JavaScript API
    const loadGoogleMapsAPI = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      // Check if the API is already loaded
      if (window.google && window.google.maps) {
        initializeStreetView();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initializeStreetView`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function globally
      window.initializeStreetView = initializeStreetView;
      
      document.head.appendChild(script);
      
      return () => {
        // Clean up global callback when component unmounts
        if (window.initializeStreetView) {
          // Using the optional chaining to safely delete the property
          delete window.initializeStreetView;
        }
        
        // Only remove the script if it exists in the document
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      };
    };
    
    // Initialize the Street View panorama
    const initializeStreetView = () => {
      if (!mapRef.current) return;
      
      // Create the panorama but no need to store the reference since Google Maps manages it
      new window.google.maps.StreetViewPanorama(
        mapRef.current,
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
      );
      
      setLoading(false);
    };
    
    loadGoogleMapsAPI();
  }, [currentLocation]);
  
  // Handle user guess
  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userGuess = guessInput.trim().toLowerCase();
    const correctAnswer = currentLocation.answer.toLowerCase();
    
    if (userGuess === correctAnswer) {
      setScore(score + 1);
      setMessage(`Correct! That was ${currentLocation.answer}. +1 point!`);
      
      // Move to a new location
      setTimeout(() => {
        const newLocation = locations[Math.floor(Math.random() * locations.length)];
        setCurrentLocation(newLocation);
        setGuessInput('');
        setMessage('');
        setLoading(true);
      }, 2000);
    } else {
      setMessage(`Incorrect. Try again!`);
    }
  };
  
  // Handle giving up / requesting a hint
  const handleHint = () => {
    setMessage(`Hint: ${currentLocation.hint}`);
  };

  return (
    <div className="location-guesser">
      <div className="street-view-container" style={{
        height: '400px',
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
            backgroundColor: '#f0f0f0'
          }}>
            Loading Street View...
          </div>
        )}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <form onSubmit={handleGuess} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Enter your guess (city name)"
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              flex: 1
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Guess
          </button>
          <button
            type="button"
            onClick={handleHint}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0ad4e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Hint
          </button>
        </form>
      </div>
      
      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Correct') ? '#dff0d8' : message.includes('Hint') ? '#fcf8e3' : '#f2dede',
          color: message.includes('Correct') ? '#3c763d' : message.includes('Hint') ? '#8a6d3b' : '#a94442',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{
        textAlign: 'center',
        fontSize: '1.2em',
        fontWeight: 'bold'
      }}>
        Score: {score}
      </div>
    </div>
  );
};

// Add a TypeScript declaration for the global initializeStreetView function
declare global {
  interface Window {
    initializeStreetView?: () => void;
    google: {
      maps: {
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
      };
    };
  }
}

export default LocationGuesserView; 