// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function for sending web push notifications
// Requires VAPID keys to be set in Supabase secrets:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (usually mailto:your-email@example.com)

import { createClient } from "npm:@supabase/supabase-js@2.45.3";

// VAPID keys for web push authentication
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@tribeup.fit";

// Supabase configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Notification types
type NotificationType = 
  | "game_reminder"
  | "new_message"
  | "join_request"
  | "game_update"
  | "game_cancelled"
  | "player_joined"
  | "player_left"
  | "weather_alert"
  | "test";

interface PushNotificationPayload {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Base64 URL encoding utilities
function base64UrlEncode(input: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...input));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const decoded = atob(base64 + padding);
  return new Uint8Array([...decoded].map((c) => c.charCodeAt(0)));
}

// Generate VAPID JWT for push authentication
async function generateVapidJwt(audience: string): Promise<string> {
  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    throw new Error("VAPID keys not configured");
  }

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: VAPID_SUBJECT,
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const privateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// Send push notification to a single subscription
async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: Record<string, any>
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Generate VAPID authorization
    const vapidJwt = await generateVapidJwt(audience);
    const vapidAuth = `vapid t=${vapidJwt}, k=${VAPID_PUBLIC_KEY}`;

    // Encrypt the payload (simplified - in production, use proper encryption)
    const payloadString = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(payloadString);

    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidAuth,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "86400", // 24 hours
        Urgency: "normal",
      },
      body: payloadBytes,
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    } else if (response.status === 404 || response.status === 410) {
      // Subscription expired or invalid
      return { 
        success: false, 
        error: "Subscription expired", 
        statusCode: response.status 
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Push failed: ${response.status} - ${errorText}`,
        statusCode: response.status 
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Validate VAPID configuration
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured. Please set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: PushNotificationPayload = await req.json();
    const { userId, userIds, title, body: notificationBody, type, data, icon, badge, tag, requireInteraction, actions } = body;

    if (!title || !notificationBody || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, body, type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId && (!userIds || userIds.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Must provide userId or userIds" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Get target user IDs
    const targetUserIds = userId ? [userId] : userIds!;

    // Fetch push subscriptions for the users
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, subscription, endpoint")
      .in("user_id", targetUserIds);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found for the specified users", sent: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare notification payload
    const notificationPayload = {
      title,
      body: notificationBody,
      icon: icon || "/icon-192x192.png",
      badge: badge || "/badge-72x72.png",
      tag: tag || `tribeup-${type}`,
      requireInteraction: requireInteraction || false,
      data: {
        type,
        url: getNotificationUrl(type, data),
        ...data,
      },
      actions: actions || getDefaultActions(type),
    };

    // Send notifications
    const results = await Promise.all(
      subscriptions.map(async (sub: any) => {
        const subscriptionData = sub.subscription as PushSubscriptionData;
        const result = await sendPushNotification(subscriptionData, notificationPayload);
        
        // If subscription is expired, remove it from the database
        if (!result.success && (result.statusCode === 404 || result.statusCode === 410)) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`Removed expired subscription: ${sub.id}`);
        }
        
        return { 
          subscriptionId: sub.id, 
          userId: sub.user_id, 
          ...result 
        };
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Push notifications sent`,
        sent: successful,
        failed,
        details: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to get notification URL based on type
function getNotificationUrl(type: NotificationType, data?: Record<string, any>): string {
  switch (type) {
    case "game_reminder":
    case "game_update":
    case "game_cancelled":
    case "player_joined":
    case "player_left":
    case "weather_alert":
      return data?.gameId ? `/app/game/${data.gameId}` : "/app";
    case "new_message":
      return data?.gameId ? `/app/game/${data.gameId}/chat` : "/app";
    case "join_request":
      return data?.gameId ? `/app/game/${data.gameId}` : "/app";
    case "test":
      return "/app";
    default:
      return "/app";
  }
}

// Helper function to get default actions based on notification type
function getDefaultActions(type: NotificationType): Array<{ action: string; title: string }> {
  switch (type) {
    case "game_reminder":
      return [
        { action: "view", title: "View Game" },
        { action: "dismiss", title: "Dismiss" },
      ];
    case "new_message":
      return [
        { action: "reply", title: "Reply" },
        { action: "view", title: "View" },
      ];
    case "join_request":
      return [
        { action: "approve", title: "Approve" },
        { action: "view", title: "View" },
      ];
    case "game_update":
    case "player_joined":
    case "player_left":
    case "weather_alert":
      return [
        { action: "view", title: "View Game" },
      ];
    default:
      return [];
  }
}
