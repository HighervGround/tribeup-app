import React, { useEffect, useRef } from 'react';
import { supabase } from '@/core/database/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useGameRealtime(gameId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Realtime disabled to prevent WebSocket failures
    console.log('🚫 [Realtime] Disabled for game:', gameId);
    return;
    
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
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);
  const [isDisabled, setIsDisabled] = React.useState(true); // DISABLED BY DEFAULT

  useEffect(() => {
    // Realtime is disabled - just return early
    console.log('🚫 [Realtime] Disabled to prevent WebSocket failures');
    return;

    console.log('🔗 Setting up realtime for all games (attempt', connectionAttempts + 1, ')');

    try {
      const channel = supabase
        .channel('all-games-v2') // Use versioned channel name
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'games'
        }, (payload) => {
          console.log('🎮 Games table update:', payload);
          
          // Throttle invalidations to prevent excessive refetches
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['games'] });
          }, 1000);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_participants'
        }, (payload) => {
          console.log('👥 Participants table update:', payload);
          
          // Throttle invalidations
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['games'] });
          }, 1000);
        })
        .subscribe((status) => {
          console.log('📡 All games realtime status:', status);
          
          if (status === 'SUBSCRIBED') {
            setConnectionAttempts(0); // Reset on success
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Realtime connection failed:', status);
            setConnectionAttempts(prev => prev + 1);
            
            // Disable after 3 failures
            if (connectionAttempts >= 2) {
              setIsDisabled(true);
              console.warn('🚫 Realtime permanently disabled due to repeated failures');
            }
          }
        });

      channelRef.current = channel;
      
      // Set timeout to detect stuck connections
      const connectionTimeout = setTimeout(() => {
        if (channelRef.current?.state !== 'joined') {
          console.warn('⏰ Realtime connection timeout, retrying...');
          channelRef.current?.unsubscribe();
          setConnectionAttempts(prev => prev + 1);
        }
      }, 10000);
      
      return () => {
        clearTimeout(connectionTimeout);
      };
      
    } catch (error) {
      console.error('❌ Failed to setup all games realtime:', error);
      setConnectionAttempts(prev => prev + 1);
    }

    return () => {
      console.log('🔌 Unsubscribing from all games realtime');
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error unsubscribing from realtime:', error);
        }
      }
    };
  }, [queryClient, connectionAttempts, isDisabled]);

  return {
    isConnected: channelRef.current?.state === 'joined',
    isDisabled,
    connectionAttempts
  };
}
