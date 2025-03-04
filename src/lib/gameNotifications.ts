/**
 * Utility functions for sending game notifications to users
 */

import { useSession } from "next-auth/react";
import { useCallback } from "react";

/**
 * Hook for sending game notifications to the current user
 * @returns A function that can be called to send notifications
 */
export function useSendGameNotification() {
  const session = useSession();
  
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
    // If user isn't authenticated, we can't send a notification
    if (session.status !== "authenticated" || !session.data?.user?.fid) {
      return { 
        success: false, 
        error: "User not authenticated" 
      };
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: session.data.user.fid,
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
  }, [session]);

  return sendNotification;
} 