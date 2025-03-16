"use client";

import { useCallback, useEffect, useState } from 'react';
import sdk, { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { setUserNotificationDetails } from "~/lib/kv";
import { useAnalytics } from "~/lib/AnalyticsContext";

// Define the SDK context type based on what's available
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

// FarcasterRequiredPopup component
const FarcasterRequiredPopup = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto text-center shadow-xl" style={{ fontSize: '1.3em' }}>
        <h2 className="text-2xl font-extrabold mb-4 text-gray-900 dark:text-white">Open in Warpcast</h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          Please open this link from Warpcast app for the best experience.
        </p>
        <div className="flex flex-col gap-4">
          <a 
            href="https://apps.apple.com/us/app/warpcast/id1600555445" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Get Warpcast
          </a>
        </div>
      </div>
    </div>
  );
};

export default function AutoAuthFrame() {  
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isFrameAdded, setIsFrameAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<FrameNotificationDetails | null>(null);
  const [sdkContext, setSdkContext] = useState<FrameSDKContext | null>(null);
  const [isInFarcaster, setIsInFarcaster] = useState<boolean | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const { setFid, setUsername } = useAnalytics();

  // Load SDK context
  useEffect(() => {
    const loadSdkContext = async () => {
      try {
        if (sdk) {
          const context = await sdk.context;
          setSdkContext(context);
          
          // Check if we're in Farcaster by looking for user.fid
          const isFarcaster = !!context?.user?.fid;
          setIsInFarcaster(isFarcaster);
          
          // Set the FID and username in the analytics context if available
          if (context?.user?.fid) {
            setFid(context.user.fid);
            
            // Also set the username if available
            if (context.user.username) {
              setUsername(context.user.username);
              console.log('Farcaster username set:', context.user.username);
            } else {
              console.log('Farcaster username not available');
            }
          }
          
          // Show popup if not in Farcaster after a short delay
          if (!isFarcaster) {
            setTimeout(() => setShowPopup(true), 1000);
          } 
        }
      } catch (error) {
        // If there's an error loading the SDK context, we're likely not in Farcaster
        setIsInFarcaster(false);
        setTimeout(() => setShowPopup(true), 1000);
      }
    };
    
    loadSdkContext();
  }, [setFid, setUsername]);

  // Automatically add the frame to the client
  const autoAddFrame = useCallback(async () => {
    if (!isFrameAdded && sdkContext?.user?.fid) {
      try {
        const result = await sdk.actions.addFrame();
        setIsFrameAdded(true);
        
        // If notifications are enabled, store the details
        if (result.notificationDetails) {
          setNotificationDetails(result.notificationDetails);
          
          // Store the notification details for this user
          if (sdkContext.user.fid) {
            await setUserNotificationDetails(
              sdkContext.user.fid,
              result.notificationDetails
            );
          }
        }
      } catch (error) {
        console.error("Failed to add frame:", error);
      }
    }
  }, [isFrameAdded, sdkContext]);

  // Initialize SDK and set up event listeners
  useEffect(() => {
    const initialize = async () => {
      try {
        const context = await sdk.context;
        setIsFrameAdded(context.client.added);
        setNotificationDetails(context.client.notificationDetails ?? null);
        
        // Set up event listeners
        sdk.on("frameAdded", ({ notificationDetails }) => {
          setIsFrameAdded(true);
          if (notificationDetails) {
            setNotificationDetails(notificationDetails);
            
            // Store the notification details if we have a user FID
            if (sdkContext?.user?.fid) {
              setUserNotificationDetails(
                sdkContext.user.fid,
                notificationDetails
              );
            }
          }
        });
        
        sdk.on("frameRemoved", () => {
          setIsFrameAdded(false);
          setNotificationDetails(null);
        });
        
        sdk.on("notificationsEnabled", ({ notificationDetails }) => {
          setNotificationDetails(notificationDetails);
          
          // Store the notification details if we have a user FID
          if (sdkContext?.user?.fid) {
            setUserNotificationDetails(
              sdkContext.user.fid,
              notificationDetails
            );
          }
        });
        
        sdk.on("notificationsDisabled", () => {
          setNotificationDetails(null);
        });
        
        // Tell the SDK we're ready
        sdk.actions.ready({disableNativeGestures: true});
      } catch (error) {
        console.error("SDK initialization error:", error);
      }
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      initialize();
      
      // Cleanup listeners when component unmounts
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, sdkContext]);

  // Try to add the frame if not added
  useEffect(() => {
    if (sdkContext?.user?.fid && !isFrameAdded) {
      autoAddFrame();
    }
  }, [sdkContext, isFrameAdded, autoAddFrame, setFid]);

  // Render the popup if we're not in Farcaster and showPopup is true
  return showPopup && !isInFarcaster ? <FarcasterRequiredPopup /> : null;
} 