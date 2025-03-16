/**
 * Utility functions for sending game notifications to users
 */

import { useCallback, useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

// Define the SDK context type
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

/**
 * Hook for sending game notifications to the current user
 * @returns A function that can be called to send notifications
 */
export function useSendGameNotification() {
  const [userFid, setUserFid] = useState<number | undefined>(undefined);
  
  // Get FID from SDK context
  useEffect(() => {
    const loadSdkContext = async () => {
      try {
        if (sdk) {
          const context = await sdk.context;
          if (context?.user?.fid) {
            setUserFid(context.user.fid);
          }
        }
      } catch (error) {
        console.error('Error loading SDK context:', error);
      }
    };
    
    loadSdkContext();
    
    // Listen for SDK context updates
    const handleSdkContextUpdate = (event: any) => {
      if (event.detail?.sdkContext?.user?.fid) {
        setUserFid(event.detail.sdkContext.user.fid);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('sdk-context-update', handleSdkContextUpdate);
      
      return () => {
        window.removeEventListener('sdk-context-update', handleSdkContextUpdate);
      };
    }
  }, []);
  
  /**
   * Sends a notification to the current user
   * @param title Notification title
   * @param body Notification body text
   * @returns Promise with the result of the notification attempt
   */
  const sendNotification = useCallback(async (
    title: string, 
    body: string
  ): Promise<{ success: boolean; error?: string }> => {
    // If user FID is not available, we can't send a notification
    if (!userFid) {
      return { 
        success: false, 
        error: "User FID not available" 
      };
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: userFid,
          title,
          body
          // We don't need to explicitly provide notificationDetails
          // The server will retrieve them from storage for this FID
        }),
      });

      if (response.status === 200) {
        return { success: true };
      } else if (response.status === 429) {
        return { success: false, error: "Rate limited" };
      } else {
        const errorData = await response.text();
        return { success: false, error: errorData || "Unknown error" };
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }, [userFid]);

  return sendNotification;
} 