import React, { createContext, useState, useContext, ReactNode } from 'react';
import { track as vercelTrack } from '@vercel/analytics';
import { setUserFid as setAnalyticsUserFid, setUserName as setAnalyticsUserName } from './analytics';

type AnalyticsContextType = {
  setFid: (fid: string | number | undefined | null) => void;
  setUsername: (username: string | undefined | null) => void;
  trackEvent: (eventName: string, eventProps?: Record<string, any>) => void;
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [fid, setFidState] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);

  const setFid = (newFid: string | number | undefined | null) => {
    if (newFid) {
      const fidString = newFid.toString();
      setFidState(fidString);
      
      // IMPORTANT: Also set the FID in the analytics module
      // This ensures getUserFid() will return the correct value
      setAnalyticsUserFid(fidString);
    }
  };

  const setUsername = (newUsername: string | undefined | null) => {
    if (newUsername) {
      setUsernameState(newUsername);
      
      // Also set the username in the analytics module
      setAnalyticsUserName(newUsername);
    }
  };

  const trackEvent = (eventName: string, eventProps?: Record<string, any>) => {
    if (!fid) return;
    
    try {
      vercelTrack(eventName, {
        fid,
        username,
        ...eventProps
      });
    } catch (error) {
      // Silent error handling in production
    }
  };

  const value = {
    setFid,
    setUsername,
    trackEvent
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
}; 