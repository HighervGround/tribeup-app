import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TribeService } from '../services/tribeService';
import { toast } from 'sonner';

// Query keys
export const tribeKeys = {
  all: ['tribes'] as const,
  lists: () => [...tribeKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...tribeKeys.lists(), { filters }] as const,
  details: () => [...tribeKeys.all, 'detail'] as const,
  detail: (id: string) => [...tribeKeys.details(), id] as const,
  userTribes: (userId: string) => [...tribeKeys.all, 'user', userId] as const,
  search: (query: string) => [...tribeKeys.all, 'search', query] as const,
};

/**
 * Hook for fetching all public tribes
 */
export function useTribes(activity?: string) {
  return useQuery({
    queryKey: tribeKeys.list({ activity }),
    queryFn: () => TribeService.getPublicTribes(activity),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching a single tribe
 */
export function useTribe(tribeId: string) {
  return useQuery({
    queryKey: tribeKeys.detail(tribeId),
    queryFn: () => TribeService.getTribeWithCreator(tribeId),
    enabled: !!tribeId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for searching tribes
 */
export function useSearchTribes(query: string, activity?: string) {
  return useQuery({
    queryKey: tribeKeys.search(query),
    queryFn: () => TribeService.searchTribes(query, activity),
    enabled: query.length >= 2,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook for fetching user's tribes
 */
export function useUserTribes(userId: string | undefined) {
  return useQuery({
    queryKey: tribeKeys.userTribes(userId || ''),
    queryFn: () => TribeService.getUserTribes(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for creating a tribe
 */
export function useCreateTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TribeService.createTribe,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tribeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tribeKeys.userTribes(data.creator_id) });
      toast.success('Tribe created successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to create tribe', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating a tribe
 */
export function useUpdateTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tribeId, updates }: { tribeId: string; updates: any }) =>
      TribeService.updateTribe(tribeId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tribeKeys.detail(variables.tribeId) });
      queryClient.invalidateQueries({ queryKey: tribeKeys.lists() });
      toast.success('Tribe updated successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to update tribe', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for deleting a tribe
 */
export function useDeleteTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TribeService.deleteTribe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tribeKeys.lists() });
      toast.success('Tribe deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete tribe', {
        description: error.message,
      });
    },
  });
}

