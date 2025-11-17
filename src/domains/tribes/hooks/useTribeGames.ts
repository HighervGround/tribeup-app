import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/database/supabase';
import { toast } from 'sonner';
import { tribeKeys } from './useTribes';

/**
 * Hook for fetching games linked to a tribe
 */
export function useTribeGames(tribeId: string) {
  return useQuery({
    queryKey: ['tribes', tribeId, 'games'],
    queryFn: async () => {
      const { data: tribeGames, error } = await supabase
        .from('tribe_games')
        .select('game_id, games(*)')
        .eq('tribe_id', tribeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (tribeGames || []).map((item: any) => item.games).filter(Boolean);
    },
    enabled: !!tribeId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for linking a game to a tribe
 */
export function useLinkGameToTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tribeId, gameId }: { tribeId: string; gameId: string }) => {
      const { data, error } = await supabase
        .from('tribe_games')
        .insert({ tribe_id: tribeId, game_id: gameId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tribes', variables.tribeId, 'games'] });
      queryClient.invalidateQueries({ queryKey: tribeKeys.detail(variables.tribeId) });
      toast.success('Game linked to tribe');
    },
    onError: (error: Error) => {
      toast.error('Failed to link game', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for unlinking a game from a tribe
 */
export function useUnlinkGameFromTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tribeId, gameId }: { tribeId: string; gameId: string }) => {
      const { error } = await supabase
        .from('tribe_games')
        .delete()
        .eq('tribe_id', tribeId)
        .eq('game_id', gameId);

      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tribes', variables.tribeId, 'games'] });
      queryClient.invalidateQueries({ queryKey: tribeKeys.detail(variables.tribeId) });
      toast.success('Game unlinked from tribe');
    },
    onError: (error: Error) => {
      toast.error('Failed to unlink game', {
        description: error.message,
      });
    },
  });
}

