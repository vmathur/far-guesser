"use client";

import { useCallback, useEffect, useState } from 'react';
import sdk, { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { getCsrfToken, signIn, useSession } from "next-auth/react";
import { setUserNotificationDetails } from "~/lib/kv";

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

// Create a custom event to broadcast session and SDK context changes
export const broadcastSessionUpdate = (sessionData: any, sdkContext?: FrameSDKContext) => {
  if (typeof window !== 'undefined') {
    console.log('Broadcasting session update:', sessionData, 'SDK Context:', sdkContext);
    // Create a custom event with the session data and SDK context
    const event = new CustomEvent('farGuesserSessionUpdate', { 
      detail: {
        session: sessionData,
        status: sessionData?.status,
        sdkContext: sdkContext
      }
    });
    window.dispatchEvent(event);
  }
};

export default function AutoAuthFrame() {
  console.log('AutoAuthFrame rendering');
  
  const { data: session, status } = useSession();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isFrameAdded, setIsFrameAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<FrameNotificationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  const [sdkContext, setSdkContext] = useState<FrameSDKContext | null>(null);

  // Load SDK context
  useEffect(() => {
    console.log('Running SDK context loading effect');
    
    const loadSdkContext = async () => {
      try {
        console.log('Inside loadSdkContext function');
        if (sdk) {
          console.log('SDK is available, requesting context');
          const context = await sdk.context;
          console.log('SDK Context loaded successfully:', context);
          setSdkContext(context);
          // Broadcast the context even before auth is complete
          broadcastSessionUpdate({ status }, context);
        }
      } catch (error) {
        console.error('Error loading SDK context:', error);
      }
    };
    
    loadSdkContext();
  }, []);

  // Broadcast session updates whenever the session changes or SDK context is available
  useEffect(() => {
    if (status !== 'loading') {
      broadcastSessionUpdate({ session, status }, sdkContext);
    }
  }, [session, status, sdkContext]);

  // Function to get CSRF token for authentication
  const getNonce = useCallback(async () => {
    try {
      const nonce = await getCsrfToken();
      if (!nonce) throw new Error("Unable to generate nonce");
      return nonce;
    } catch (error) {
      setError("Failed to generate nonce for authentication");
      console.error("Nonce generation error:", error);
      return null;
    }
  }, []);

  // Automatic sign-in function
  const autoSignIn = useCallback(async () => {
    console.log('autoSignIn called, current status:', status, 'isAuthInProgress:', isAuthInProgress);
    
    if (status === "authenticated" || isAuthInProgress) {
      console.log('Already authenticated or auth in progress, skipping autoSignIn');
      return;
    }
    
    try {
      console.log('Starting authentication process');
      setIsAuthInProgress(true);
      setError(null);
      
      const nonce = await getNonce();
      if (!nonce) {
        console.log('No nonce available, aborting autoSignIn');
        return;
      }
      
      console.log('Got nonce, triggering SDK signIn action');
      // Trigger Farcaster sign-in
      const result = await sdk.actions.signIn({ nonce });
      console.log('SDK signIn result:', result);
      
      // Send the signed message to our auth backend
      console.log('Sending credentials to NextAuth');
      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
      console.log('NextAuth signIn completed');
    } catch (e: any) {
      console.error('Error in autoSignIn:', e);
      if (e?.message?.includes("rejected")) {
        setError("Sign-in was rejected");
      } else {
        setError("Failed to sign in");
      }
    } finally {
      setIsAuthInProgress(false);
    }
  }, [getNonce, status, isAuthInProgress]);

  // Automatically add the frame to the client
  const autoAddFrame = useCallback(async () => {
    if (!isFrameAdded && session) {
      try {
        const result = await sdk.actions.addFrame();
        setIsFrameAdded(true);
        
        // If notifications are enabled, store the details
        if (result.notificationDetails) {
          setNotificationDetails(result.notificationDetails);
          
          // Store the notification details for this user
          if (session.user?.fid) {
            await setUserNotificationDetails(
              session.user.fid,
              result.notificationDetails
            );
          }
        }
      } catch (error) {
        console.error("Failed to add frame:", error);
      }
    }
  }, [isFrameAdded, session]);

  // Initialize SDK and set up event listeners
  useEffect(() => {
    console.log('Running SDK initialization effect, isSDKLoaded:', isSDKLoaded);
    
    const initialize = async () => {
      console.log('Starting SDK initialization');
      try {
        console.log('Requesting SDK context');
        const context = await sdk.context;
        console.log('SDK context received:', context);
        
        setIsFrameAdded(context.client.added);
        setNotificationDetails(context.client.notificationDetails ?? null);
        
        console.log('Setting up SDK event listeners');
        // Set up event listeners
        sdk.on("frameAdded", ({ notificationDetails }) => {
          console.log('Frame added event received');
          setIsFrameAdded(true);
          if (notificationDetails) {
            setNotificationDetails(notificationDetails);
            
            // Store the notification details if we have a session
            if (session?.user?.fid) {
              setUserNotificationDetails(
                session.user.fid,
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
          
          // Store the notification details if we have a session
          if (session?.user?.fid) {
            setUserNotificationDetails(
              session.user.fid,
              notificationDetails
            );
          }
        });
        
        sdk.on("notificationsDisabled", () => {
          setNotificationDetails(null);
        });
        
        console.log('Calling sdk.actions.ready()');
        // Tell the SDK we're ready
        sdk.actions.ready({});
        
        // Auto sign in after initialization
        if (status !== "authenticated") {
          await autoSignIn();
        }
      } catch (error) {
        console.error("SDK initialization error:", error);
      }
    };

    if (sdk && !isSDKLoaded) {
      console.log('SDK available and not yet loaded, starting initialization');
      setIsSDKLoaded(true);
      initialize();
      
      // Cleanup listeners when component unmounts
      return () => {
        console.log('Cleaning up SDK event listeners');
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, autoSignIn, status, session]);

  // Try to add the frame if not added
  useEffect(() => {
    // if (!isFrameAdded) {
    //   autoAddFrame();
    // }
    if (status === "authenticated" && !isFrameAdded) {
      autoAddFrame();
    }
  }, [status, isFrameAdded, autoAddFrame]);

  // For debugging, log when the component mounts and unmounts
  useEffect(() => {
    console.log('AutoAuthFrame mounted');
    return () => {
      console.log('AutoAuthFrame unmounted');
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 