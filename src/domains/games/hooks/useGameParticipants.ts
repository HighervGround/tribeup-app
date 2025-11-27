import { useEffect, useState } from 'react';
import { supabase } from '@/core/database/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { gameKeys } from './useGames';

export function useGameParticipantsRealtime(gameId: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;

    console.log('🔗 Setting up realtime subscription for game participants:', gameId);

    // Use the new broadcast channel format: game:{game_id}:participants
    const channel = supabase
      .channel(`game:${gameId}:participants`, {
        config: {
          private: true // Private channel for authorization
        }
      })
      .on('broadcast', { event: 'participant_join' }, (payload) => {
        console.log('👥 Participant joined via broadcast:', payload);
        // Invalidate with correct query keys
        queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
        queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      })
      .on('broadcast', { event: 'participant_leave' }, (payload) => {
        console.log('👋 Participant left via broadcast:', payload);
        // Invalidate with correct query keys
        queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
        queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      })
      // Also keep postgres_changes as fallback for direct DB changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('👥 Game participants changed (postgres):', payload);
        // Invalidate with correct query keys
        queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
        queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      })
      .subscribe((status) => {
        console.log('📡 Game participants subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔌 Unsubscribing from game participants:', gameId);
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [gameId, queryClient]);

  return { isSubscribed };
}
