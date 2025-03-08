import React, { createContext, useState, useContext, ReactNode } from 'react';
import { track as vercelTrack } from '@vercel/analytics';

type AnalyticsContextType = {
  setFid: (fid: string | number | undefined | null) => void;
  trackEvent: (eventName: string, eventProps?: Record<string, any>) => void;
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [fid, setFidState] = useState<string | null>(null);

  const setFid = (newFid: string | number | undefined | null) => {
    if (newFid) {
      setFidState(newFid.toString());
    }
  };

  const trackEvent = (eventName: string, eventProps?: Record<string, any>) => {
    if (!fid) return;
    
    try {
      vercelTrack(eventName, {
        fid,
        ...eventProps
      });
    } catch (error) {
      // Silent error handling in production
    }
  };

  const value = {
    setFid,
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