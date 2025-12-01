import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/appStore';
import {
  getFriendSuggestions,
  getMutualGameUsers,
  searchUsers,
  followUser as followUserService,
  getUserFriends,
  getUserFollowers,
  isFollowing,
  FriendSuggestion
} from '../services/friendService';

// Query keys for React Query
export const friendKeys = {
  all: ['friends'] as const,
  suggestions: () => [...friendKeys.all, 'suggestions'] as const,
  mutual: () => [...friendKeys.all, 'mutual'] as const,
  search: (query: string) => [...friendKeys.all, 'search', query] as const,
  following: (userId: string) => [...friendKeys.all, 'following', userId] as const,
  userFriends: (userId?: string) => [...friendKeys.all, 'userFriends', userId] as const,
  userFollowers: (userId?: string) => [...friendKeys.all, 'userFollowers', userId] as const,
};

/**
 * Hook to get people to follow suggestions based on games played together
 */
export function useFriendSuggestions(limit: number = 10) {
  return useQuery({
    queryKey: friendKeys.suggestions(),
    queryFn: () => getFriendSuggestions(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always enabled since it doesn't require auth for basic functionality
  });
}

/**
 * Hook to get users who have played games together (mutual participants)
 */
export function useMutualGameUsers(limit: number = 20) {
  const { user } = useAppStore();

  return useQuery({
    queryKey: friendKeys.mutual(),
    queryFn: () => getMutualGameUsers(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // Only enabled when user is logged in
  });
}

/**
 * Hook to search for users by name or username
 */
export function useUserSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: friendKeys.search(query),
    queryFn: () => searchUsers(query),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && query.length > 2, // Only search when query is meaningful
  });
}

/**
 * Hook to get users you're following
 */
export function useUserFriends(userId?: string) {
  const { user } = useAppStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: friendKeys.userFriends(targetUserId),
    queryFn: () => getUserFriends(targetUserId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!targetUserId,
  });
}

/**
 * Hook to get users who follow you (followers)
 */
export function useUserFollowers(userId?: string) {
  const { user } = useAppStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: friendKeys.userFollowers(targetUserId),
    queryFn: () => getUserFollowers(targetUserId),
    staleTime: 5 * 60 * 1000,
    enabled: !!targetUserId,
  });
}

/**
 * Hook to check if current user is following a target user
 */
export function useIsFollowing(targetUserId: string) {
  const { user } = useAppStore();

  return useQuery({
    queryKey: friendKeys.following(targetUserId),
    queryFn: () => isFollowing(targetUserId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user && !!targetUserId,
  });
}

/**
 * Hook to follow/unfollow a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  return useMutation({
    mutationFn: (targetUserId: string) => followUserService(targetUserId),
    onSuccess: (result, targetUserId) => {
      if (result.success) {
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries({ queryKey: friendKeys.suggestions() });
        queryClient.invalidateQueries({ queryKey: friendKeys.mutual() });
        queryClient.invalidateQueries({ queryKey: friendKeys.following(targetUserId) });
        queryClient.invalidateQueries({ queryKey: friendKeys.userFriends(user?.id) });
        queryClient.invalidateQueries({ queryKey: friendKeys.userFollowers(user?.id) });

        // Update the suggestions cache optimistically
        queryClient.setQueryData(
          friendKeys.suggestions(),
          (oldData: FriendSuggestion[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(suggestion =>
              suggestion.id === targetUserId
                ? { ...suggestion, is_following: result.action === 'followed' }
                : suggestion
            );
          }
        );

        // Update the followers cache optimistically
        queryClient.setQueryData(
          friendKeys.userFollowers(user?.id),
          (oldData: FriendSuggestion[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(follower =>
              follower.id === targetUserId
                ? { ...follower, is_following: result.action === 'followed' }
                : follower
            );
          }
        );
      }
    },
  });
}

/**
 * Combined hook that provides all follow-related functionality
 */
export function useFriends() {
  const suggestions = useFriendSuggestions();
  const mutualUsers = useMutualGameUsers();
  const followMutation = useFollowUser();

  return {
    // Data
    suggestions: suggestions.data || [],
    mutualUsers: mutualUsers.data || [],

    // Loading states
    isLoadingSuggestions: suggestions.isLoading,
    isLoadingMutual: mutualUsers.isLoading,

    // Errors
    suggestionsError: suggestions.error,
    mutualError: mutualUsers.error,

    // Actions
    followUser: followMutation.mutate,
    isFollowingLoading: followMutation.isPending,

    // Utilities
    refetchSuggestions: suggestions.refetch,
    refetchMutual: mutualUsers.refetch,
  };
}
