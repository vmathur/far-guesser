import { notificationDetailsSchema } from "@farcaster/frame-sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getUserNotificationDetails, setUserNotificationDetails } from "~/lib/kv";
import { sendFrameNotification } from "~/lib/notifs";

// Schema for requests with notification details included
const fullRequestSchema = z.object({
  fid: z.number(),
  notificationDetails: notificationDetailsSchema,
  title: z.string().optional(),
  body: z.string().optional(),
});

// Schema for requests without notification details (will be fetched from KV)
const simpleRequestSchema = z.object({
  fid: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  
  // First try to parse with the full schema
  const fullRequestBody = fullRequestSchema.safeParse(requestJson);

  if (fullRequestBody.success) {
    // Store the notification details in KV storage (refresh/update them)
    await setUserNotificationDetails(
      fullRequestBody.data.fid,
      fullRequestBody.data.notificationDetails
    );

    // Send notification with the provided details
    const sendResult = await sendFrameNotification({
      fid: fullRequestBody.data.fid,
      title: fullRequestBody.data.title || "Game Notification",
      body: fullRequestBody.data.body || "You have a new notification from FarGuesser",
    });

    if (sendResult.state === "error") {
      return Response.json(
        { success: false, error: sendResult.error },
        { status: 500 }
      );
    } else if (sendResult.state === "rate_limit") {
      return Response.json(
        { success: false, error: "Rate limited" },
        { status: 429 }
      );
    }

    return Response.json({ success: true });
  }
  
  // If that fails, try to parse with the simple schema
  const simpleRequestBody = simpleRequestSchema.safeParse(requestJson);
  
  if (simpleRequestBody.success) {
    // Get notification details from KV storage
    const notificationDetails = await getUserNotificationDetails(
      simpleRequestBody.data.fid
    );
    
    // If no notification details found, return error
    if (!notificationDetails) {
      return Response.json(
        { success: false, error: "No notification details found for this user" },
        { status: 404 }
      );
    }
    
    // Send notification with the retrieved details
    const sendResult = await sendFrameNotification({
      fid: simpleRequestBody.data.fid,
      title: simpleRequestBody.data.title || "Game Notification",
      body: simpleRequestBody.data.body || "You have a new notification from FarGuesser",
    });

    if (sendResult.state === "error") {
      return Response.json(
        { success: false, error: sendResult.error },
        { status: 500 }
      );
    } else if (sendResult.state === "rate_limit") {
      return Response.json(
        { success: false, error: "Rate limited" },
        { status: 429 }
      );
    }

    return Response.json({ success: true });
  }
  
  // If both schemas fail, return error
  return Response.json(
    { success: false, errors: "Invalid request format" },
    { status: 400 }
  );
}
