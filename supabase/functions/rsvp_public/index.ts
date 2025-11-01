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
    const { game_id, name, email, phone, message } = body || {};

    if (!game_id || !name || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Normalize inputs
    const normEmail = String(email).trim().toLowerCase();
    const normName = String(name).trim();
    const normPhone = phone ? String(phone).trim().replace(/\D/g, '') : null;
    const normMessage = message ? String(message).trim() : null;

    // Fetch current stats from view
    const { data: stats, error: statsErr } = await supabase
      .from("game_rsvp_stats")
      .select("*")
      .eq("game_id", game_id)
      .maybeSingle();
    if (statsErr || !stats) {
      return new Response(JSON.stringify({ error: "Game not found" }), { status: 404 });
    }

    const capacityRemaining = Number(stats.capacity_remaining || 0);
    const canAccept = capacityRemaining > 0;

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
      game_id: game_id,
      name: normName,
      email: normEmail,
      phone: normPhone,
      message: normMessage,
      attending: canAccept,
      ip_hash: ipHashHex,
    });
    
    // Handle duplicate (23505 = unique_violation)
    if (insertErr) {
      if (insertErr.code === '23505' || insertErr.message?.includes('unique') || insertErr.message?.includes('duplicate')) {
        // Refetch stats for duplicate case
        const { data: dupStats } = await supabase
          .from("game_rsvp_stats")
          .select("*")
          .eq("game_id", game_id)
          .maybeSingle();
        return new Response(
          JSON.stringify({ ok: true, duplicate: true, stats: dupStats || stats }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 });
    }

    // Refetch stats after successful insert
    const { data: newStats } = await supabase
      .from("game_rsvp_stats")
      .select("*")
      .eq("game_id", game_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        ok: true,
        duplicate: false,
        stats: newStats || stats,
      }),
      { status: 200 },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500 });
  }
});


