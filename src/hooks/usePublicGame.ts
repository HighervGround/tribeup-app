import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseService } from '../lib/supabaseService';
import { toast } from 'sonner';

// Query keys
export const publicGameKeys = {
  all: ['publicGames'] as const,
  game: (id: string) => [...publicGameKeys.all, 'game', id] as const,
  rsvps: (id: string) => [...publicGameKeys.all, 'rsvps', id] as const,
};

/**
 * Hook for fetching public game data
 */
export function usePublicGame(gameId: string) {
  return useQuery({
    queryKey: publicGameKeys.game(gameId),
    queryFn: async () => {
      if (!gameId) throw new Error('Game ID is required');
      return await SupabaseService.getGameById(gameId);
    },
    enabled: !!gameId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching public RSVPs for a game
 */
export function usePublicRSVPs(gameId: string) {
  return useQuery({
    queryKey: publicGameKeys.rsvps(gameId),
    queryFn: async () => {
      if (!gameId) throw new Error('Game ID is required');
      return await SupabaseService.getPublicRSVPs(gameId);
    },
    enabled: !!gameId,
    staleTime: 30 * 1000, // 30 seconds (RSVPs change frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for creating a public RSVP
 */
export function useCreatePublicRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, rsvpData }: { gameId: string; rsvpData: any }) => {
      return await SupabaseService.createPublicRSVP(gameId, rsvpData);
    },
    onSuccess: (_, { gameId }) => {
      // Invalidate RSVPs to refetch updated list
      queryClient.invalidateQueries({ queryKey: publicGameKeys.rsvps(gameId) });
      
      toast.success('RSVP submitted successfully!', {
        description: 'Your spot has been reserved',
      });
    },
    onError: (error) => {
      console.error('Create RSVP error:', error);
      toast.error('Failed to submit RSVP', {
        description: 'Please try again later',
      });
    },
  });
}

/**
 * Hook for quick RSVP submission (for unauthenticated users)
 */
export function useQuickRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, name, email }: { gameId: string; name: string; email: string }) => {
      return await SupabaseService.createPublicRSVP(gameId, {
        name,
        email,
        phone: '',
        message: '',
        attending: true
      });
    },
    onSuccess: (_, { gameId }) => {
      // Invalidate RSVPs to refetch updated list
      queryClient.invalidateQueries({ queryKey: publicGameKeys.rsvps(gameId) });
      
      toast.success('Quick RSVP submitted!', {
        description: 'Check your email for confirmation',
      });
    },
    onError: (error) => {
      console.error('Quick RSVP error:', error);
      toast.error('Failed to submit quick RSVP', {
        description: 'Please check your information and try again',
      });
    },
  });
}
