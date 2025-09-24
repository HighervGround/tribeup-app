import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useGameRealtime(gameId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!gameId) return;

    console.log('🔗 WebSocket realtime disabled due to RLS restrictions, using polling fallback');
    
    // Skip WebSocket entirely and use polling
    // This avoids the WebSocket connection errors
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for game updates:', gameId);
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    }, 15000); // Poll every 15 seconds
    
    channelRef.current = { 
      _pollInterval: pollInterval,
      state: 'joined' // Fake state for compatibility
    };

    return () => {
      console.log('🔌 Unsubscribing from game polling:', gameId);
      if (channelRef.current) {
        clearInterval(channelRef.current._pollInterval);
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
