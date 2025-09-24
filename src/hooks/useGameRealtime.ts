import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useGameRealtime(gameId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!gameId) return;

    console.log('🔗 Setting up realtime for game:', gameId);

    try {
      // Create channel for this specific game using proper Supabase client
      const channel = supabase
        .channel(`game-${gameId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `game_id=eq.${gameId}`
        }, (payload) => {
          console.log('👥 Participant update:', payload);
          
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['game', gameId] });
          queryClient.invalidateQueries({ queryKey: ['games'] });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public', 
          table: 'games',
          filter: `id=eq.${gameId}`
        }, (payload) => {
          console.log('🎮 Game update:', payload);
          
          // Invalidate game queries
          queryClient.invalidateQueries({ queryKey: ['game', gameId] });
          queryClient.invalidateQueries({ queryKey: ['games'] });
        })
        .subscribe((status) => {
          console.log('📡 Game realtime status:', status);
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Failed to setup realtime:', error);
    }

    return () => {
      console.log('🔌 Unsubscribing from game realtime:', gameId);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [gameId, queryClient]);

  return {
    isConnected: channelRef.current?.state === 'joined'
  };
}

// Hook for all games realtime updates
export function useAllGamesRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔗 Setting up realtime for all games');

    try {
      const channel = supabase
        .channel('all-games')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'games'
        }, (payload) => {
          console.log('🎮 Games table update:', payload);
          
          // Invalidate all game queries
          queryClient.invalidateQueries({ queryKey: ['games'] });
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_participants'
        }, (payload) => {
          console.log('👥 Participants table update:', payload);
          
          // Invalidate all game queries (affects participant counts)
          queryClient.invalidateQueries({ queryKey: ['games'] });
        })
        .subscribe((status) => {
          console.log('📡 All games realtime status:', status);
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Failed to setup all games realtime:', error);
    }

    return () => {
      console.log('🔌 Unsubscribing from all games realtime');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [queryClient]);

  return {
    isConnected: channelRef.current?.state === 'joined'
  };
}
