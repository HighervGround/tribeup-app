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
    // Remove authentication requirement - games should load for all users
    // enabled: !!user, // Only fetch when user is authenticated
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
      // Cancel outgoing refetches for all related queries
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      await queryClient.cancelQueries({ queryKey: gameKeys.detail(gameId) });
      await queryClient.cancelQueries({ queryKey: gameKeys.participants(gameId) });
      
      // Snapshot previous values
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      const previousGame = queryClient.getQueryData(gameKeys.detail(gameId));
      const previousParticipants = queryClient.getQueryData(gameKeys.participants(gameId));
      
      // Optimistically update games list
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

      // Optimistically update game detail
      queryClient.setQueryData(gameKeys.detail(gameId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isJoined: true,
          currentPlayers: Math.min(old.currentPlayers + 1, old.maxPlayers)
        };
      });

      // Optimistically update participants list
      if (user) {
        queryClient.setQueryData(gameKeys.participants(gameId), (old: any) => {
          if (!old) return [{ id: user.id, name: user.name, avatar: user.avatar }];
          const isAlreadyJoined = old.some((p: any) => p.id === user.id);
          if (isAlreadyJoined) return old;
          return [...old, { id: user.id, name: user.name, avatar: user.avatar }];
        });
      }
      
      return { previousGames, previousGame, previousParticipants };
    },
    onError: (error, gameId, context) => {
      console.error('❌ Join game error:', error);
      
      // Rollback on error
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
      if (context?.previousGame) {
        queryClient.setQueryData(gameKeys.detail(gameId), context.previousGame);
      }
      if (context?.previousParticipants) {
        queryClient.setQueryData(gameKeys.participants(gameId), context.previousParticipants);
      }
      
      toast.error('Failed to join game', {
        description: 'Please try again later',
      });
    },
    onSuccess: (_, gameId) => {
      console.log('✅ Successfully joined game:', gameId);
      
      // Force refetch to ensure UI is updated with latest data
      queryClient.refetchQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.participants(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      
      // Also invalidate to mark as stale
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      // Toast removed - components handle their own success feedback
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
      // Cancel outgoing refetches for all related queries
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      await queryClient.cancelQueries({ queryKey: gameKeys.detail(gameId) });
      await queryClient.cancelQueries({ queryKey: gameKeys.participants(gameId) });
      
      // Snapshot previous values
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      const previousGame = queryClient.getQueryData(gameKeys.detail(gameId));
      const previousParticipants = queryClient.getQueryData(gameKeys.participants(gameId));
      
      // Optimistically update games list
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

      // Optimistically update game detail
      queryClient.setQueryData(gameKeys.detail(gameId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isJoined: false,
          currentPlayers: Math.max(old.currentPlayers - 1, 0)
        };
      });

      // Optimistically update participants list by removing current user
      const { user } = useAppStore.getState();
      if (user) {
        queryClient.setQueryData(gameKeys.participants(gameId), (old: any) => {
          if (!old) return [];
          return old.filter((p: any) => p.id !== user.id);
        });
      }
      
      return { previousGames, previousGame, previousParticipants };
    },
    onError: (error, gameId, context) => {
      console.error('❌ Leave game error:', error);
      
      // Rollback on error
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
      if (context?.previousGame) {
        queryClient.setQueryData(gameKeys.detail(gameId), context.previousGame);
      }
      if (context?.previousParticipants) {
        queryClient.setQueryData(gameKeys.participants(gameId), context.previousParticipants);
      }
      
      toast.error('Failed to leave game', {
        description: 'Please try again later',
      });
    },
    onSuccess: (_, gameId) => {
      console.log('✅ Successfully left game:', gameId);
      
      // Force refetch to ensure UI is updated with latest data
      queryClient.refetchQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.participants(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      
      // Also invalidate to mark as stale
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      // Toast removed - components handle their own success feedback
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
