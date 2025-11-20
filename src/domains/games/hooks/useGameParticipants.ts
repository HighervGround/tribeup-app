import { useEffect, useState } from 'react';
import { supabase } from '@/core/database/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useGameParticipants(gameId: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;

    console.log('🔗 Setting up realtime broadcast subscription for game participants:', gameId);

    // Use the new broadcast channel format: game:{game_id}:participants
    const channel = supabase
      .channel(`game:${gameId}:participants`, {
        config: {
          private: true // Private channel for authorization
        }
      })
      .on('broadcast', { event: 'participant_join' }, (payload) => {
        console.log('👥 Participant joined via broadcast:', payload);
        queryClient.invalidateQueries({ queryKey: ['game', gameId] });
        queryClient.invalidateQueries({ queryKey: ['games'] });
        queryClient.invalidateQueries({ queryKey: ['gameParticipants', gameId] });
      })
      .on('broadcast', { event: 'participant_leave' }, (payload) => {
        console.log('👋 Participant left via broadcast:', payload);
        queryClient.invalidateQueries({ queryKey: ['game', gameId] });
        queryClient.invalidateQueries({ queryKey: ['games'] });
        queryClient.invalidateQueries({ queryKey: ['gameParticipants', gameId] });
      })
      // Also keep postgres_changes as fallback
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('👥 Game participants changed (postgres):', payload);
        queryClient.invalidateQueries({ queryKey: ['game', gameId] });
        queryClient.invalidateQueries({ queryKey: ['games'] });
        queryClient.invalidateQueries({ queryKey: ['gameParticipants', gameId] });
      })
      .subscribe((status) => {
        console.log('📡 Game participants subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔌 Unsubscribing from game participants:', gameId);
      channel.unsubscribe();
      setIsSubscribed(false);
    };
  }, [gameId, queryClient]);

  return { isSubscribed };
}
