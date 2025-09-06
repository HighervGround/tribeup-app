import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables - these will need to be set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// HMR-safe singleton in dev to prevent multiple clients/listeners
declare global {
  // eslint-disable-next-line no-var
  var __supabase__: any | undefined;
}

const createSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'tribeup-auth',
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
        eventsPerSecond: 10,
      },
    },
  });

export const supabase = globalThis.__supabase__ || createSupabaseClient();
// Cache the client on the globalThis to avoid duplicates across HMR boundaries
if (typeof globalThis !== 'undefined') {
  globalThis.__supabase__ = supabase;
}

// Re-export the generated database types
export type { Database } from './database.types';

// Helper functions for data transformation
export const transformGameFromDB = (dbGame: Database['public']['Tables']['games']['Row'], isJoined: boolean = false): any => ({
  id: dbGame.id,
  title: dbGame.title,
  sport: dbGame.sport,
  date: dbGame.date,
  time: dbGame.time,
  location: dbGame.location,
  cost: dbGame.cost,
  maxPlayers: dbGame.max_players,
  currentPlayers: dbGame.current_players,
  description: dbGame.description,
  imageUrl: dbGame.image_url || '',
  sportColor: getSportColor(dbGame.sport),
  isJoined,
  createdBy: dbGame.creator_id,
  createdAt: dbGame.created_at,
});

export const transformUserFromDB = (dbUser: Database['public']['Tables']['users']['Row']): any => ({
  id: dbUser.id,
  name: dbUser.full_name || dbUser.username || 'Unknown User',
  username: dbUser.username || '',
  email: dbUser.email,
  avatar: dbUser.avatar_url || '',
  bio: dbUser.bio || '',
  location: dbUser.location || '',
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
      messages: true,
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
