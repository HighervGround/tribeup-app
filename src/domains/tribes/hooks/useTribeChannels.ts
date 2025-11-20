import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TribeChannelService } from '../services/tribeChannelService';
import { toast } from 'sonner';

// Query keys for channels
export const tribeChannelKeys = {
  all: (tribeId: string) => ['tribes', tribeId, 'channels'] as const,
  list: (tribeId: string) => [...tribeChannelKeys.all(tribeId), 'list'] as const,
  detail: (channelId: string) => ['tribe-channels', channelId] as const,
  messages: (channelId: string) => [...tribeChannelKeys.detail(channelId), 'messages'] as const,
};

/**
 * Hook for fetching tribe channels
 */
export function useTribeChannels(tribeId: string) {
  return useQuery({
    queryKey: tribeChannelKeys.list(tribeId),
    queryFn: () => TribeChannelService.getTribeChannels(tribeId),
    enabled: !!tribeId,
    staleTime: 5 * 60 * 1000, // 5 minutes - channels don't change often
  });
}

/**
 * Hook for fetching channel messages
 */
export function useTribeChatMessages(channelId: string) {
  return useQuery({
    queryKey: tribeChannelKeys.messages(channelId),
    queryFn: () => TribeChannelService.getChannelMessages(channelId),
    enabled: !!channelId,
    staleTime: 30 * 1000, // 30 seconds - messages update frequently
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

/**
 * Hook for creating a channel
 */
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TribeChannelService.createChannel,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tribeChannelKeys.list(data.tribe_id) });
      toast.success('Channel created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create channel', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating a channel
 */
export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, updates }: { channelId: string; updates: any }) =>
      TribeChannelService.updateChannel(channelId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tribeChannelKeys.list(data.tribe_id) });
      toast.success('Channel updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update channel', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for deleting a channel
 */
export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TribeChannelService.deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tribeChannelKeys.all });
      toast.success('Channel deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete channel', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for sending a message
 */
export function useSendTribeMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TribeChannelService.sendMessage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tribeChannelKeys.messages(data.channel_id) });
    },
    onError: (error: Error) => {
      toast.error('Failed to send message', {
        description: error.message,
      });
    },
  });
}

