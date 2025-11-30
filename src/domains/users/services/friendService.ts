import { supabase } from '@/core/database/supabase';

export interface FriendSuggestion {
  id: string;
  display_name: string; // Generated column, always present (from full_name, username, or email)
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  common_games_count: number;
  shared_games: string[];
  is_following?: boolean;
}

export interface FriendConnection {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

/**
 * Get people to follow suggestions using the friend_suggestions view
 * This view uses user_connections table and game_participants for co-play analysis
 * Falls back to showing other active users if no common games are found
 */
export async function getFriendSuggestions(limit: number = 10): Promise<FriendSuggestion[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Use the friend_suggestions view created in the database
    const { data, error } = await supabase
      .from('friend_suggestions')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error querying friend_suggestions view:', error);
      throw error;
    }

    // If we have suggestions from common games, return them
    if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        display_name: row.display_name || row.username || 'User',
        username: row.username,
        avatar_url: row.avatar_url,
        bio: row.bio,
        common_games_count: row.common_games_count || 0,
        shared_games: row.shared_games || [],
        is_following: row.is_following || false
      }));
    }

    // Fallback: If no common games, show other active users
    // First, get users we're already following to exclude them
    const { data: existingConnections } = await supabase
      .from('user_connections')
      .select('following_id')
      .eq('follower_id', user.id)
      .eq('status', 'accepted');

    const followingIds = new Set(existingConnections?.map(c => c.following_id) || []);
    followingIds.add(user.id); // Also exclude self

    // Get distinct user IDs from game participants (active users)
    const { data: activeUsers } = await supabase
      .from('game_participants')
      .select('user_id')
      .limit(limit * 3); // Get more to account for filtering

    // Filter out users we're already following and get unique IDs
    const activeUserIds = [...new Set(
      activeUsers
        ?.map((p: any) => p.user_id)
        .filter((id: string) => !followingIds.has(id)) || []
    )].slice(0, limit);

    // If we have active users, get their details
    if (activeUserIds.length > 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url, bio, email')
        .in('id', activeUserIds);

      if (fallbackError) {
        console.error('Error getting fallback suggestions:', fallbackError);
        return [];
      }

      return (fallbackData || []).map((row: any) => ({
        id: row.id,
        display_name: row.full_name || row.username || row.email?.split('@')[0] || 'User',
        username: row.username,
        avatar_url: row.avatar_url,
        bio: row.bio,
        common_games_count: 0,
        shared_games: [],
        is_following: false
      }));
    }

    // Final fallback: Get any users (excluding self and already following)
    // Build filter to exclude following IDs
    let query = supabase
      .from('users')
      .select('id, full_name, username, avatar_url, bio, email')
      .neq('id', user.id)
      .limit(limit * 2);

    // Apply additional filters for each following ID (Supabase limitation)
    const followingArray = Array.from(followingIds);
    for (let i = 0; i < Math.min(followingArray.length, 10); i++) {
      query = query.neq('id', followingArray[i]);
    }

    const { data: fallbackData, error: fallbackError } = await query;

    if (fallbackError) {
      console.error('Error getting fallback suggestions:', fallbackError);
      return [];
    }

    // Map fallback users to FriendSuggestion format
    return (fallbackData || []).map((row: any) => ({
      id: row.id,
      display_name: row.full_name || row.username || row.email?.split('@')[0] || 'User',
      username: row.username,
      avatar_url: row.avatar_url,
      bio: row.bio,
      common_games_count: 0,
      shared_games: [],
      is_following: false
    }));
  } catch (error) {
    console.error('Error getting friend suggestions:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

/**
 * Get users who have played games together (mutual participants)
 */
export async function getMutualGameUsers(limit: number = 20): Promise<FriendSuggestion[]> {
  return getFriendSuggestions(limit);
}

/**
 * Search for users by name or username
 */
export async function searchUsers(query: string, limit: number = 10): Promise<any[]> {
  try {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, username, avatar_url, bio')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Follow/unfollow a user using the user_connections table
 * Uses the follow_user() database function for atomic operations
 */
export async function followUser(targetUserId: string): Promise<{ success: boolean; action: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (user.id === targetUserId) {
      return {
        success: false,
        action: 'error',
        error: 'Cannot follow yourself'
      };
    }

    // Check if connection already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_connections')
      .select('id, status')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError;
    }

    if (existing) {
      // Unfollow: delete the connection
      const { error: deleteError } = await supabase
        .from('user_connections')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (deleteError) throw deleteError;

      return {
        success: true,
        action: 'unfollowed'
      };
    } else {
      // Follow: create new connection with 'accepted' status (auto-accept for now)
      const { error: insertError } = await supabase
        .from('user_connections')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          status: 'accepted'
        });

      if (insertError) throw insertError;

      return {
        success: true,
        action: 'followed'
      };
    }
  } catch (error) {
    console.error('Error following user:', error);
    return {
      success: false,
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get users you're following from user_connections table
 */
export async function getUserFriends(userId?: string): Promise<FriendSuggestion[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const targetUserId = userId || user.id;

    // Get all accepted connections where user is following or being followed
    // Fetch connections in both directions
    const { data: connections, error } = await supabase
      .from('user_connections')
      .select('follower_id, following_id')
      .or(`follower_id.eq.${targetUserId},following_id.eq.${targetUserId}`)
      .eq('status', 'accepted');

    if (error) throw error;

    if (!connections || connections.length === 0) {
      return [];
    }

    // Extract unique following IDs
    const friendIds = new Set<string>();
    connections.forEach((conn: any) => {
      if (conn.follower_id === targetUserId) {
        friendIds.add(conn.following_id);
      } else {
        friendIds.add(conn.follower_id);
      }
    });

    if (friendIds.size === 0) {
      return [];
    }

    // Fetch user details for all following
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, username, avatar_url, bio')
      .in('id', Array.from(friendIds));

    if (usersError) throw usersError;

    // Map to FriendSuggestion format with follow status
    return (users || []).map((user: any) => {
      // Check if target user is following this friend
      const isFollowing = connections.some(
        (conn: any) => conn.follower_id === targetUserId && conn.following_id === user.id
      );

      return {
        id: user.id,
        display_name: user.display_name,
        username: user.username,
        avatar_url: user.avatar_url,
        bio: user.bio,
        common_games_count: 0,
        shared_games: [],
        is_following: isFollowing
      };
    });
  } catch (error) {
    console.error('Error getting user friends:', error);
    throw error;
  }
}

/**
 * Get users who follow the target user
 */
export async function getUserFollowers(userId?: string): Promise<FriendSuggestion[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const targetUserId = userId || user.id;

    // Get connections where someone follows the target user
    const { data: connections, error } = await supabase
      .from('user_connections')
      .select('follower_id')
      .eq('following_id', targetUserId)
      .eq('status', 'accepted');

    if (error) throw error;
    if (!connections || connections.length === 0) return [];

    const followerIds = connections.map((c: any) => c.follower_id);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, username, avatar_url, bio')
      .in('id', followerIds);

    if (usersError) throw usersError;

    return (users || []).map((u: any) => ({
      id: u.id,
      display_name: u.display_name,
      username: u.username,
      avatar_url: u.avatar_url,
      bio: u.bio,
      common_games_count: 0,
      shared_games: [],
      // Whether current user is following this follower back
      is_following: connections.some((c: any) => c.follower_id === u.id && c.following_id === targetUserId) ? false : false
    }));
  } catch (error) {
    console.error('Error getting user followers:', error);
    throw error;
  }
}

/**
 * Check if current user is following another user
 */
export async function isFollowing(targetUserId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_connections')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .eq('status', 'accepted')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking follow status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

/**
 * Get follower join counts for games using games_friend_counts view
 * Returns a map of game_id -> number of people you follow who joined
 */
export async function getGamesFriendCounts(gameIds: string[]): Promise<Record<string, number>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || gameIds.length === 0) return {};

    const { data, error } = await supabase
      .from('games_friend_counts')
      .select('game_id, friends_joined')
      .in('game_id', gameIds);

    if (error) throw error;

    // Convert array to map
    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      counts[row.game_id] = row.friends_joined || 0;
    });

    return counts;
  } catch (error) {
    console.error('Error getting games friend counts:', error);
    return {};
  }
}
