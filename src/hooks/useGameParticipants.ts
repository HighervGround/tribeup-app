import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useGameParticipants(gameId: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;

    console.log('🔗 Setting up realtime subscription for game participants:', gameId);

    const channel = supabase
      .channel(`game-participants-${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('👥 Game participants changed:', payload);
        
        // Invalidate game queries to refetch participant data
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
