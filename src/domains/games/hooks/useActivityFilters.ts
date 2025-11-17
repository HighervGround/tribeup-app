import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { useUserFriends } from '@/domains/users/hooks/useFriends';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/database/supabase';
import { GameWithCreator } from './useGamesWithCreators';

interface UseActivityFiltersProps {
  games: GameWithCreator[];
  showFollowingOnly: boolean;
}

export function useActivityFilters({
  games,
  showFollowingOnly,
}: UseActivityFiltersProps) {
  const { user } = useAppStore();
  const { data: userFriends } = useUserFriends(user?.id);

  // Fetch follower counts for each game (social signals)
  const { data: gamesFriendCounts } = useQuery({
    queryKey: ['gamesFriendCounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};

      const { data, error } = await supabase
        .from('games_friend_counts')
        .select('game_id, friends_joined');

      if (error) {
        console.warn('Error fetching follower counts:', error);
        return {};
      }

      // Convert to map for O(1) lookup
      return (data || []).reduce((acc, row) => {
        acc[row.game_id] = row.friends_joined || 0;
        return acc;
      }, {} as Record<string, number>);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get following IDs
  const followingIds = useMemo(() => {
    if (!userFriends) return new Set<string>();
    return new Set(userFriends.map(f => f.id));
  }, [userFriends]);

  // Filter games by following if enabled
  const filteredGames = useMemo(() => {
    return (games || []).filter(game => {
      // Following filter - show games created by people you follow OR with following participants
      if (showFollowingOnly && user) {
        const createdByFollowing = followingIds.has(game.creatorId);
        const hasFollowingParticipants = (gamesFriendCounts?.[game.id] || 0) > 0;

        if (!createdByFollowing && !hasFollowingParticipants) {
          return false;
        }
      }

      return true;
    });
  }, [games, showFollowingOnly, user, followingIds, gamesFriendCounts]);

  return {
    filteredGames,
    gamesFriendCounts,
  };
}

