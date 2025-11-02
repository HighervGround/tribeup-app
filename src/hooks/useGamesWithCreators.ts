import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Helper function to get sport colors
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

export interface GameWithCreator {
  id: string;
  title: string;
  sport: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  latitude?: number;
  longitude?: number;
  cost: string;
  maxPlayers: number;
  currentPlayers: number;
  publicRsvpCount?: number;
  totalPlayers?: number;
  availableSpots?: number;
  description: string;
  imageUrl?: string;
  sportColor: string;
  isJoined: boolean;
  createdBy: string;
  creatorId: string;
  creatorData: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

export function useGamesWithCreators() {
  const [games, setGames] = useState<GameWithCreator[]>([]);
  const [userById, setUserById] = useState(new Map<string, UserProfile>());
  const [loading, setLoading] = useState(true);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (inFlight.current) return;
    inFlight.current = true;

    (async () => {
      try {
        console.log('🚀 Starting race-safe games + creators fetch...');
        
        // Step 1: Fetch games with minimal fields + participation data
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        const { data: gamesData, error: gamesErr } = await supabase
          .from('games_with_counts')
          .select(`
            id, title, sport, date, time, duration, location, latitude, longitude,
            cost, max_players, description, image_url, creator_id, created_at,
            total_players, available_spots
          `)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);

        if (gamesErr) throw gamesErr;

        console.log(`📊 Step 1: Fetched ${gamesData?.length || 0} games`);
        setGames(gamesData ?? []);

        // Step 2: Get participants for these games (fetch separately since view can't do nested selects)
        const gameIds = (gamesData ?? []).map(g => g.id);
        console.log(`🔍 Step 2a: Fetching participants for ${gameIds.length} games`);
        
        // Fetch ALL participants (for creator list) and current user's participation (for isJoined)
        const { data: allParticipants, error: participantsErr } = await supabase
          .from('game_participants')
          .select('game_id, user_id')
          .in('game_id', gameIds)
          .eq('status', 'joined');

        if (participantsErr) {
          console.warn('⚠️ Participants fetch failed, continuing with creators only:', participantsErr);
        }

        // Step 2b: Build union of creator and participant ids
        const creatorIds = new Set((gamesData ?? []).map(g => g.creator_id).filter(id => id && id !== 'null'));
        const participantIds = new Set((allParticipants ?? []).map(p => p.user_id).filter(id => id && id !== 'null'));
        const userIds = Array.from(new Set([...creatorIds, ...participantIds]));

        console.log(`🔍 Step 2b: Found ${creatorIds.size} creators, ${participantIds.size} participants, ${userIds.length} total unique users`);
        console.log('🔍 Expected user IDs:', userIds);

        if (userIds.length === 0) {
          // No users to fetch; render games with generic fallback if needed
          setUserById(new Map());
          return;
        }

        // Step 3: Fetch users by ids (batched IN query for ALL users)
        console.log(`🔍 Step 3: Querying users with IDs:`, userIds);
        const { data: usersData, error: usersErr } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        if (usersErr) {
          console.error('❌ Users query failed:', usersErr);
          throw usersErr;
        }

        console.log(`✅ Step 3: Expected ${userIds.length} users, got ${usersData?.length || 0} users`);
        console.log('✅ Sample user data:', usersData?.[0]);
        
        if (userIds.length > (usersData?.length || 0)) {
          console.warn('🚨 SMOKING GUN: Expected more users than returned - likely RLS policy issue!');
          console.warn('🚨 Missing user IDs:', userIds.filter(id => !usersData?.find(u => u.id === id)));
        }

        // Step 4: Build user map for O(1) lookup
        const finalUserMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));
        setUserById(finalUserMap);
        setUsersLoaded(true);

        // Build participant map for isJoined checks (only current user's games)
        const joinedGameIds = new Set<string>();
        if (userId) {
          (allParticipants ?? []).forEach((p: any) => {
            if (p.user_id === userId) {
              joinedGameIds.add(p.game_id);
            }
          });
        }

        // Transform games with proper user mapping and defensive fallbacks
        const transformedGames = (gamesData ?? []).map(game => {
          const user = finalUserMap.get(game.creator_id) as UserProfile | undefined;
          const isJoined = joinedGameIds.has(game.id);
          
          // Defensive fallback for creator display - following your exact pattern
          let createdBy: string;
          let creatorData: { id: string; name: string; avatar: string };

          if (!finalUserMap || finalUserMap.size === 0) {
            // Users not loaded yet
            createdBy = 'Loading user...';
            creatorData = {
              id: game.creator_id,
              name: 'Loading user...',
              avatar: ''
            };
          } else if (user) {
            // We have creator data loaded
            createdBy = user.full_name || user.username || `User ${user.id.slice(0, 8)}`;
            creatorData = {
              id: user.id,
              name: createdBy,
              avatar: user.avatar_url || ''
            };
          } else {
            // User confirmed missing from our map after loading
            createdBy = `Unknown User (${game.creator_id.slice(0, 8)})`;
            creatorData = {
              id: game.creator_id,
              name: createdBy,
              avatar: ''
            };
          }

          return {
            id: game.id,
            title: game.title,
            sport: game.sport,
            date: game.date,
            time: game.time,
            duration: game.duration || 60,
            location: game.location,
            latitude: game.latitude,
            longitude: game.longitude,
            cost: game.cost,
            maxPlayers: Number(game.max_players ?? 0),
            totalPlayers: Number(game.total_players ?? 0),
            availableSpots: Number(game.available_spots ?? 0),
            description: game.description,
            imageUrl: game.image_url || '',
            sportColor: getSportColor(game.sport),
            isJoined,
            createdBy,
            creatorId: game.creator_id,
            creatorData,
            createdAt: game.created_at,
          };
        });

        setGames(transformedGames);
        
      } catch (err) {
        console.error('❌ useGamesWithCreators error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load games'));
      } finally {
        setLoading(false);
        inFlight.current = false;
      }
    })();
  }, []);

  const refetch = () => {
    if (inFlight.current) return;
    setLoading(true);
    setError(null);
    inFlight.current = false; // Reset to allow refetch
    // Trigger useEffect by changing a dependency (we'll use a counter)
  };

  return { games, userById, usersLoaded, loading, error, refetch };
}
