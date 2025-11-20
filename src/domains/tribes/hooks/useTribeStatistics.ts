import { useQuery } from '@tanstack/react-query';
import { TribeService } from '../services/tribeService';
import { tribeKeys } from './useTribes';

/**
 * Hook for fetching tribe statistics
 */
export function useTribeStatistics(tribeId: string) {
  return useQuery({
    queryKey: [...tribeKeys.detail(tribeId), 'statistics'],
    queryFn: () => TribeService.getTribeStatistics(tribeId),
    enabled: !!tribeId,
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
  });
}

