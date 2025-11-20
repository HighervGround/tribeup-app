// deno-lint-ignore-file no-explicit-any
// Cached games feed with minimal payload
// Assumptions:
// - Public games are viewable by anon via RLS on public.games (policy in place)
// - We only return fields needed for list cards
// - Adds viewer-specific flags when Authorization header is present
// - Short caching for anon users
import { createClient } from "npm:@supabase/supabase-js@2.45.3";
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
Deno.serve(async (req)=>{
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 50);
    const offset = page * limit;
    const authHeader = req.headers.get('Authorization');
    // Create client; attach JWT if provided to compute user-specific flags
    const client = createClient(supabaseUrl, anonKey, {
      global: {
        headers: authHeader ? {
          Authorization: authHeader
        } : undefined
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    // Base select for games list
    const baseSelect = 'id,title,sport,location,date,time,image_url,going_count,maybe_count,cant_go_count,created_at';
    const { data: games, error } = await client.from('games').select(baseSelect).order('created_at', {
      ascending: false
    }).range(offset, offset + (limit - 1));
    if (error) throw error;
    let items = games;
    // If user is authenticated, annotate liked_by_me and my_rsvp_status in one round-trip
    if (authHeader && items.length > 0) {
      const ids = items.map((g)=>g.id);
      // Fetch likes and rsvps in bulk
      const [{ data: likes, error: likesErr }, { data: rsvps, error: rsvpsErr }] = await Promise.all([
        client.from('activity_likes').select('activity_id').in('activity_id', ids),
        client.from('rsvps').select('game_id,status').in('game_id', ids)
      ]);
      if (likesErr) throw likesErr;
      if (rsvpsErr) throw rsvpsErr;
      const likedSet = new Set((likes || []).map((l)=>l.activity_id));
      const rsvpMap = new Map((rsvps || []).map((r)=>[
          r.game_id,
          r.status
        ]));
      items = items.map((g)=>({
          ...g,
          liked_by_me: likedSet.has(g.id),
          my_rsvp_status: rsvpMap.get(g.id) ?? null
        }));
    }
    // Cache policy: short public cache; allow SWR
    const isAnon = !authHeader;
    const headers = {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    };
    if (isAnon) {
      headers['Cache-Control'] = 'public, max-age=10, stale-while-revalidate=30';
    } else {
      // Authenticated responses are user-specific; avoid shared cache
      headers['Cache-Control'] = 'private, max-age=5';
    }
    return new Response(JSON.stringify({
      page,
      limit,
      count: items.length,
      items
    }), {
      headers
    });
  } catch (e) {
    const headers = {
      'Content-Type': 'application/json'
    };
    return new Response(JSON.stringify({
      error: e?.message ?? 'Unexpected error'
    }), {
      status: 500,
      headers
    });
  }
});
