import { useRef, useCallback, useState, useEffect } from 'react';

// Global tracking of Google Maps loading state
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;
let loadCallbacks: (() => void)[] = [];

// Function to execute all pending callbacks
function executeCallbacks() {
  while (loadCallbacks.length > 0) {
    const callback = loadCallbacks.shift();
    if (callback) {
      try {
        callback();
      } catch (error) {
        console.error("Error executing callback after Google Maps loaded:", error);
      }
    }
  }
}

// Hook to check if Google Maps is loaded
export const useGoogleMapsLoaded = () => {
  const [isLoaded, setIsLoaded] = useState(
    typeof window !== 'undefined' && !!window.google && !!window.google.maps
  );
  
  useEffect(() => {
    if (isLoaded) return;
    
    // Check if already loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }
    
    // Add a callback to set loaded state when Maps loads
    const callback = () => setIsLoaded(true);
    loadCallbacks.push(callback);
    
    return () => {
      // Remove callback on unmount
      loadCallbacks = loadCallbacks.filter(cb => cb !== callback);
    };
  }, [isLoaded]);
  
  return { isLoaded };
};

// Function to load Google Maps API
export const useGoogleMapsLoader = (setLoading: (loading: boolean) => void) => {
  // Shared function to load Google Maps API
  const loadGoogleMapsAPI = useCallback((callback: () => void, callerName: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error("Google Maps API key is not defined");
      setLoading(false);
      return;
    }
    
    // Check if the API is already loaded
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      callback();
      return;
    }
    
    // Register the callback to be called when Maps loads
    loadCallbacks.push(callback);
    
    // If already loading, don't start another load
    if (isGoogleMapsLoading) {
      return;
    }
    
    // Set loading flag
    isGoogleMapsLoading = true;
    console.log("Loading Google Maps API for", callerName);
    
    // Create a unique callback name to avoid conflicts
    const callbackName = 'googleMapsCallback' + new Date().getTime();
    
    // Use direct indexing with any
    window[callbackName] = () => {
      isGoogleMapsLoading = false;
      isGoogleMapsLoaded = true;
      
      // Execute all registered callbacks
      executeCallbacks();
      
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
      isGoogleMapsLoading = false;
      setLoading(false);
    };
    
    // Remove any existing Google Maps scripts to avoid conflicts
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
  }, [setLoading]);
  
  return loadGoogleMapsAPI;
};

// Calculate distance between two geographical points in kilometers (Haversine formula)
export const calculateDistance = (
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