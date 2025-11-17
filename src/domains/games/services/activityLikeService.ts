import { supabase } from '@/core/database/supabase';

export interface ActivityLike {
  id: string;
  user_id: string;
  activity_id: string;
  created_at: string;
}

export interface ActivityLikeCount {
  activity_id: string;
  like_count: number;
}

/**
 * Service for managing activity likes/kudos
 */
export class ActivityLikeService {
  /**
   * Toggle like on an activity (like if not liked, unlike if already liked)
   */
  static async toggleLike(activityId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('activity_likes')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 results

      // If table doesn't exist, throw helpful error
      if (checkError && checkError.code === '42P01') {
        throw new Error('Activity likes table does not exist. Please run the migration: supabase/migrations/20250123000000_create_activity_likes.sql');
      }

      if (existingLike) {
        // Unlike - delete the like (RLS ensures user can only delete their own)
        const { error: deleteError } = await supabase
          .from('activity_likes')
          .delete()
          .eq('activity_id', activityId);
          // Note: RLS policy automatically filters by auth.uid() for user_id
        
        if (deleteError) throw deleteError;
      } else {
        // Like - insert with activity_id and user_id (RLS will verify user_id matches auth.uid())
        const { error: insertError } = await supabase
          .from('activity_likes')
          .insert({
            activity_id: activityId,
            user_id: user.id,
          });
        
        if (insertError) {
          console.error('Failed to insert like:', insertError);
          throw insertError;
        }
      }

      // Get updated like count (with fallback if view doesn't exist)
      let likeCount = 0;
      try {
        const { data, error } = await supabase
          .from('activity_like_counts')
          .select('like_count')
          .eq('activity_id', activityId)
          .single();

        if (error && error.code === '42P01') {
          // View doesn't exist, count directly
          const { count } = await supabase
            .from('activity_likes')
            .select('*', { count: 'exact', head: true })
            .eq('activity_id', activityId);
          likeCount = count || 0;
        } else {
          likeCount = data?.like_count || 0;
        }
      } catch (error) {
        // Fallback to direct count
        const { count } = await supabase
          .from('activity_likes')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activityId);
        likeCount = count || 0;
      }

      return {
        isLiked: !existingLike,
        likeCount,
      };
    } catch (error: any) {
      // If table doesn't exist, provide helpful error message
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        throw new Error('Activity likes table does not exist. Please run the migration: supabase/migrations/20250123000000_create_activity_likes.sql');
      }
      throw error;
    }
  }

  /**
   * Check if current user has liked an activity
   */
  static async isLiked(activityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Explicitly filter by user_id to check if current user has liked
      const { data, error } = await supabase
        .from('activity_likes')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 results

      // If table doesn't exist (404), return false
      if (error && (error.code === '42P01' || error.code === 'PGRST116')) {
        return false;
      }

      return !!data;
    } catch (error) {
      // If table doesn't exist, return false
      return false;
    }
  }

  /**
   * Get like count for an activity
   */
  static async getLikeCount(activityId: string): Promise<number> {
    try {
      // Try to use the view first
      const { data, error } = await supabase
        .from('activity_like_counts')
        .select('like_count')
        .eq('activity_id', activityId)
        .single();

      if (error && error.code === '42P01') {
        // View doesn't exist yet, fallback to direct count
        const { count } = await supabase
          .from('activity_likes')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activityId);
        return count || 0;
      }

      return data?.like_count || 0;
    } catch (error) {
      // Fallback to direct count if view doesn't exist
      const { count } = await supabase
        .from('activity_likes')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId);
      return count || 0;
    }
  }

  /**
   * Get like counts for multiple activities
   */
  static async getLikeCounts(activityIds: string[]): Promise<Record<string, number>> {
    if (activityIds.length === 0) return {};

    try {
      // Try to use the view first
      const { data, error } = await supabase
        .from('activity_like_counts')
        .select('activity_id, like_count')
        .in('activity_id', activityIds);

      if (error && error.code === '42P01') {
        // View doesn't exist, fallback to direct counts
        const { data: likesData } = await supabase
          .from('activity_likes')
          .select('activity_id')
          .in('activity_id', activityIds);

        const counts: Record<string, number> = {};
        (likesData || []).forEach((like) => {
          counts[like.activity_id] = (counts[like.activity_id] || 0) + 1;
        });
        return counts;
      }

      const counts: Record<string, number> = {};
      (data || []).forEach((item) => {
        counts[item.activity_id] = item.like_count || 0;
      });
      return counts;
    } catch (error) {
      // Fallback to direct counts
      const { data: likesData } = await supabase
        .from('activity_likes')
        .select('activity_id')
        .in('activity_id', activityIds);

      const counts: Record<string, number> = {};
      (likesData || []).forEach((like) => {
        counts[like.activity_id] = (counts[like.activity_id] || 0) + 1;
      });
      return counts;
    }
  }

  /**
   * Get liked status for multiple activities
   */
  static async getLikedStatuses(activityIds: string[]): Promise<Record<string, boolean>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || activityIds.length === 0) {
      return activityIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
    }

    // Explicitly filter by user_id to get only current user's likes
    const { data } = await supabase
      .from('activity_likes')
      .select('activity_id')
      .in('activity_id', activityIds)
      .eq('user_id', user.id);

    const likedIds = new Set((data || []).map((item) => item.activity_id));
    return activityIds.reduce((acc, id) => ({ ...acc, [id]: likedIds.has(id) }), {});
  }
}

