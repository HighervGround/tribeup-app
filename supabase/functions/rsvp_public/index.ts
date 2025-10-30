// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing server env" }), { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
    const body = await req.json();
    const { gameId, name, email, phone, message } = body || {};

    if (!gameId || !name || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Normalize inputs
    const normEmail = String(email).trim().toLowerCase();
    const normName = String(name).trim();
    const normPhone = phone ? String(phone).trim() : null;
    const normMessage = message ? String(message).trim() : null;

    // Fetch game and capacity
    const { data: game, error: gameErr } = await supabase
      .from("games")
      .select("id, max_players")
      .eq("id", gameId)
      .maybeSingle();
    if (gameErr || !game) {
      return new Response(JSON.stringify({ error: "Game not found" }), { status: 404 });
    }

    // Private confirmed participants
    const { data: privateParts } = await supabase
      .from("game_participants")
      .select("user_id,status")
      .eq("game_id", gameId);
    const privateConfirmed = (privateParts || []).filter((p: any) => !("status" in p) || p.status === "joined").length;

    // Public RSVPs confirmed
    const { data: publicCountRow } = await supabase
      .from("game_public_rsvp_count")
      .select("public_count")
      .eq("game_id", gameId)
      .maybeSingle();
    const publicCount = Number(publicCountRow?.public_count || 0);

    const capacity = Number(game.max_players || 0);
    const remaining = Math.max(0, capacity - privateConfirmed);

    // Enforce unique email per game
    const { data: existing } = await supabase
      .from("public_rsvps")
      .select("id")
      .eq("game_id", gameId)
      .eq("email", normEmail)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ success: true, duplicate: true, snapshot: { capacity, privateConfirmed, publicCount, remaining } }), { status: 200 });
    }

    // Decide status: attending stays true but we gate by remaining
    const canAccept = remaining > publicCount;

    // Simple IP hash (not reversible) for rate limiting diagnostics
    const ipHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const ipHashHex = Array.from(new Uint8Array(ipHash)).map((b) => b.toString(16).padStart(2, "0")).join("");

    // Optional: rudimentary rate limit (5 per hour per email/ip)
    const { data: recent } = await supabase
      .from("public_rsvps")
      .select("id, created_at")
      .eq("email", normEmail)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((recent || []).length >= 5) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
    }

    // Insert RSVP (attending true always; UI can treat over-capacity as waitlist)
    const { error: insertErr } = await supabase.from("public_rsvps").insert({
      game_id: gameId,
      name: normName,
      email: normEmail,
      phone: normPhone,
      message: normMessage,
      attending: canAccept,
      ip_hash: ipHashHex,
    });
    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 });
    }

    // Recompute public count after insert
    const { data: newCountRow } = await supabase
      .from("game_public_rsvp_count")
      .select("public_count")
      .eq("game_id", gameId)
      .maybeSingle();
    const newPublic = Number(newCountRow?.public_count || 0);

    return new Response(
      JSON.stringify({
        success: true,
        waitlisted: !canAccept,
        snapshot: {
          capacity,
          privateConfirmed,
          publicCount: newPublic,
          remaining: Math.max(0, capacity - privateConfirmed - newPublic),
        },
      }),
      { status: 200 },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500 });
  }
});


