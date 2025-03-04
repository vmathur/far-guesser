"use client";

import { useCallback, useEffect, useState } from 'react';
import sdk, { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { getCsrfToken, signIn, useSession } from "next-auth/react";
import { setUserNotificationDetails } from "~/lib/kv";

export default function AutoAuthFrame() {
  const { data: session, status } = useSession();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isFrameAdded, setIsFrameAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<FrameNotificationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

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

  // Automatically sign in the user
  const autoSignIn = useCallback(async () => {
    if (status === "authenticated" || isAuthInProgress) return;
    
    try {
      setIsAuthInProgress(true);
      setError(null);
      
      const nonce = await getNonce();
      if (!nonce) return;
      
      // Trigger Farcaster sign-in
      const result = await sdk.actions.signIn({ nonce });
      
      // Send the signed message to our auth backend
      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e: any) {
      if (e?.message?.includes("rejected")) {
        setError("Sign-in was rejected");
      } else {
        setError("Failed to sign in");
        console.error("Sign-in error:", e);
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
      setIsSDKLoaded(true);
      initialize();
      
      // Cleanup listeners when component unmounts
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, autoSignIn, status, session]);

  // Try to add the frame when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && !isFrameAdded) {
      autoAddFrame();
    }
  }, [status, isFrameAdded, autoAddFrame]);

  // This component doesn't render anything visible
  return null;
} 