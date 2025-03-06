import { useRef, useCallback } from 'react';

// Function to load Google Maps API
export const useGoogleMapsLoader = (setLoading: (loading: boolean) => void) => {
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