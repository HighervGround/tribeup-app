import { useQuery } from '@tanstack/react-query';
import { 
  getSuccessfulGames, 
  getFeaturedGameOfWeek,
  type GameMetrics 
} from '@/domains/games/services/gameMetrics';

/**
 * Query keys for successful games
 */
export const successfulGamesKeys = {
  all: ['successfulGames'] as const,
  list: (limit?: number) => [...successfulGamesKeys.all, 'list', limit] as const,
  featured: () => [...successfulGamesKeys.all, 'featured'] as const,
};

/**
 * Hook to fetch successful games with high participation
 */
export function useSuccessfulGames(limit: number = 6) {
  return useQuery<GameMetrics[], Error>({
    queryKey: successfulGamesKeys.list(limit),
    queryFn: () => getSuccessfulGames(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook to fetch the featured game of the week
 */
export function useFeaturedGame() {
  return useQuery<GameMetrics | null, Error>({
    queryKey: successfulGamesKeys.featured(),
    queryFn: getFeaturedGameOfWeek,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (renamed from cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
