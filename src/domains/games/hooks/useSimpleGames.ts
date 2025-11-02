/**
 * Simple Games Hook - No complexity, just works
 */

import { useQuery } from '@tanstack/react-query';
import { SimpleGameService } from '../lib/simpleGameService';

export function useSimpleGames() {
  return useQuery({
    queryKey: ['simple-games'],
    queryFn: SimpleGameService.getGames,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once
    retryDelay: 2000, // 2 second delay
  });
}

export function useSimpleGame(gameId: string) {
  return useQuery({
    queryKey: ['simple-game', gameId],
    queryFn: () => SimpleGameService.getGame(gameId),
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
