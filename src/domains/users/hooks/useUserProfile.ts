import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseService } from '@/core/database/supabaseService';
import { toast } from 'sonner';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  profile: (id: string) => [...userKeys.all, 'profile', id] as const,
  stats: (id: string) => [...userKeys.all, 'stats', id] as const,
  recentGames: (id: string) => [...userKeys.all, 'recentGames', id] as const,
  achievements: (id: string) => [...userKeys.all, 'achievements', id] as const,
};

/**
 * Hook for fetching user profile data
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      try {
        return await SupabaseService.getUserProfile(userId);
      } catch (error: any) {
        // Re-throw auth errors so they can be distinguished from "not found"
        if (error?.isAuthError) {
          throw error;
        }
        // For other errors, return null (will be treated as "not found")
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching user stats
 */
export function useUserStats(userId: string) {
  return useQuery({
    queryKey: userKeys.stats(userId),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      try {
        const rawStats = await SupabaseService.getUserStats(userId);
        // Map database fields to expected format
        return {
          totalGamesPlayed: rawStats.games_played || 0,
          totalGamesHosted: rawStats.games_hosted || 0,
          averageRating: rawStats.average_rating || 0,
          totalPlayTime: rawStats.total_play_time_minutes || 0,
          favoritesSports: rawStats.favorite_sport ? [rawStats.favorite_sport] : [],
          completionRate: rawStats.completion_rate || 0,
          totalDistance: rawStats.total_distance || 0,
        };
      } catch (error) {
        // Return default stats if none exist
        return {
          totalGamesPlayed: 0,
          totalGamesHosted: 0,
          averageRating: 0,
          totalPlayTime: 0,
          favoritesSports: [],
          completionRate: 0,
          totalDistance: 0,
        };
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching user's recent games
 */
export function useUserRecentGames(userId: string, limit = 5) {
  return useQuery({
    queryKey: [...userKeys.recentGames(userId), limit],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      try {
        return await SupabaseService.getUserRecentGames(userId, limit);
      } catch (error) {
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching user achievements
 */
export function useUserAchievements(userId: string) {
  return useQuery({
    queryKey: userKeys.achievements(userId),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      try {
        return await SupabaseService.getUserAchievements(userId);
      } catch (error) {
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for updating user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, profileData }: { userId: string; profileData: any }) => {
      return await SupabaseService.updateUserProfile(userId, profileData);
    },
    onSuccess: (_, { userId }) => {
      // Invalidate user profile queries
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats(userId) });
      
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved',
      });
    },
    onError: (error) => {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile', {
        description: 'Please try again later',
      });
    },
  });
}
