import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from './envUtils';

// Environment variables - these will need to be set in your .env file
const supabaseUrl = env.SUPABASE_URL?.trim();
const supabaseAnonKey = env.SUPABASE_ANON_KEY?.trim();

// Environment variables loaded successfully - FORCE DEPLOYMENT v3 - ALL FIXES INCLUDED
console.log('🚀 App starting with environment variables:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
  supabaseKey: supabaseAnonKey ? 'SET' : 'NOT SET'
});
    console.log('🔧 All fixes deployed: table name, CreateGame step 3, location search, environment variables, JOIN/LEAVE FIXED, FIRST-CLASS ARCHITECTURE DEPLOYED');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY with appropriate prefixes (VITE_, PUBLIC_, or NEXT_PUBLIC_) in your .env file.');
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY with appropriate prefixes in your .env file.');
}

// HMR-safe singleton in dev to prevent multiple clients/listeners
declare global {
  // eslint-disable-next-line no-var
  var __supabase__: any | undefined;
}

const createSupabaseClient = () => {
  console.log('🔧 Creating new Supabase client...');
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Keep sessions persistent for good UX
      autoRefreshToken: true, // Re-enable auto refresh
      detectSessionInUrl: true,
      storageKey: 'tribeup-auth',
      flowType: 'pkce', // Use PKCE flow for better security and reliability
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      debug: false, // Set to true for debugging auth issues
      // Note: The Supabase client automatically includes the JWT token from localStorage
      // in the Authorization header for all requests. This ensures RLS policies receive
      // the authenticated user context (auth.uid()).
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'tribeup-web@1.0.0',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: () => Math.random() * 5000,
    },
  });
};

// Use singleton pattern but allow fresh creation if needed
export const supabase = globalThis.__supabase__ || createSupabaseClient();

// Cache the client on the globalThis to avoid duplicates across HMR boundaries
if (typeof globalThis !== 'undefined') {
  globalThis.__supabase__ = supabase;
}

// Expose supabase client to window for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('🔍 [Supabase] Client exposed to window.supabase');
}

// Re-export the generated database types
export type { Database } from './database.types';

// Helper functions for data transformation
export const transformGameFromDB = (dbGame: any, isJoined: boolean = false): any => {
  // Defensive fallback for creator display
  let createdBy = 'Loading user...';
  let creatorData = {
    id: dbGame.creator_id,
    name: 'Loading user...',
    avatar: ''
  };

  if (dbGame.creator) {
    // We have creator data loaded (from user_public_profile view with display_name)
    const displayName = dbGame.creator.display_name || dbGame.creator.username || `User ${dbGame.creator.id.slice(0, 8)}`;
    createdBy = displayName;
    creatorData = {
      id: dbGame.creator.id,
      name: displayName,
      avatar: dbGame.creator.avatar_url || ''
    };
    console.log(`✅ [transformGameFromDB] Creator loaded: ${displayName} (${dbGame.creator.id.slice(0, 8)})`);
  } else if (dbGame.creator === null || dbGame.creator === undefined) {
    // Creator not found in user_public_profile view
    // Use a more user-friendly fallback instead of showing UUID
    createdBy = 'Host';
    creatorData = {
      id: dbGame.creator_id || '',
      name: createdBy,
      avatar: ''
    };
    console.warn(`⚠️ [transformGameFromDB] Creator ${dbGame.creator_id?.slice(0, 8)} not found in user_public_profile view`);
  }
  // If dbGame.creator is undefined, we're still loading - show "Loading user..."

  return {
    id: dbGame.id,
    title: dbGame.title,
    sport: dbGame.sport,
    date: dbGame.date,
    time: dbGame.time,
    duration: (() => {
      const dur = (dbGame as any).duration;
      // Handle null, undefined, or invalid values
      if (dur == null) return 60;
      // Convert string to number if needed
      const num = typeof dur === 'number' ? dur : parseInt(dur, 10);
      // Ensure it's a valid positive number
      return (isNaN(num) || num <= 0) ? 60 : num;
    })(),
    location: dbGame.location,
    latitude: dbGame.latitude,
    longitude: dbGame.longitude,
    cost: dbGame.cost,
    maxPlayers: dbGame.max_players,
    currentPlayers: dbGame.current_players,
    description: dbGame.description,
    imageUrl: dbGame.image_url || '',
    sportColor: getSportColor(dbGame.sport),
    isJoined,
    createdBy,
    creatorId: dbGame.creator_id,
    creatorData,
    createdAt: dbGame.created_at,
    // planned_route is JSONB, so it's already an object - no need to parse
    plannedRoute: (dbGame as any).planned_route || undefined,
  };
  
  // Debug log route transformation
  if ((dbGame as any).planned_route) {
    console.log('🗺️ [transformGameFromDB] Route transformed:', {
      original: (dbGame as any).planned_route,
      transformed: (dbGame as any).planned_route
    });
  }
};

export const transformUserFromDB = (dbUser: Database['public']['Tables']['users']['Row']): any => ({
  id: dbUser.id,
  name: dbUser.full_name || dbUser.username || dbUser.email?.split('@')[0] || `Unknown User (${dbUser.id.slice(0, 8)})`,
  username: dbUser.username || dbUser.email?.split('@')[0] || `user_${dbUser.id.slice(0, 8)}`,
  email: dbUser.email,
  avatar: dbUser.avatar_url || '',
  bio: dbUser.bio || '',
  location: dbUser.location || '',
  role: dbUser.role || 'user',
  onboarding_completed: dbUser.onboarding_completed === true,
  preferences: {
    theme: 'auto' as const,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    colorBlindFriendly: false,
    notifications: {
      push: true,
      email: false,
      gameReminders: true,
    },
    privacy: {
      locationSharing: true,
      profileVisibility: 'public' as const,
    },
    sports: dbUser.preferred_sports || [],
  },
});

// Helper function to get sport colors (matching existing implementation)
const getSportColor = (sport: string): string => {
  const sportColors: Record<string, string> = {
    basketball: '#FA4616', // UF Orange
    soccer: '#22C55E',
    tennis: '#3B82F6',
    pickleball: '#65A30D',
    volleyball: '#8B5CF6',
    football: '#F59E0B',
    baseball: '#EF4444',
    swimming: '#06B6D4',
    running: '#10B981',
    cycling: '#6366F1',
    yoga: '#EC4899',
  };
  return sportColors[sport.toLowerCase()] || '#6B7280';
};
