import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TribeMemberService } from '../services/tribeMemberService';
import { tribeKeys } from './useTribes';
import { toast } from 'sonner';

// Query keys for members
export const tribeMemberKeys = {
  all: (tribeId: string) => ['tribes', tribeId, 'members'] as const,
  list: (tribeId: string) => [...tribeMemberKeys.all(tribeId), 'list'] as const,
  membership: (tribeId: string, userId: string) => [...tribeMemberKeys.all(tribeId), 'membership', userId] as const,
  role: (tribeId: string, userId: string) => [...tribeMemberKeys.all(tribeId), 'role', userId] as const,
};

/**
 * Hook for fetching tribe members
 */
export function useTribeMembers(tribeId: string) {
  return useQuery({
    queryKey: tribeMemberKeys.list(tribeId),
    queryFn: () => TribeMemberService.getTribeMembers(tribeId),
    enabled: !!tribeId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for checking if user is a member
 */
export function useTribeMembership(tribeId: string, userId: string | undefined) {
  return useQuery({
    queryKey: tribeMemberKeys.membership(tribeId, userId || ''),
    queryFn: () => TribeMemberService.isMember(tribeId, userId!),
    enabled: !!tribeId && !!userId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook for getting user's role in tribe
 */
export function useTribeRole(tribeId: string, userId: string | undefined) {
  return useQuery({
    queryKey: tribeMemberKeys.role(tribeId, userId || ''),
    queryFn: () => TribeMemberService.getUserRole(tribeId, userId!),
    enabled: !!tribeId && !!userId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook for joining a tribe
 */
export function useJoinTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tribeId, userId }: { tribeId: string; userId: string }) =>
      TribeMemberService.joinTribe(tribeId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tribeMemberKeys.list(variables.tribeId) });
      queryClient.invalidateQueries({ queryKey: tribeKeys.detail(variables.tribeId) });
      queryClient.invalidateQueries({ queryKey: tribeKeys.userTribes(variables.userId) });
      queryClient.invalidateQueries({ queryKey: tribeMemberKeys.membership(variables.tribeId, variables.userId) });
      toast.success('Joined tribe successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to join tribe', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for leaving a tribe
 */
export function useLeaveTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tribeId, userId }: { tribeId: string; userId: string }) =>
      TribeMemberService.leaveTribe(tribeId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tribeMemberKeys.list(variables.tribeId) });
      queryClient.invalidateQueries({ queryKey: tribeKeys.detail(variables.tribeId) });
      queryClient.invalidateQueries({ queryKey: tribeKeys.userTribes(variables.userId) });
      queryClient.invalidateQueries({ queryKey: tribeMemberKeys.membership(variables.tribeId, variables.userId) });
      toast.success('Left tribe successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to leave tribe', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for toggling tribe membership (join/leave)
 */
export function useTribeJoinToggle() {
  const joinMutation = useJoinTribe();
  const leaveMutation = useLeaveTribe();

  return {
    toggle: async (tribeId: string, userId: string, isMember: boolean) => {
      if (isMember) {
        return leaveMutation.mutateAsync({ tribeId, userId });
      } else {
        return joinMutation.mutateAsync({ tribeId, userId });
      }
    },
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
    isLoading: joinMutation.isPending || leaveMutation.isPending,
  };
}

/**
 * Hook for updating member role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tribeId, memberId, role }: { tribeId: string; memberId: string; role: 'member' | 'moderator' | 'admin' }) =>
      TribeMemberService.updateMemberRole(tribeId, memberId, role),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tribeMemberKeys.list(variables.tribeId) });
      toast.success('Member role updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update member role', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for removing a member
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tribeId, memberId }: { tribeId: string; memberId: string }) =>
      TribeMemberService.removeMember(tribeId, memberId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tribeMemberKeys.list(variables.tribeId) });
      toast.success('Member removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove member', {
        description: error.message,
      });
    },
  });
}

