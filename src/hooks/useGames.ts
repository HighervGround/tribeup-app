import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';

// Query keys
export const gameKeys = {
  all: ['games'] as const,
  lists: () => [...gameKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...gameKeys.lists(), { filters }] as const,
  details: () => [...gameKeys.all, 'detail'] as const,
  detail: (id: string) => [...gameKeys.details(), id] as const,
  participants: (id: string) => [...gameKeys.detail(id), 'participants'] as const,
};

// Hook for fetching games
export function useGames() {
  const { user } = useAppStore();
  
  return useQuery({
    queryKey: gameKeys.lists(),
    queryFn: async () => {
      console.log('🔍 Fetching games with React Query');
      const games = await SupabaseService.getGames();
      console.log('✅ Games fetched:', games.length);
      return games;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    enabled: !!user, // Only fetch when user is authenticated
  });
}

// Hook for fetching a single game
export function useGame(gameId: string) {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: async () => {
      return await SupabaseService.getGameById(gameId);
    },
    enabled: !!gameId,
  });
}

// Hook for fetching game participants
export function useGameParticipants(gameId: string) {
  return useQuery({
    queryKey: gameKeys.participants(gameId),
    queryFn: () => SupabaseService.getGameParticipants(gameId),
    enabled: !!gameId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook for joining a game
export function useJoinGame() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  return useMutation({
    mutationFn: async (gameId: string) => {
      console.log('🔧 Joining game:', gameId);
      await SupabaseService.joinGame(gameId);
    },
    onMutate: async (gameId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      
      // Snapshot previous value
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      
      // Optimistically update
      queryClient.setQueryData(gameKeys.lists(), (old: any) => {
        if (!old) return old;
        return old.map((game: any) => 
          game.id === gameId 
            ? { 
                ...game, 
                isJoined: true, 
                currentPlayers: Math.min(game.currentPlayers + 1, game.maxPlayers)
              }
            : game
        );
      });
      
      return { previousGames };
    },
    onError: (error, gameId, context) => {
      console.error('❌ Join game error:', error);
      
      // Rollback on error
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
      
      toast.error('Failed to join game', {
        description: 'Please try again later',
      });
    },
    onSuccess: (_, gameId) => {
      console.log('✅ Successfully joined game:', gameId);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
      
      toast.success('Joined game!', {
        description: 'You\'re now part of this game',
      });
    },
  });
}

// Hook for leaving a game
export function useLeaveGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      console.log('🔧 Leaving game:', gameId);
      await SupabaseService.leaveGame(gameId);
    },
    onMutate: async (gameId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      
      // Snapshot previous value
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      
      // Optimistically update
      queryClient.setQueryData(gameKeys.lists(), (old: any) => {
        if (!old) return old;
        return old.map((game: any) => 
          game.id === gameId 
            ? { 
                ...game, 
                isJoined: false, 
                currentPlayers: Math.max(game.currentPlayers - 1, 0)
              }
            : game
        );
      });
      
      return { previousGames };
    },
    onError: (error, gameId, context) => {
      console.error('❌ Leave game error:', error);
      
      // Rollback on error
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
      
      toast.error('Failed to leave game', {
        description: 'Please try again later',
      });
    },
    onSuccess: (_, gameId) => {
      console.log('✅ Successfully left game:', gameId);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
      
      toast.success('Left game successfully', {
        description: 'You\'ve left this game',
      });
    },
  });
}

// Hook for creating a game
export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameData: any) => {
      console.log('🔧 Creating game:', gameData);
      return await SupabaseService.createGame(gameData);
    },
    onSuccess: (newGame) => {
      console.log('✅ Game created successfully:', newGame.id);
      
      // Invalidate games list to refetch
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      toast.success('Game created!', {
        description: 'Your game is now live',
      });
    },
    onError: (error) => {
      console.error('❌ Create game error:', error);
      
      toast.error('Failed to create game', {
        description: 'Please try again later',
      });
    },
  });
}
