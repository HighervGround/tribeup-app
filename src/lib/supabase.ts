import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables - these will need to be set in your .env file
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY?.trim();

// Environment variables loaded successfully - FORCE DEPLOYMENT v3 - ALL FIXES INCLUDED
console.log('🚀 App starting with environment variables:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
  supabaseKey: supabaseAnonKey ? 'SET' : 'NOT SET'
});
    console.log('🔧 All fixes deployed: table name, CreateGame step 3, location search, environment variables, JOIN/LEAVE FIXED, FIRST-CLASS ARCHITECTURE DEPLOYED');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
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
      flowType: 'implicit', // Use implicit flow for OAuth compatibility
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

export const supabase = globalThis.__supabase__ || createSupabaseClient();
// Cache the client on the globalThis to avoid duplicates across HMR boundaries
if (typeof globalThis !== 'undefined') {
  globalThis.__supabase__ = supabase;
}

// Re-export the generated database types
export type { Database } from './database.types';

// Helper functions for data transformation
export const transformGameFromDB = (dbGame: any, isJoined: boolean = false): any => ({
  id: dbGame.id,
  title: dbGame.title,
  sport: dbGame.sport,
  date: dbGame.date,
  time: dbGame.time,
  duration: dbGame.duration || 60, // Default to 60 minutes if not set
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
  createdBy: dbGame.creator?.full_name || dbGame.creator?.username || `User ${dbGame.creator_id?.slice(0, 8) || 'Unknown'}`,
  creatorId: dbGame.creator_id,
  creatorData: dbGame.creator ? {
    id: dbGame.creator.id,
    name: dbGame.creator.full_name || dbGame.creator.username || dbGame.creator.email?.split('@')[0] || `User ${dbGame.creator.id.slice(0, 8)}`,
    avatar: dbGame.creator.avatar_url || ''
  } : {
    id: dbGame.creator_id,
    name: `User ${dbGame.creator_id?.slice(0, 8) || 'Unknown'}`,
    avatar: ''
  },
  createdAt: dbGame.created_at,
});

export const transformUserFromDB = (dbUser: Database['public']['Tables']['users']['Row']): any => ({
  id: dbUser.id,
  name: dbUser.full_name || dbUser.username || dbUser.email?.split('@')[0] || `User ${dbUser.id.slice(0, 8)}`,
  username: dbUser.username || dbUser.email?.split('@')[0] || `user_${dbUser.id.slice(0, 8)}`,
  email: dbUser.email,
  avatar: dbUser.avatar_url || '',
  bio: dbUser.bio || '',
  location: dbUser.location || '',
  role: dbUser.role || 'user',
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
