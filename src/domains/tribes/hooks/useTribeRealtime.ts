import { useEffect } from 'react';
import { supabase } from '@/core/database/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { tribeKeys } from './useTribes';
import { tribeMemberKeys } from './useTribeMembers';

/**
 * Hook for real-time updates on a tribe
 */
export function useTribeRealtime(tribeId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tribeId) return;

    console.log('🔗 Setting up real-time for tribe:', tribeId);

    // Subscribe to tribe updates
    const tribeChannel = supabase
      .channel(`tribe:${tribeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tribes',
          filter: `id=eq.${tribeId}`,
        },
        (payload) => {
          console.log('🔄 Tribe updated:', payload);
          queryClient.invalidateQueries({ queryKey: tribeKeys.detail(tribeId) });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tribe_members',
          filter: `tribe_id=eq.${tribeId}`,
        },
        (payload) => {
          console.log('🔄 Tribe member updated:', payload);
          queryClient.invalidateQueries({ queryKey: tribeMemberKeys.list(tribeId) });
          queryClient.invalidateQueries({ queryKey: tribeKeys.detail(tribeId) });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time for tribe:', tribeId);
      supabase.removeChannel(tribeChannel);
    };
  }, [tribeId, queryClient]);
}

/**
 * Hook for real-time updates on tribe chat messages
 */
export function useTribeChatRealtime(channelId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId) return;

    console.log('🔗 Setting up real-time chat for channel:', channelId);

    const channel = supabase
      .channel(`tribe-chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tribe_chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          console.log('💬 New chat message:', payload);
          queryClient.invalidateQueries({ queryKey: ['tribe-chat', channelId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time chat for channel:', channelId);
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);
}

