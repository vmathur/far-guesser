import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";
import { getUserNotificationDetails } from "~/lib/kv";

const appUrl = process.env.NEXT_PUBLIC_URL || "";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendFrameNotification({
  fid,
  title,
  body,
}: {
  fid: number;
  title: string;
  body: string;
}): Promise<SendFrameNotificationResult> {
  const notificationDetails = await getUserNotificationDetails(fid);
  if (!notificationDetails) {
    return { state: "no_token" };
  }

  const response = await fetch(notificationDetails.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title,
      body,
      targetUrl: appUrl,
      tokens: [notificationDetails.token],
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      // Malformed response
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.rateLimitedTokens.length) {
      // Rate limited
      return { state: "rate_limit" };
    }

    return { state: "success" };
  } else {
    // Error response
    return { state: "error", error: responseJson };
  }
}

/**
 * Sends a notification to all users who have subscribed
 * @param title The notification title
 * @param body The notification body
 * @returns Array of results from notification attempts
 */
export async function sendNotificationToAllSubscribers(
  title: string,
  body: string
): Promise<{
  totalUsers: number,
  successCount: number,
  failedCount: number,
  rateLimitedCount: number,
  noTokenCount: number
}> {
  try {
    // Import dynamically to avoid circular dependencies
    const { getAllSubscribedUserFids } = await import('~/lib/kv');
    
    // Get all subscribed user FIDs
    const userFids = await getAllSubscribedUserFids();
    console.log(`Found ${userFids.length} subscribed users`);
    
    // Track results
    let successCount = 0;
    let failedCount = 0;
    let rateLimitedCount = 0;
    let noTokenCount = 0;
    
    // If no users found, return early
    if (userFids.length === 0) {
      return {
        totalUsers: 0,
        successCount,
        failedCount,
        rateLimitedCount,
        noTokenCount
      };
    }
    
    // Send notification to each user
    await Promise.all(
      userFids.map(async (fid) => {
        try {
          const result = await sendFrameNotification({
            fid,
            title,
            body,
          });
          
          // Track result
          switch (result.state) {
            case "success":
              successCount++;
              break;
            case "error":
              failedCount++;
              break;
            case "rate_limit":
              rateLimitedCount++;
              break;
            case "no_token":
              noTokenCount++;
              break;
          }
        } catch (error) {
          console.error(`Error sending notification to user ${fid}:`, error);
          failedCount++;
        }
      })
    );
    
    return {
      totalUsers: userFids.length,
      successCount,
      failedCount,
      rateLimitedCount,
      noTokenCount
    };
  } catch (error) {
    console.error('Error in sendNotificationToAllSubscribers:', error);
    throw error; // Re-throw to allow caller to handle
  }
}
