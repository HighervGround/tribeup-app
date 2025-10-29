import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SupabaseService } from '../lib/supabaseService';
import { joinGame, leaveGame, getGameParticipants, isUserInGame } from '../lib/gameParticipantService';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';
import { CacheCorruptionDetector } from '../utils/cacheCorruptionDetector';

// Query keys
export const gameKeys = {
  all: ['games'] as const,
  lists: () => [...gameKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...gameKeys.lists(), { filters }] as const,
  details: () => [...gameKeys.all, 'detail'] as const,
  detail: (id: string) => [...gameKeys.details(), id] as const,
  participants: (id: string) => [...gameKeys.detail(id), 'participants'] as const,
};

// Hook for fetching games with enhanced error handling and timeout
export function useGames() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  
  // Invalidate cache when user auth state changes to prevent stale data
  useEffect(() => {
    // Only invalidate if user actually changed (not just loading states)
    // Add debouncing and prevent invalidation during initial auth flow
    if (user?.id) {
      console.log('🔄 [useGames] User authenticated, checking if cache invalidation needed:', user.id);
      
      // Check if this is the same user as before to prevent unnecessary invalidations
      const lastUserId = sessionStorage.getItem('tribeup_last_user_id');
      const lastInvalidationTime = parseInt(sessionStorage.getItem('tribeup_last_invalidation') || '0');
      const now = Date.now();
      
      // Skip if same user AND recent invalidation (within 10 seconds)
      if (lastUserId === user.id && (now - lastInvalidationTime) < 10000) {
        console.log('🔄 [useGames] Same user with recent invalidation, skipping');
        return;
      }
      
      // Store current user ID and timestamp to prevent future unnecessary invalidations
      sessionStorage.setItem('tribeup_last_user_id', user.id);
      sessionStorage.setItem('tribeup_last_invalidation', now.toString());
      
      // Use longer debounce to let auth stabilize
      const timeoutId = setTimeout(() => {
        console.log('🔄 [useGames] Invalidating cache for user:', user.id);
        queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      }, 1000); // Increased to 1 second to let auth fully stabilize
      
      return () => clearTimeout(timeoutId);
    } else {
      // Clear stored user ID when user signs out
      sessionStorage.removeItem('tribeup_last_user_id');
      sessionStorage.removeItem('tribeup_last_invalidation');
    }
  }, [user?.id, queryClient]);
  
  return useQuery({
    queryKey: gameKeys.lists(),
    queryFn: async () => {
      console.log('🔍 [useGames] Starting fetch with user:', user?.id || 'anonymous');
      const startTime = performance.now();
      
      try {
        // Let the query complete naturally - no artificial timeouts
        const games = await SupabaseService.getGames();
        const duration = performance.now() - startTime;
        
        console.log('✅ [useGames] Games fetched successfully:', {
          count: games.length,
          duration: `${duration.toFixed(2)}ms`,
          user: user?.id || 'anonymous'
        });
        
        return games;
      } catch (error) {
        const duration = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [useGames] Fetch failed:', {
          error: errorMessage,
          duration: `${duration.toFixed(2)}ms`,
          user: user?.id || 'anonymous'
        });
        
        // If it's a timeout, this might be cache corruption
        if (errorMessage.includes('timeout')) {
          console.warn('🧹 [useGames] Timeout detected - possible cache corruption');
          
          // After 2 timeouts, assume cache corruption and force clean
          const timeoutCount = parseInt(sessionStorage.getItem('tribeup_timeout_count') || '0') + 1;
          sessionStorage.setItem('tribeup_timeout_count', timeoutCount.toString());
          
          if (timeoutCount >= 2) {
            console.error('🚨 [useGames] Multiple timeouts detected, forcing cache cleanup');
            CacheCorruptionDetector.forceCleanOnNextLoad();
            toast.error('Loading issues detected', {
              description: 'Refreshing to clear corrupted cache...',
              duration: 3000
            });
            
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        }
        
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (reasonable refresh time)
    gcTime: 5 * 60 * 1000, // 5 minutes (normal cleanup)
    retry: (failureCount, error) => {
      console.log(`🔄 [useGames] Retry attempt ${failureCount}:`, error.message);
      
      // Don't retry timeouts more than once
      if (error.message?.includes('timeout') && failureCount >= 1) {
        console.warn('🚫 [useGames] Timeout retry limit reached');
        return false;
      }
      
      // Don't retry auth errors
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        console.warn('🚫 [useGames] Auth error, no retry');
        return false;
      }
      
      return failureCount < 2; // Max 2 retries
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * Math.pow(2, attemptIndex), 5000);
      console.log(`⏱️ [useGames] Retry delay: ${delay}ms`);
      return delay;
    },
    // Remove authentication requirement - games should load for all users
    // enabled: !!user, // Only fetch when user is authenticated
    refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Don't refetch on window focus - reduces queries
    refetchOnReconnect: true, // Only refetch when network reconnects
    // Prevent queries from being cancelled during auth state changes
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
    meta: {
      errorMessage: 'Failed to load games. Please refresh the page.'
    }
  });
}

// Hook for fetching a single game
export function useGame(gameId: string) {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: async () => {
      console.log('🔍 Fetching game:', gameId);
      const game = await SupabaseService.getGameById(gameId);
      console.log('✅ Game fetched:', game?.id || 'not found');
      return game;
    },
    enabled: !!gameId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorMessage: 'Failed to load game details'
    }
  });
}

// Hook for fetching game participants
export function useGameParticipants(gameId: string) {
  return useQuery({
    queryKey: gameKeys.participants(gameId),
    queryFn: async () => {
      console.log('🔍 Fetching participants for game:', gameId);
      // Use SupabaseService which joins with user data
      const participants = await SupabaseService.getGameParticipants(gameId);
      console.log('✅ Participants fetched:', participants.length);
      return participants;
    },
    enabled: !!gameId,
    staleTime: 0, // Always refetch when gameId changes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
    meta: {
      errorMessage: 'Failed to load game participants'
    }
  });
}

// Hook for joining a game
export function useJoinGame() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  return useMutation({
    mutationFn: async (gameId: string) => {
      console.log('🔧 Joining game:', gameId);
      const result = await joinGame(gameId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to join game');
      }
      return result;
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
      
      // Just invalidate - let React Query handle the refetch automatically
      // This prevents race conditions between optimistic updates and refetches
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      console.log('🔄 Invalidated queries for game:', gameId);
    },
  });
}

// Hook for leaving a game
export function useLeaveGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      console.log('🔧 Leaving game:', gameId);
      const result = await leaveGame(gameId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to leave game');
      }
      return result;
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
      
      // Just invalidate - let React Query handle the refetch automatically
      // This prevents race conditions between optimistic updates and refetches
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.participants(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      console.log('🔄 Invalidated queries for game:', gameId);
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
      console.log('✅ Game created successfully:', (newGame as any)?.id || 'unknown');
      
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

// Hook for checking if user is in a game
export function useIsUserInGame(gameId: string) {
  return useQuery({
    queryKey: [...gameKeys.detail(gameId), 'userInGame'],
    queryFn: async () => {
      console.log('🔍 Checking if user is in game:', gameId);
      const inGame = await isUserInGame(gameId);
      console.log('✅ User in game check:', inGame);
      return inGame;
    },
    enabled: !!gameId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}
