import { supabase, transformGameFromDB, transformUserFromDB, Database } from './supabase';
import type { Game, User, UserPreferences } from '../store/appStore';
import { envConfig } from './envConfig';
import { networkService } from './networkService';

// Types for database operations
type GameRow = Database['public']['Tables']['games']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export class SupabaseService {

  // Authentication methods
  static async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.name,
          username: userData.name?.toLowerCase().replace(/\s+/g, '_'),
        }
      }
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await this.createUserProfile(data.user.id, userData);
    }

    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // User profile methods
  static async createUserProfile(userId: string, userData: any) {
    console.log('Creating/updating user profile with data:', { userId, userData });
    
    try {
      // Get authenticated user
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw error ?? new Error('No user after sign-in');

      // Create or ensure your user row exists
      const { data: profileData, error: upsertError } = await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'New User',
          username: userData.username || `${userData.firstName || 'user'}_${userData.lastName || 'name'}`.toLowerCase().replace(/\s+/g, '_'),
          bio: userData.bio || '',
          avatar_url: userData.avatar || null,
          location: userData.location || '',
          preferred_sports: Array.isArray(userData.selectedSports)
            ? (userData.selectedSports
                .filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0))
            : []
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        console.error('Error upserting profile:', upsertError);
        throw upsertError;
      }

      console.log('Profile created/updated successfully:', profileData);
      
      return profileData;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err;
    }
  }

  // Complete onboarding for a user
  static async completeOnboarding(userId: string) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw error ?? new Error('No user after sign-in');

      // Mark onboarding as completed
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Error completing onboarding:', updateError);
        throw updateError;
      }

      console.log('Onboarding completed successfully:', data);
      return data;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      throw err;
    }
  }

  // Legacy method for backward compatibility
  static async createUserProfileLegacy(userId: string, userData: any) {
    console.log('Creating/updating user profile with data (legacy):', { userId, userData });
    
    try {
      // Ensure we have a valid email (column is NOT NULL + UNIQUE)
      let email: string | null = userData.email || null;
      if (!email) {
        const { data: authUser } = await supabase.auth.getUser();
        email = authUser.user?.email ?? null;
      }
      if (!email) {
        throw new Error('Unable to determine user email for profile creation');
      }
      
      // Ensure userId matches auth.uid() for RLS compatibility
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User must be authenticated to create profile');
      }
      if (userId !== authUser.id) {
        throw new Error(`User ID mismatch: expected ${authUser.id}, got ${userId}`);
      }
      
      // Prepare parameters for the idempotent RPC function
      const profileParams = {
        p_email: email,
        p_username: userData.username || `user_${Math.random().toString(36).substring(2, 10)}`,
        p_full_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'New User',
        p_avatar_url: userData.avatar || null,
        p_bio: userData.bio || '',
        p_location: userData.location || '',
        p_preferred_sports: Array.isArray(userData.selectedSports)
          ? (userData.selectedSports
              .filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0))
          : []
      };
      
      console.log('Calling ensure_user_profile RPC with params:', profileParams);
      
      // Use the idempotent RPC function (prevents race conditions)
      // The RPC function will use auth.uid() internally, ensuring ID consistency
      const { data, error } = await supabase
        .rpc('ensure_user_profile', {
          p_email: profileParams.p_email,
          p_username: profileParams.p_username,
          p_full_name: profileParams.p_full_name,
          p_avatar_url: profileParams.p_avatar_url,
        });
      
      if (error) {
        console.error('Error creating profile via RPC:', error);
        throw error;
      }
      
      console.log('Profile created/updated successfully via RPC:', data);
      
      // If onboarding_completed is provided, update it separately
      if (userData.onboarding_completed !== undefined) {
        console.log('Updating onboarding_completed field:', userData.onboarding_completed);
        const { error: updateError } = await supabase
          .from('users')
          .update({ onboarding_completed: userData.onboarding_completed })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating onboarding_completed:', updateError);
        } else {
          console.log('Successfully updated onboarding_completed field');
        }
      }
      
      return data;
      
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('🔍 [getUserProfile] Fetching profile for userId:', userId);
      
      // Verify authenticated session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ [getUserProfile] No authenticated session:', sessionError);
        return null;
      }

      // Check if this is the current user's own profile (to access private fields)
      const currentUserId = session.user.id;
      if (userId === currentUserId) {
        // For own profile, read from public.users with id filter for private fields
        console.log('🔍 [getUserProfile] Fetching own profile from users table');
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url, bio, location')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('❌ [getUserProfile] Error fetching own profile:', error);
          throw error;
        }

        if (!data) {
          console.log('ℹ️ [getUserProfile] Own profile not found');
          return null;
        }

        // Transform to User format
        const user: User = {
          id: data.id,
          name: data.full_name || data.username || 'User',
          username: data.username || '',
          email: '', // Get from auth metadata if needed
          avatar: data.avatar_url || '',
          bio: data.bio || '',
          location: data.location || '',
          role: 'user' as const,
          preferences: {
            theme: 'auto' as const,
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            colorBlindFriendly: false,
            notifications: {
              push: true,
              email: false,
              gameReminders: true,
            },
            privacy: {
              locationSharing: true,
              profileVisibility: 'public' as const,
            },
            sports: [],
          },
        };

        console.log('✅ [getUserProfile] Own profile found');
        return user;
      } else {
        // For other users, fetch from users table
        return await this.getOtherUserProfile(userId);
      }
    } catch (err: any) {
      console.error('❌ [getUserProfile] Exception:', err);
      
      // Re-throw auth errors
      if (err?.isAuthError) {
        throw err;
      }
      
      return null;
    }
  }

  static async getOtherUserProfile(userId: string): Promise<User | null> {
    try {
      if (!userId) {
        console.log('ℹ️ No userId provided');
        return null;
      }

      // Verify authenticated session before querying (required for RLS)
      // The Supabase client automatically includes JWT from localStorage in Authorization header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ [getOtherUserProfile] No authenticated session:', sessionError);
        console.error('❌ [getOtherUserProfile] Ensure user is logged in before fetching profiles');
        return null;
      }
      console.log('✅ [getOtherUserProfile] Authenticated session confirmed, user:', session.user.id);
      console.log('✅ [getOtherUserProfile] JWT will be automatically included in query headers');

      console.log('🔍 [getOtherUserProfile] Fetching profile for userId:', userId);

      // Use users table directly
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, username, bio, location')
        .eq('id', userId)
        .maybeSingle();

      // Handle errors specifically
      if (error) {
        // Check for auth/permission errors (401/403 or specific codes)
        const isAuthError = 
          error.code === 'PGRST301' ||  // Permission denied
          error.code === '42501' ||      // Insufficient privilege
          error.status === 401 ||
          error.status === 403 ||
          error.message?.includes('permission') ||
          error.message?.includes('RLS') ||
          error.message?.includes('JWT');

        console.error('❌ [getOtherUserProfile] Query error:', {
          userId,
          errorCode: error.code,
          errorStatus: error.status,
          errorMessage: error.message,
          isAuthError
        });

        // Return null but we'll handle the error type in the component
        // Store error info in a way that can be checked
        throw {
          ...error,
          isAuthError,
          isNotFound: false // Explicitly not a "not found" - it's an error
        };
      }

      // No error but no data = not found
      if (!data) {
        console.log('ℹ️ [getOtherUserProfile] User not found (no data returned, no error)');
        return null;
      }

      // Transform data to User format with computed display_name
      const displayName = data.full_name?.trim() || data.username?.trim() || 'Player';
      const user: User = {
        id: data.id,
        name: displayName,
        username: data.username || '',
        email: '', // Not available in public view
        avatar: data.avatar_url || '',
        bio: data.bio || '',
        location: data.location || '',
        role: 'user' as const,
        preferences: {
          theme: 'auto' as const,
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          colorBlindFriendly: false,
          notifications: {
            push: true,
            email: false,
            gameReminders: true,
          },
          privacy: {
            locationSharing: true,
            profileVisibility: 'public' as const,
          },
          sports: [],
        },
      };

      console.log('✅ [getOtherUserProfile] Profile found:', { id: user.id, name: user.name });
      return user;
    } catch (err: any) {
      console.error('❌ [getOtherUserProfile] Exception:', err);
      
      // Re-throw auth errors so they can be handled differently from "not found"
      if (err?.isAuthError) {
        throw err; // Let the component handle this as an auth error
      }
      
      // For other errors, return null (treated as "not found" in component)
      return null;
    }
  }

  // Username availability check (optionally exclude current user)
  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const q = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .ilike('username', username);
    const { count, error } = excludeUserId
      ? await q.neq('id', excludeUserId)
      : await q;
    if (error) throw error;
    return (count ?? 0) === 0;
  }

  // Upload avatar to Supabase Storage 'avatars' bucket and return public URL
  static async uploadAvatar(file: File): Promise<string> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const fileName = `${Date.now()}_${file.name}`.replace(/\s+/g, '_');
    const path = `${currentUser.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }

  static async updateUserProfile(userId: string, updates: any) {
    console.log('🔧 updateUserProfile called with:', { userId, updates });
    
    // Build update object matching the actual database schema
    const updateData: any = {};
    
    // Only include fields that are provided and exist in the database
    if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.preferred_sports !== undefined) updateData.preferred_sports = updates.preferred_sports;
    if (updates.sports_preferences !== undefined) updateData.preferred_sports = updates.sports_preferences;
    if (updates.onboarding_completed !== undefined) updateData.onboarding_completed = updates.onboarding_completed;

    // Only include role if it's provided and the column exists
    if (updates.role) {
      updateData.role = updates.role;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
    
    console.log('✅ Profile updated successfully:', data);
    return transformUserFromDB(data);
  }

  static async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return !!(profile && profile.name && profile.username);
    } catch (error) {
      return false;
    }
  }

  // Admin functionality
  static async hasAdminRole(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) return false;
      return data.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  static async hasModeratorRole(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) return false;
      return data.role === 'moderator' || data.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  static async updateUserRole(userId: string, role: 'user' | 'moderator' | 'admin'): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const isAdmin = await this.hasAdminRole(currentUser.id);
    if (!isAdmin) throw new Error('Only admins can update user roles');

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;

    // Log admin action
    await this.logAdminAction('update_user_role', 'user', userId, { role });
  }

  static async deleteGame(gameId: string, reason?: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    // Get game details and check permissions
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('creator_id, date, time, title')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    const isCreator = game.creator_id === currentUser.id;
    const isModerator = await this.hasModeratorRole(currentUser.id);
    
    if (!isCreator && !isModerator) {
      throw new Error('Only game creators, moderators, or admins can delete games');
    }

    // Check time restrictions for regular creators (admins/moderators can override)
    if (isCreator && !isModerator) {
      const gameDateTime = new Date(`${game.date}T${game.time}`);
      const now = new Date();
      const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const restrictionHours = envConfig.get('gameDeletionRestrictionHours');
      
      if (hoursUntilGame < restrictionHours) {
        throw new Error(`Cannot delete game within ${restrictionHours} hours of start time`);
      }
    }

    // Notify participants before deletion
    await this.notifyGameParticipants(gameId, 'game_cancelled', {
      title: 'Game Cancelled',
      message: `The game "${game.title}" has been cancelled${reason ? `: ${reason}` : '.'}`
    });

    // Delete game participants first
    await supabase
      .from('game_participants')
      .delete()
      .eq('game_id', gameId);

    // Delete chat messages
    await supabase
      .from('chat_messages')
      .delete()
      .eq('game_id', gameId);

    // Delete the game
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId);

    if (error) throw error;

    // Log admin action if done by moderator/admin
    if (isModerator && !isCreator) {
      await this.logAdminAction('delete_game', 'game', gameId, { 
        reason: reason || 'admin_deletion',
        game_title: game.title 
      });
    }
  }

  static async getAllUsers(): Promise<User[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const isAdmin = await this.hasAdminRole(currentUser.id);
    if (!isAdmin) throw new Error('Only admins can view all users');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(transformUserFromDB);
  }

  static async logAdminAction(action: string, targetType: string, targetId?: string, details?: any): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return;

    const { error } = await supabase.rpc('log_admin_action', {
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_details: details
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  static async getAdminAuditLog(limit = 50): Promise<any[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const isAdmin = await this.hasAdminRole(currentUser.id);
    if (!isAdmin) throw new Error('Only admins can view audit logs');

    const { data, error } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:admin_id(full_name, username, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Mock data for immediate fallback
  private static getMockGames(): Game[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
      {
        id: 'mock-1',
        title: 'Basketball Pickup Game',
        sport: 'basketball',
        date: today.toISOString().split('T')[0],
        time: '18:00',
        duration: 90,
        location: 'Local Community Center',
        cost: 'Free',
        maxPlayers: 10,
        totalPlayers: 6,
        availableSpots: 4,
        description: 'Casual pickup basketball game. All skill levels welcome!',
        imageUrl: '',
        sportColor: '#FA4616',
        isJoined: false,
        createdBy: 'mock-user',
        createdAt: today.toISOString()
      },
      {
        id: 'mock-2',
        title: 'Soccer Match',
        sport: 'soccer',
        date: tomorrow.toISOString().split('T')[0],
        time: '19:30',
        duration: 120,
        location: 'City Park Field',
        cost: '$5',
        maxPlayers: 22,
        totalPlayers: 18,
        availableSpots: 4,
        description: 'Friendly soccer match. Bring your own water!',
        imageUrl: '',
        sportColor: '#22C55E',
        isJoined: false,
        createdBy: 'mock-user',
        createdAt: today.toISOString()
      }
    ];
  }

  // Games methods - Two-step fetch with proper user mapping
  static async getGames(): Promise<Game[]> {
    const startTime = performance.now();
    console.log('🚀 Starting getGames with two-step fetch...');
    console.log('🔍 Network status:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
    
    try {
      // Get current user for isJoined calculation
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      console.log(`🔍 Getting games for user: ${userId || 'anonymous'}`);
      
      // Fetch games with creator_profile relationship from users table
      // Use games_with_counts view for optimized current_players count
      const queryStart = performance.now();
      const { data: gamesData, error: gamesError } = await supabase
        .from('games_with_counts')
        .select(`
          id, title, sport, description, location, latitude, longitude, date, time, cost, image_url, 
          max_players, creator_id, created_at, duration,
          total_players, available_spots, current_players, public_rsvp_count,
          creator_profile(id, full_name, username, avatar_url)
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(50);
        
      if (gamesError) {
        console.error('❌ Games query failed:', gamesError);
        return [];
      }
      
      const queryTime = performance.now() - queryStart;
      console.log(`📊 Query time: ${queryTime.toFixed(2)}ms, fetched ${gamesData?.length || 0} games`);
      
      // Step 2: Fetch participants separately (can't do nested select on views)
      let participantsByGame = new Set<string>();
      if (userId && gamesData && gamesData.length > 0) {
        const gameIds = gamesData.map((g: any) => g.id);
        const { data: participants } = await supabase
          .from('game_participants')
          .select('game_id') // Only need game_id since we filter by user_id
          .in('game_id', gameIds)
          .eq('status', 'joined')
          .eq('user_id', userId); // Only fetch current user's participation
        
        if (participants) {
          participants.forEach((p: any) => {
            participantsByGame.add(p.game_id);
          });
        }
      }
      
      // Transform games with creator_profile from the relationship
      const games = (gamesData || []).map((game: any) => {
        const isJoined = participantsByGame.has(game.id);
        const creator = game.creator_profile || null;
        
        // Enhanced game object with proper creator data
        const enhancedGame = {
          ...game,
          creator: creator
        };
        
        console.log(`🎯 Game "${game.title}" creator:`, {
          creator_id: game.creator_id,
          creator_found: !!creator,
          creator_name: creator?.full_name || creator?.username || 'Not found'
        });
        
        return transformGameFromDB(enhancedGame, isJoined);
      });
      
      const totalTime = performance.now() - startTime;
      console.log(`✅ getGames completed: ${totalTime.toFixed(2)}ms`);
      console.log(`📦 Returned ${games.length} games`);
      
      return games;
      
    } catch (error) {
      console.error('❌ getGames error:', error);
      
      // Check if it's a timeout or session error
      if (error.message?.includes('timeout')) {
        console.error('🚨 Query timed out - likely session corruption or RLS issues');
        console.error('🚨 Try refreshing the page or clearing localStorage');
      } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        console.error('🚨 Authentication error - clearing session');
        try {
          await supabase.auth.signOut();
          localStorage.clear();
        } catch (clearError) {
          console.error('Failed to clear session:', clearError);
        }
      }
      
      // Fallback to simple anonymous query if complex query fails
      console.log('🔄 Falling back to simple anonymous query...');
      try {
        const { data: gamesData, error: fallbackError } = await supabase
          .from('games_with_counts')
          .select('id, title, location, date, time, max_players, creator_id, sport, cost, description, image_url, latitude, longitude, created_at, duration, total_players, available_spots, current_players, public_rsvp_count')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);
          
        if (fallbackError) throw fallbackError;
        
        // Transform to basic game objects without isJoined calculation
        const games = (gamesData || []).map((game: any) => ({
          id: game.id,
          title: game.title,
          sport: game.sport,
          date: game.date,
          time: game.time,
          location: game.location,
          latitude: game.latitude,
          longitude: game.longitude,
          cost: game.cost,
          maxPlayers: game.max_players,
          totalPlayers: game.total_players || 0,
          availableSpots: game.available_spots || 0,
          description: game.description,
          imageUrl: game.image_url || '',
          sportColor: '#6B7280',
          isJoined: false, // Always false for anonymous fallback
          createdBy: `Unknown User (${game.creator_id?.slice(0, 8) || 'No ID'})`,
          creatorId: game.creator_id,
          creatorData: {
            id: game.creator_id,
            name: `Unknown User (${game.creator_id?.slice(0, 8) || 'No ID'})`,
            avatar: ''
          },
          createdAt: game.created_at,
        }));
        
        console.log(`📦 Fallback returned ${games.length} games`);
        return games;
        
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        
        // Return mock games as final fallback
        console.log('📦 Returning mock games as final fallback');
        return this.getMockGames();
      }
    }
  }

  static async getMyGames(userId: string): Promise<Game[]> {
    // Fetch games with creator_profile relationship from users table
    // Use games_with_counts view for optimized current_players count
    const { data: gamesData, error } = await supabase
      .from('games_with_counts')
      .select(`
        id, title, sport, description, location, latitude, longitude, date, time, cost, image_url, 
        max_players, creator_id, created_at, duration,
        total_players, available_spots, current_players, public_rsvp_count,
        creator_profile(id, full_name, username, avatar_url)
      `)
      .eq('creator_id', userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Transform games with creator_profile from the relationship
    const data = (gamesData || []).map((game: any) => ({
      ...game,
      creator: game.creator_profile || null
    }));

    return data.map(game => transformGameFromDB(game, true));
  }

  static async getNearbyGames(latitude?: number, longitude?: number, radius: number = 25): Promise<Game[]> {
    try {
      // Get current user directly without caching
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let query = supabase
        .from('games_with_counts')
        .select(`
          id,
          title,
          sport,
          date,
          time,
          location,
          cost,
          max_players,
          current_players,
          public_rsvp_count,
          total_players,
          available_spots,
          description,
          image_url,
          creator_id,
          creator_profile(id, full_name, username, avatar_url)
        `);

      // Default to future games only unless specific date range is provided
      if (!latitude && !longitude) {
        query = query.gte('date', new Date().toISOString().split('T')[0]);
      }

      if (latitude && longitude) {
        query = query
          .filter('latitude', 'gte', latitude - 0.1)
          .filter('latitude', 'lte', latitude + 0.1)
          .filter('longitude', 'gte', longitude - 0.1)
          .filter('longitude', 'lte', longitude + 0.1);
      }

      // If no user, return games without join status
      if (!userId) {
        const { data: gamesData, error } = await query.order('date', { ascending: true }).limit(50);
        if (error) throw error;
        return (gamesData || []).map((game: any) => {
          const gameWithCreator = {
            ...game,
            creator: game.creator_profile || null
          };
          return transformGameFromDB(gameWithCreator, false);
        });
      }

      // For authenticated users, include participants
      const { data: gamesWithParticipants, error } = await query
        .select(`
          *,
          game_participants(user_id, status)
        `)
        .order('date', { ascending: true })
        .limit(50);

      if (error) throw error;

      return (gamesWithParticipants || []).map((game: any) => {
        const isJoined = userId && game.game_participants?.some((p: any) => 
          p.user_id === userId && p.status === 'joined'
        ) || false;
        const gameWithCreator = {
          ...game,
          creator: game.creator_profile || null
        };
        console.log(`🎯 Game ${game.id} isJoined check:`, {
          userId,
          participants: game.game_participants?.map((p: any) => p.user_id),
          isJoined
        });
        return transformGameFromDB(gameWithCreator, isJoined);
      });
    } catch (error) {
      console.error('[SupabaseService.getNearbyGames] Error:', error);
      return this.getGames(); // Fallback to regular games
    }
  }

  // Narrow input for creating a game from the form
  static async createGame(gameData: {
    title: string;
    sport: string;
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    date: string;
    time: string;
    duration: number;
    cost: string;
    maxPlayers: number;
    description: string;
    imageUrl?: string;
  }): Promise<string> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Ensure a corresponding row exists in public.users for FK (creator_id) and RLS policies
    try {
      const { data: existingUser, error: fetchUserErr } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!existingUser) {
        // Build a minimal profile using auth metadata
        const { data: authUser } = await supabase.auth.getUser();
        const email = authUser.user?.email || '';
        if (!email) {
          throw new Error('Cannot create user profile: missing email from auth');
        }
        const profileData = {
          id: currentUser.id,
          email,
          full_name: authUser.user?.user_metadata?.full_name || authUser.user?.user_metadata?.name || 'New User',
          username: authUser.user?.user_metadata?.username || `user_${Math.random().toString(36).slice(2, 10)}`,
          bio: '',
          location: '',
          preferred_sports: [] as string[],
        };
        const { error: upsertErr } = await supabase.from('users').upsert(profileData, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
      } else if (fetchUserErr && fetchUserErr.code !== 'PGRST116') {
        throw fetchUserErr;
      }
    } catch (e) {
      console.warn('Failed to ensure user profile exists (continuing):', e);
    }

    // Create the game
    const { data, error } = await supabase
      .from('games')
      .insert([{
        title: gameData.title,
        sport: gameData.sport,
        date: gameData.date,
        time: gameData.time,
        location: gameData.location,
        latitude: gameData.latitude,
        longitude: gameData.longitude,
        cost: gameData.cost,
        max_players: gameData.maxPlayers,
        current_players: 1, // Creator is automatically a participant
        description: gameData.description,
        image_url: gameData.imageUrl,
        creator_id: currentUser.id,
        duration: gameData.duration || 60,
        planned_route: (gameData as any).plannedRoute || null,
      }])
      .select()
      .single();

    if (error) throw error;

    // Add creator as participant
    try {
      await supabase
        .from('game_participants')
        .insert({
          game_id: data.id,
          user_id: currentUser.id
        });
    } catch (e) {
      console.warn('Failed to add creator as participant (continuing):', e);
    }

    return data.id;
  }

  static async updateGame(gameId: string, updates: Partial<{
    title: string;
    sport: string;
    description: string;
    date: string;
    time: string;
    duration: number;
    location: string;
    latitude: number | null;
    longitude: number | null;
    maxPlayers: number;
    cost: string;
    imageUrl: string;
  }>): Promise<Game> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // First check if user is the creator
    const { data: gameData, error: fetchError } = await supabase
      .from('games')
      .select('creator_id, date, time')
      .eq('id', gameId)
      .single();

    if (fetchError) throw fetchError;
    if (gameData.creator_id !== currentUser.id) {
      throw new Error('Only the game creator can edit this game');
    }

    // Check time restrictions (configurable edit restriction)
    const gameDateTime = new Date(`${gameData.date}T${gameData.time}`);
    const now = new Date();
    const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const restrictionHours = envConfig.get('gameEditRestrictionHours');
    
    if (hoursUntilGame < restrictionHours) {
      throw new Error(`Cannot edit game within ${restrictionHours} hours of start time`);
    }

    // Parse cost if provided
    let cost: number | undefined = undefined;
    if (updates.cost !== undefined) {
      if (updates.cost === 'FREE') {
        cost = 0;
      } else {
        const costMatch = updates.cost.match(/\$(\d+)/);
        cost = costMatch ? parseInt(costMatch[1]) : 0;
      }
    }

    // Prepare update object
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.sport !== undefined) updateData.sport = updates.sport;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.maxPlayers !== undefined) updateData.max_players = updates.maxPlayers;
    if (cost !== undefined) updateData.cost = cost;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
      .select()
      .single();

    if (error) throw error;

    // Notify participants of changes
    await this.notifyGameParticipants(gameId, 'game_updated', {
      title: 'Game Updated',
      message: `The game "${data.title}" has been updated by the organizer.`
    });

    return transformGameFromDB(data, false);
  }


  private static async notifyGameParticipants(gameId: string, type: string, notification: { title: string; message: string }): Promise<void> {
    try {
      // Get all participants
      const { data: participants, error } = await supabase
        .from('game_participants')
        .select('user_id')
        .eq('game_id', gameId);

      if (error || !participants) return;

      // Create notifications for each participant
      const notifications = participants.map(p => ({
        user_id: p.user_id,
        type,
        title: notification.title,
        message: notification.message,
        data: { gameId },
        read: false
      }));

      if (notifications.length > 0) {
        await supabase
          .from('notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying participants:', error);
      // Don't throw - notification failure shouldn't block game operations
    }
  }

  static async joinGame(gameId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      console.error('❌ joinGame: User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log(`🔧 User ${currentUser.id} joining game ${gameId}`);
    console.log(`🔧 Current user details:`, {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name
    });

    // Use the database function
    const { error } = await supabase.rpc('join_game', {
      game_uuid: gameId
    });

    if (error) {
      console.error('❌ Join game RPC error:', error);
      throw error;
    }

    console.log('✅ Successfully joined game via RPC');

    // Record participation for stats tracking (only if table exists)
    try {
      await SupabaseService.recordGameParticipation(currentUser.id, gameId, 'joined');
      console.log('✅ Game participation recorded');
    } catch (participationError: any) {
      // Only log if it's not a missing column error (which is expected during migration)
      if (!participationError?.message?.includes("Could not find the 'status' column") &&
          !participationError?.message?.includes("column \"status\" of relation \"game_participants\" does not exist")) {
        console.warn('⚠️ Failed to record game participation:', participationError);
      }
      // Don't throw here as the main join operation succeeded
    }
  }

  static async leaveGame(gameId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    console.log(`🔧 User ${currentUser.id} leaving game ${gameId}`);

    // Use the database function
    const { error } = await supabase.rpc('leave_game', {
      game_uuid: gameId
    });

    if (error) {
      console.error('❌ Leave game RPC error:', error);
      throw error;
    }

    console.log('✅ Successfully left game via RPC');

    // Record participation for stats tracking (only if table exists)
    try {
      await SupabaseService.recordGameParticipation(currentUser.id, gameId, 'left');
      console.log('✅ Game participation recorded');
    } catch (participationError: any) {
      // Only log if it's not a missing column error (which is expected during migration)
      if (!participationError?.message?.includes("Could not find the 'status' column") &&
          !participationError?.message?.includes("column \"status\" of relation \"game_participants\" does not exist")) {
        console.warn('⚠️ Failed to record game participation:', participationError);
      }
      // Don't throw here as the main leave operation succeeded
    }
  }

  // Public RSVP methods
  static async getPublicRSVPs(gameId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('public_rsvps_public')
      .select('game_id,name_initial,created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createPublicRSVP(gameId: string, rsvpData: { name: string; email: string; phone?: string; message?: string }): Promise<any> {
    // Delegate to Edge Function to handle validation/capacity/duplicates
    const { data, error } = await supabase.functions.invoke('rsvp_public', {
      body: {
        game_id: gameId,
        name: rsvpData.name,
        email: rsvpData.email,
        phone: rsvpData.phone || undefined,
        message: rsvpData.message || undefined,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data?.message || data?.error);
    return data;
  }

  static async getGameById(gameId: string): Promise<any> {
    console.log('🔍 [getGameById] Starting optimized fetch for game:', gameId);
    const startTime = performance.now();
    
    try {
      // BYPASS HANGING AUTH - Use cached session instead
      let userId: string | undefined;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id;
        console.log('✅ [getGameById] Session from cache:', userId ? 'authenticated' : 'anonymous');
      } catch (authError) {
        console.warn('⚠️ [getGameById] Auth failed, continuing as anonymous:', authError);
        userId = undefined;
      }
      
      // OPTIMIZED APPROACH: Use simpler, faster queries
      if (userId) {
        console.log('🔍 [getGameById] Fetching for authenticated user:', userId);
        
        // Step 1: Get basic game data with creator_profile relationship from users table
        // Use games_with_counts view for optimized current_players count
        const { data: gameData, error: gameError } = await supabase
          .from('games_with_counts')
          .select(`
            *,
            planned_route,
            duration,
            creator_profile(id, full_name, username, avatar_url)
          `)
          .eq('id', gameId)
          .single();

        if (gameError) {
          console.error('❌ [getGameById] Game query error:', gameError);
          throw gameError;
        }
        
        // Step 2: Check if user joined (separate fast query)
        const { data: participantData } = await supabase
          .from('game_participants')
          .select('user_id')
          .eq('game_id', gameId)
          .eq('user_id', userId)
          .maybeSingle();
          
        const isJoined = !!participantData;
        
        // Creator info is already included via creator_profile relationship
        const result = transformGameFromDB({
          ...gameData,
          creator: gameData.creator_profile || null
        }, isJoined);
        
        const duration = performance.now() - startTime;
        console.log('✅ [getGameById] Success for authenticated user:', {
          gameId,
          duration: `${duration.toFixed(2)}ms`,
          isJoined
        });
        
        return result;
      } else {
        console.log('🔍 [getGameById] Fetching for anonymous user');
        
        // For anonymous users: query with creator_profile relationship from users table
        // Use games_with_counts view for optimized current_players count
        const { data: gameData, error: gameError } = await supabase
          .from('games_with_counts')
          .select(`
            *,
            planned_route,
            duration,
            creator_profile(id, full_name, username, avatar_url)
          `)
          .eq('id', gameId)
          .single();

        if (gameError) {
          console.error('❌ [getGameById] Game query error:', gameError);
          throw gameError;
        }
        
        if (gameData.creator_id && !gameData.creator_profile) {
          console.warn(`⚠️ [getGameById] Creator ${gameData.creator_id} not found in users table`);
        } else if (gameData.creator_profile) {
          const displayName = gameData.creator_profile.full_name?.trim() || gameData.creator_profile.username?.trim() || 'Host';
          console.log(`✅ [getGameById] Creator found:`, { id: gameData.creator_profile.id, name: displayName });
        }
        
        const result = transformGameFromDB({
          ...gameData,
          creator: gameData.creator_profile || null
        }, false);
        
        const duration = performance.now() - startTime;
        console.log('✅ [getGameById] Success for anonymous user:', {
          gameId,
          duration: `${duration.toFixed(2)}ms`
        });
        
        return result;
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error('❌ [getGameById] Failed:', {
        gameId,
        error: error.message,
        duration: `${duration.toFixed(2)}ms`
      });
      throw error;
    }
  }

  // Notifications methods
  static async getNotifications(): Promise<any[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    console.log('📬 Fetching notifications for user:', currentUser.id);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      console.log('🔄 Returning empty array due to error (table might not exist)');
      return [];
    }

    console.log('📬 Fetched notifications from database:', data?.length || 0);

    return data.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: new Date(notification.created_at),
      read: notification.read,
      actionUrl: notification.data?.actionUrl,
      gameId: notification.data?.gameId,
      userId: notification.data?.userId,
      data: notification.data
    }));
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  static async clearAllNotifications(): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    console.log('🗑️ Attempting to delete notifications for user:', currentUser.id);

    const { data, error, count } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUser.id)
      .select();

    console.log('🗑️ Delete result:', { data, error, count });

    if (error) {
      console.error('❌ Database error during delete:', error);
      throw error;
    }

    console.log('✅ Successfully deleted notifications:', data?.length || 0);
  }

  static async getGameParticipants(gameId: string): Promise<any[]> {
    console.log('🔍 [getGameParticipants] Starting optimized fetch for game:', gameId);
    const startTime = performance.now();
    
    try {
      // Fetch authenticated participants
      const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select('user_id, joined_at')
        .eq('game_id', gameId)
        .eq('status', 'joined');

      if (participantsError) throw participantsError;

      console.log('🔍 Raw authenticated participants:', participants);

      // Fetch public RSVPs (guest users)
      const { data: publicRsvps, error: rsvpsError } = await supabase
        .from('public_rsvps')
        .select('id, name, email, created_at, attending')
        .eq('game_id', gameId)
        .eq('attending', true);

      if (rsvpsError) {
        console.error('⚠️ Error fetching public RSVPs:', rsvpsError);
      }

      console.log('🔍 Raw public RSVPs:', publicRsvps);

      const allParticipants: any[] = [];

      // Process authenticated participants
      if (participants && participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        
        console.log('🔍 Fetching user details for IDs:', userIds);
        
        // Fetch user details from users table
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);
        
        console.log('👤 Users query result:', { users, error: usersError, count: users?.length });

        // Handle case where RLS blocks or users don't exist
        const usersMap = new Map();
        if (users && !usersError) {
          users.forEach(u => usersMap.set(u.id, u));
        }

        // Add authenticated participants
        participants.forEach(participant => {
          const user = usersMap.get(participant.user_id);
          
          let name = 'Player';
          if (user) {
            name = user.full_name?.trim() || user.username?.trim() || 'Player';
          } else {
            name = `Player ${participant.user_id.slice(0, 6)}`;
          }
          
          allParticipants.push({
            id: participant.user_id,
            name: name.trim() || 'Player',
            avatar: user?.avatar_url || null,
            isHost: false, // We'll determine this separately
            isGuest: false,
            rating: 4.5,
            joinedAt: participant.joined_at
          });
        });
      }

      // Add public RSVPs (guests)
      if (publicRsvps && publicRsvps.length > 0) {
        publicRsvps.forEach(rsvp => {
          allParticipants.push({
            id: `guest-${rsvp.id}`, // Prefix with 'guest-' to avoid conflicts
            name: rsvp.name,
            avatar: null, // Guests don't have avatars
            isHost: false,
            isGuest: true,
            rating: null,
            joinedAt: rsvp.created_at
          });
        });
      }

      // Sort by join date (earliest first)
      allParticipants.sort((a, b) => 
        new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      );

      const duration = performance.now() - startTime;
      console.log(`✅ [getGameParticipants] Fetched ${allParticipants.length} total (${participants?.length || 0} authenticated + ${publicRsvps?.length || 0} guests) in ${duration.toFixed(2)}ms`);
      
      return allParticipants;
    } catch (error) {
      console.error('❌ getGameParticipants failed:', error);
      return [];
    }
  }

  // Development helper to create test users
  static async createTestUser(userData: {
    id?: string;
    full_name: string;
    username: string;
    email: string;
    bio?: string;
    location?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: userData.id || crypto.randomUUID(),
          full_name: userData.full_name,
          username: userData.username,
          email: userData.email,
          bio: userData.bio || '',
          location: userData.location || '',
          role: 'user',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Test user created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create test user:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  static subscribeToGameUpdates(gameId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `game_id=eq.${gameId}`
      }, callback)
      .subscribe();
  }

  static subscribeToChatMessages(gameId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat:${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `game_id=eq.${gameId}`
      }, callback)
      .subscribe();
  }

  static subscribeToNotifications(callback: (notification: any) => void) {
    // Temporarily disabled to prevent WebSocket connection failures
    console.log('Realtime notifications disabled to prevent WebSocket failures');
    return { unsubscribe: () => {} };
  }

  static subscribeToAllGames(callback: (payload: any) => void) {
    // Temporarily disabled to prevent WebSocket connection failures
    console.log('Realtime subscriptions disabled to prevent WebSocket failures');
    return { unsubscribe: () => {} };
  }

  static subscribeToPublicRSVPs(gameId: string, callback: (payload: any) => void) {
    // Temporarily disabled to prevent WebSocket connection failures
    console.log('Realtime subscriptions disabled to prevent WebSocket failures');
    return { unsubscribe: () => {} };
  }

  // Utility methods
  static async searchGames(filters: {
    sports?: string[];
    dateRange?: { start: Date | null; end: Date | null };
    distance?: number;
    priceRange?: { min: number; max: number };
  }): Promise<Game[]> {
    try {
      // Get current user directly without caching
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Use games_with_counts view for optimized current_players count
      let query = supabase
        .from('games_with_counts')
        .select('id,title,sport,date,time,location,cost,max_players,description,image_url,creator_id,created_at,total_players,available_spots')
;

      // Default to future games only unless specific date range is provided
      if (!filters.dateRange?.start) {
        query = query.gte('date', new Date().toISOString().split('T')[0]);
      }

      if (filters.sports && filters.sports.length > 0) {
        query = query.in('sport', filters.sports);
      }
      if (filters.dateRange?.start) {
        query = query.gte('date', filters.dateRange.start.toISOString().split('T')[0]);
      }
      if (filters.dateRange?.end) {
        query = query.lte('date', filters.dateRange.end.toISOString().split('T')[0]);
      }

      // If no user, return games without join status
      if (!userId) {
        const { data: gamesData, error } = await query.order('date', { ascending: true }).limit(50);
        if (error) throw error;
        return (gamesData || []).map((game: any) => transformGameFromDB(game, false));
      }

      // For authenticated users, use optimized join query (includes public_rsvp_count from earlier select)
      const { data: gamesWithParticipants, error } = await query
        .select(`
          *,
          game_participants(user_id, status)
        `)
        .order('date', { ascending: true })
        .limit(50);

      if (error) throw error;

      return (gamesWithParticipants || []).map((game: any) => {
        const isJoined = game.game_participants?.some((p: any) => 
          p.user_id === userId && p.status === 'joined'
        ) || false;
        return transformGameFromDB(game, isJoined);
      });
    } catch (error) {
      console.error('[SupabaseService.searchGames] Error:', error);
      return [];
    }
  }

  // Recommended games - Optimized for Pro tier
  static async getRecommendedGames(preferredOverride?: string[]): Promise<Game[]> {
    const timeLabel = `SupabaseService.getRecommendedGames ${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    console.time?.(timeLabel);
    
    try {
      // Use override sports if provided, otherwise get user preferences
      let preferred: string[];
      if (Array.isArray(preferredOverride) && preferredOverride.length > 0) {
        preferred = preferredOverride.filter((s): s is string => typeof s === 'string' && s.length > 0);
      } else {
        // Try to get user preferences from database
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        if (!userId) {
          console.timeEnd?.(timeLabel);
          return this.getGames();
        }

        const { data: userRow } = await supabase
          .from('users')
          .select('preferred_sports')
          .eq('id', userId)
          .single();
          
        preferred = ((userRow?.preferred_sports ?? []) as (string | null)[])
          .filter((s): s is string => typeof s === 'string' && s.length > 0);
      }
      
      if (!preferred.length) {
        console.timeEnd?.(timeLabel);
        return this.getGames();
      }

      // Get session for join status
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Optimized query with join for Pro tier
      // Use games_with_counts view for optimized current_players count
      if (userId) {
        const { data: gamesWithParticipants, error } = await supabase
          .from('games_with_counts')
          .select(`
            id,title,sport,date,time,location,cost,max_players,description,image_url,creator_id,created_at,
            total_players,available_spots
          `)
          .in('sport', preferred)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);

        if (error) throw error;

        // Fetch participants separately (can't do nested select on views)
        const gameIds = (gamesWithParticipants || []).map((g: any) => g.id);
        const { data: participants } = await supabase
          .from('game_participants')
          .select('game_id') // Only need game_id since we filter by user_id
          .in('game_id', gameIds)
          .eq('status', 'joined')
          .eq('user_id', userId); // Only fetch current user's participation
        
        const participantsByGame = new Set<string>();
        (participants || []).forEach((p: any) => {
          participantsByGame.add(p.game_id);
        });

        return (gamesWithParticipants || []).map((game: any) => {
          const isJoined = participantsByGame.has(game.id);
          return transformGameFromDB(game, isJoined);
        });
      } else {
        // Use games_with_counts view for optimized current_players count
        const { data: gamesData, error } = await supabase
          .from('games_with_counts')
          .select('id,title,sport,date,time,location,cost,max_players,description,image_url,creator_id,created_at,total_players,available_spots')
          .in('sport', preferred)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);

        if (error) throw error;
        return (gamesData || []).map((game: any) => transformGameFromDB(game, false));
      }
    } catch (error) {
      console.error('[SupabaseService.getRecommendedGames] Error:', error);
      return this.getGames(); // Fallback to all games
    } finally {
      console.timeEnd?.(timeLabel);
    }
  }

  // Method to get past games (no archived column exists)
  static async getArchivedGames(userId?: string): Promise<Game[]> {
    try {
      let query = supabase
        .from('games_with_counts')
        .select('*')
        .lt('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(50);

      if (userId) {
        // Get games where user was a participant or creator
        const { data: gamesData, error } = await supabase
          .from('games_with_counts')
          .select(`
            *,
            game_participants(user_id, status)
          `)
          .lt('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(50);

        if (error) throw error;

        return (gamesData || [])
          .filter((game: any) => 
            game.creator_id === userId || 
            game.game_participants?.some((p: any) => 
              p.user_id === userId && p.status === 'joined'
            )
          )
          .map((game: any) => {
            const isJoined = game.game_participants?.some((p: any) => 
              p.user_id === userId && p.status === 'joined'
            ) || false;
            return transformGameFromDB(game, isJoined);
          });
      } else {
        const { data: gamesData, error } = await query;
        if (error) throw error;
        return (gamesData || []).map((game: any) => transformGameFromDB(game, false));
      }
    } catch (error) {
      console.error('[SupabaseService.getArchivedGames] Error:', error);
      return [];
    }
  }

  // Method to automatically archive old games
  static async archiveOldGames(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Note: archived column doesn't exist in database
      // const { error } = await supabase
      //   .from('games')
      //   .update({ archived: true })
      //   .lt('date', yesterdayStr);
      const error = null; // No-op since archived column doesn't exist

      if (error) throw error;
      console.log('✅ Old games processed successfully');
    } catch (error) {
      console.error('❌ Error archiving old games:', error);
    }
  }

  // User Stats methods
  static async getUserStats(userId: string) {
    try {
      // Get basic stats from user_stats table
      const { data: basicStats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ getUserStats database error:', error);
        throw error;
      }

      // If no user_stats record exists, calculate stats from actual game participation
      let calculatedStats: any = null;
      if (!basicStats) {
        console.log('📊 No user_stats record found, calculating from game participation');
        
        // Get games hosted by user
        const { data: hostedGames, error: hostedError } = await supabase
          .from('games_with_counts')
          .select('id, sport')
          .eq('creator_id', userId);
          
        if (hostedError) {
          console.error('❌ Error fetching hosted games:', hostedError);
        }

        // Get games participated in by user
        const { data: participatedGames, error: participatedError } = await supabase
          .from('game_participants')
          .select(`
            game_id,
            play_time_minutes,
            games!inner(sport, date)
          `)
          .eq('user_id', userId);
          
        if (participatedError) {
          console.error('❌ Error fetching participated games:', participatedError);
        }

        // Calculate real stats from actual data
        const gamesHosted = hostedGames?.length || 0;
        const gamesPlayed = participatedGames?.length || 0;
        const totalPlayTime = participatedGames?.reduce((sum, p) => sum + (p.play_time_minutes || 0), 0) || 0;
        
        // Find favorite sport from participation
        const sportCounts: Record<string, number> = {};
        hostedGames?.forEach(game => {
          sportCounts[game.sport] = (sportCounts[game.sport] || 0) + 1;
        });
        participatedGames?.forEach(p => {
          const sport = (p.games as any)?.sport;
          if (sport) {
            sportCounts[sport] = (sportCounts[sport] || 0) + 1;
          }
        });
        
        const favoriteSport = Object.keys(sportCounts).length > 0 
          ? Object.entries(sportCounts).reduce((a, b) => sportCounts[a[0]] > sportCounts[b[0]] ? a : b)[0]
          : null;

        calculatedStats = {
          user_id: userId,
          games_played: gamesPlayed,
          games_hosted: gamesHosted,
          total_play_time_minutes: totalPlayTime,
          favorite_sport: favoriteSport,
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('📊 Calculated stats from live data:', calculatedStats);
      }

      // Calculate average rating from game reviews (skip if table doesn't exist)
      let reviews: any[] = [];
      try {
        const { data } = await supabase
          .from('game_reviews')
          .select('rating')
          .eq('reviewee_id', userId);
        reviews = data || [];
      } catch (error) {
        console.log('⚠️ game_reviews table not found, skipping rating calculation');
        reviews = [];
      }

      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      // Use calculated stats if no database record exists, otherwise use database stats
      const finalStats = basicStats || calculatedStats || {
        user_id: userId,
        games_played: 0,
        games_hosted: 0,
        total_play_time_minutes: 0,
        favorite_sport: null,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        ...finalStats,
        average_rating: averageRating
      };
    } catch (error) {
      console.error('❌ getUserStats failed:', error);
      // Only return default stats as absolute last resort
      const defaultStats = {
        user_id: userId,
        games_played: 0,
        games_hosted: 0,
        total_play_time_minutes: 0,
        favorite_sport: null,
        average_rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return defaultStats;
    }
  }

  static async getUserRecentGames(userId: string, limit = 5) {
    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          *,
          games (
            id,
            title,
            sport,
            date,
            time,
            location,
            creator_id
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ getUserRecentGames database error:', error);
        console.log('⚠️ getUserRecentGames error, returning empty array:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ getUserRecentGames catch block error:', error);
      console.log('⚠️ getUserRecentGames failed, returning empty array');
      return [];
    }
  }

  static async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (
          id,
          name,
          description,
          icon,
          category,
          criteria,
          points,
          is_active
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  static async getAllAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('points', { ascending: true });

    if (error) throw error;

    return data || [];
  }

  static async checkAndAwardAchievements(userId: string) {
    // Get current user stats
    const stats = await this.getUserStats(userId);
    
    // Get all active achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    if (achievementsError) throw achievementsError;

    // Get user's current achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (userAchievementsError) throw userAchievementsError;

    const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    // Check each achievement
    const newAchievements: any[] = [];
    for (const achievement of achievements || []) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      const criteria = achievement.criteria;
      let shouldAward = false;

      // Check participation achievements
      if (criteria.games_played && stats.games_played >= criteria.games_played) {
        shouldAward = true;
      }

      // Check hosting achievements
      if (criteria.games_hosted && stats.games_hosted >= criteria.games_hosted) {
        shouldAward = true;
      }

      if (shouldAward) {
        newAchievements.push(achievement);
      }
    }

    // Award new achievements
    if (newAchievements.length > 0) {
      const achievementsToInsert = newAchievements.map(achievement => ({
        user_id: userId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert(achievementsToInsert);

      if (insertError) throw insertError;
    }

    return newAchievements;
  }

  // Method to record game participation
  static async recordGameParticipation(userId: string, gameId: string, status: 'joined' | 'left' | 'completed' = 'joined') {
    // First check if the status column exists using the public view
    const { data: columns, error: columnError } = await supabase
      .from('v_columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'game_participants')
      .eq('column_name', 'status');

    if (columnError) {
      console.log('Could not check for status column, using basic participation tracking');
      // Fall back to basic participation without status tracking
      const { data, error } = await supabase
        .from('game_participants')
        .upsert({
          user_id: userId,
          game_id: gameId
        }, {
          onConflict: 'user_id,game_id'
        });
      
      if (error) throw error;
      return data;
    }

    // If status column exists, use full tracking
    if (columns && columns.length > 0) {
      const { data, error } = await supabase
        .from('game_participants')
        .upsert({
          user_id: userId,
          game_id: gameId,
          status: status,
          joined_at: status === 'joined' ? new Date().toISOString() : undefined,
          left_at: status === 'left' || status === 'completed' ? new Date().toISOString() : undefined
        }, {
          onConflict: 'user_id,game_id'
        });

      if (error) throw error;
      return data;
    } else {
      // Status column doesn't exist, use basic participation
      const { data, error } = await supabase
        .from('game_participants')
        .upsert({
          user_id: userId,
          game_id: gameId
        }, {
          onConflict: 'user_id,game_id'
        });
      
      if (error) throw error;
      return data;
    }
  }

  // Method to mark a game as completed for all participants
  static async markGameCompleted(gameId: string) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // First, verify the user is the game creator
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('creator_id')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;
    if (game.creator_id !== currentUser.id) {
      throw new Error('Only the game creator can mark a game as completed');
    }

    // Mark all participants as completed
    const { error } = await supabase
      .from('game_participants')
      .update({ 
        status: 'completed',
        left_at: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .eq('status', 'joined');

    if (error) throw error;

    // Check for new achievements for all participants
    const { data: participants, error: participantsError } = await supabase
      .from('game_participants')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('status', 'completed');

    if (participantsError) throw participantsError;

    // Award achievements to all participants
    for (const participant of participants || []) {
      try {
        await this.checkAndAwardAchievements(participant.user_id);
      } catch (achievementError) {
        console.warn(`Failed to check achievements for user ${participant.user_id}:`, achievementError);
      }
    }
  }

  // WAITLIST SYSTEM METHODS
  static async joinWaitlist(gameId: string): Promise<{ success: boolean; position: number; message: string }> {
    const { data, error } = await supabase.rpc('join_waitlist', {
      game_uuid: gameId
    });

    if (error) throw error;
    return data;
  }

  static async leaveWaitlist(gameId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('leave_waitlist', {
      game_uuid: gameId
    });

    if (error) throw error;
    return data;
  }

  static async joinFromWaitlist(gameId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('join_from_waitlist', {
      game_uuid: gameId
    });

    if (error) throw error;
    return data;
  }

  static async getGameWaitlist(gameId: string): Promise<any[]> {
    // Fetch waitlist without FK join (to avoid 403 on users table)
    const { data: waitlistData, error } = await supabase
      .from('game_waitlist')
      .select('*')
      .eq('game_id', gameId)
      .order('position', { ascending: true });

    if (error) throw error;

    if (!waitlistData || waitlistData.length === 0) {
      return [];
    }

    // Fetch user info from users table
    const userIds = [...new Set(waitlistData.map(w => w.user_id).filter(Boolean))];
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, username')
        .in('id', userIds);
      users?.forEach(u => usersMap.set(u.id, u));
    }

    const data = waitlistData.map(entry => ({
      ...entry,
      user: usersMap.get(entry.user_id) || null
    }));

    return (data || []).map(entry => ({
      id: entry.id,
      position: entry.position,
      joinedAt: entry.joined_at,
      status: entry.status,
      expiresAt: entry.expires_at,
      user: {
        id: entry.user?.id || entry.user_id,
        name: entry.user?.full_name?.trim() || entry.user?.username?.trim() || 'Player',
        username: entry.user?.username || '',
        avatarUrl: entry.user?.avatar_url || ''
      }
    }));
  }

  static async getUserWaitlistStatus(gameId: string): Promise<{ isOnWaitlist: boolean; position?: number; status?: string }> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return { isOnWaitlist: false };

    const { data, error } = await supabase
      .from('game_waitlist')
      .select('position, status')
      .eq('game_id', gameId)
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data ? {
      isOnWaitlist: true,
      position: data.position,
      status: data.status
    } : { isOnWaitlist: false };
  }

  // RECURRING GAMES METHODS
  static async createRecurringTemplate(templateData: {
    title: string;
    sport: string;
    location: string;
    latitude?: number;
    longitude?: number;
    cost?: string;
    maxPlayers: number;
    description?: string;
    imageUrl?: string;
    recurrenceType: 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    timeOfDay: string;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_recurring_template', {
      p_title: templateData.title,
      p_sport: templateData.sport,
      p_location: templateData.location,
      p_latitude: templateData.latitude || null,
      p_longitude: templateData.longitude || null,
      p_cost: templateData.cost || 'Free',
      p_max_players: templateData.maxPlayers,
      p_description: templateData.description || '',
      p_image_url: templateData.imageUrl || null,
      p_recurrence_type: templateData.recurrenceType,
      p_recurrence_interval: 1,
      p_day_of_week: templateData.dayOfWeek || null,
      p_day_of_month: templateData.dayOfMonth || null,
      p_time_of_day: templateData.timeOfDay,
      p_start_date: templateData.startDate,
      p_end_date: templateData.endDate || null,
      p_max_occurrences: templateData.maxOccurrences || null
    });

    if (error) throw error;
    return data;
  }

  static async getRecurringTemplates(userId?: string): Promise<any[]> {
    // Fetch templates without FK join (to avoid 403 on users table)
    let query = supabase
      .from('recurring_game_templates')
      .select('*, _count:recurring_game_instances(count)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('creator_id', userId);
    }

    const { data: templatesData, error } = await query;
    if (error) throw error;

    if (!templatesData || templatesData.length === 0) {
      return [];
    }

    // Fetch creator info from users table
    const creatorIds = [...new Set(templatesData.map(t => t.creator_id).filter(Boolean))];
    let creatorsMap = new Map();
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, username')
        .in('id', creatorIds);
      creators?.forEach(c => creatorsMap.set(c.id, c));
    }

    const data = templatesData.map(template => ({
      ...template,
      creator: creatorsMap.get(template.creator_id) || null
    }));

    return (data || []).map(template => ({
      id: template.id,
      title: template.title,
      sport: template.sport,
      location: template.location,
      recurrenceType: template.recurrence_type,
      dayOfWeek: template.day_of_week,
      dayOfMonth: template.day_of_month,
      timeOfDay: template.time_of_day,
      startDate: template.start_date,
      endDate: template.end_date,
      maxOccurrences: template.max_occurrences,
      isActive: template.is_active,
      createdAt: template.created_at,
      creator: {
        id: template.creator?.id || template.creator_id,
        name: template.creator?.full_name?.trim() || template.creator?.username?.trim() || 'Host',
        username: template.creator?.username || '',
        avatarUrl: template.creator?.avatar_url || ''
      },
      instanceCount: template._count?.[0]?.count || 0
    }));
  }

  static async updateRecurringTemplate(templateId: string, updates: any): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_recurring_template', {
      template_id: templateId,
      updates: updates
    });

    if (error) throw error;
    return data;
  }

  static async cancelRecurringTemplate(templateId: string, cancelFutureGames: boolean = true): Promise<boolean> {
    const { data, error } = await supabase.rpc('cancel_recurring_template', {
      template_id: templateId,
      cancel_future_games: cancelFutureGames
    });

    if (error) throw error;
    return data;
  }

  static async getRecurringGameInstances(templateId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('recurring_game_instances')
      .select(`
        *,
        game:games!recurring_game_instances_game_id_fkey(*)
      `)
      .eq('template_id', templateId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(instance => ({
      id: instance.id,
      scheduledDate: instance.scheduled_date,
      instanceNumber: instance.instance_number,
      status: instance.status,
      game: instance.game ? transformGameFromDB(instance.game, false) : null
    }));
  }

  // RATING AND REVIEW METHODS
  static async submitGameReview(reviewData: {
    gameId: string;
    overallRating: number;
    organizationRating?: number;
    skillLevelRating?: number;
    funRating?: number;
    reviewText?: string;
    wouldPlayAgain?: boolean;
    recommendToOthers?: boolean;
  }): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('submit_game_review', {
        p_game_id: reviewData.gameId,
        p_overall_rating: reviewData.overallRating,
        p_organization_rating: reviewData.organizationRating || null,
        p_skill_level_rating: reviewData.skillLevelRating || null,
        p_fun_rating: reviewData.funRating || null,
        p_review_text: reviewData.reviewText || null,
        p_would_play_again: reviewData.wouldPlayAgain ?? true,
        p_recommend_to_others: reviewData.recommendToOthers ?? true
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.log('⚠️ Rating system disabled - submit_game_review function not available');
      throw new Error('Rating system is currently disabled');
    }
  }

  static async submitPlayerRating(ratingData: {
    gameId: string;
    ratedPlayerId: string;
    skillRating: number;
    sportsmanshipRating: number;
    communicationRating: number;
    feedbackText?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('submit_player_rating', {
        p_game_id: ratingData.gameId,
        p_rated_player_id: ratingData.ratedPlayerId,
        p_skill_rating: ratingData.skillRating,
        p_sportsmanship_rating: ratingData.sportsmanshipRating,
        p_communication_rating: ratingData.communicationRating,
        p_feedback_text: ratingData.feedbackText || null
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.log('⚠️ Rating system disabled - submit_player_rating function not available');
      throw new Error('Rating system is currently disabled');
    }
  }

  static async getGameReviews(gameId: string): Promise<any[]> {
    try {
      // Fetch reviews without FK join (to avoid 403 on users table)
      const { data: reviewsData, error } = await supabase
        .from('game_reviews')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching game reviews:', error);
        return [];
      }

      if (!reviewsData || reviewsData.length === 0) {
        return [];
      }

      // Fetch reviewer info from users table
      const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id).filter(Boolean))];
      let reviewersMap = new Map();
      if (reviewerIds.length > 0) {
        const { data: reviewers } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, username')
          .in('id', reviewerIds);
        reviewers?.forEach(r => reviewersMap.set(r.id, r));
      }

      const data = reviewsData.map(review => ({
        ...review,
        reviewer: reviewersMap.get(review.reviewer_id) || null
      }));

      return data || [];
    } catch (error) {
      console.log('⚠️ game_reviews table not found, returning empty array');
      return [];
    }
  }

  static async getGameRatingSummary(gameId: string): Promise<any> {
    const { data, error } = await supabase
      .from('game_rating_summary')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data ? {
      totalReviews: data.total_reviews,
      avgOverallRating: data.avg_overall_rating,
      avgOrganizationRating: data.avg_organization_rating,
      avgSkillLevelRating: data.avg_skill_level_rating,
      avgFunRating: data.avg_fun_rating,
      wouldPlayAgainCount: data.would_play_again_count,
      recommendCount: data.recommend_count,
      lastUpdated: data.last_updated
    } : null;
  }

  static async getUserRatingSummary(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_rating_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data ? {
      totalRatingsReceived: data.total_ratings_received,
      avgSkillRating: data.avg_skill_rating,
      avgSportsmanshipRating: data.avg_sportsmanship_rating,
      avgCommunicationRating: data.avg_communication_rating,
      avgOverallPlayerRating: data.avg_overall_player_rating,
      gamesOrganized: data.games_organized,
      avgGameRating: data.avg_game_rating,
      lastUpdated: data.last_updated
    } : null;
  }

  static async getReviewableGames(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_reviewable_games');

    if (error) throw error;

    return (data || []).map(game => ({
      gameId: game.game_id,
      title: game.game_title,
      date: game.game_date,
      time: game.game_time,
      sport: game.sport,
      hasReviewed: game.has_reviewed
    }));
  }

  static async getPlayerRatings(gameId: string, playerId?: string): Promise<any[]> {
    // Fetch ratings without FK join (to avoid 403 on users table)
    let query = supabase
      .from('player_ratings')
      .select('*')
      .eq('game_id', gameId);

    if (playerId) {
      query = query.eq('rated_player_id', playerId);
    }

    const { data: ratingsData, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    if (!ratingsData || ratingsData.length === 0) {
      return [];
    }

    // Fetch user info from users table for both rater and rated_player
    const userIds = [
      ...new Set([
        ...ratingsData.map(r => r.rater_id).filter(Boolean),
        ...ratingsData.map(r => r.rated_player_id).filter(Boolean)
      ])
    ];
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, username')
        .in('id', userIds);
      users?.forEach(u => usersMap.set(u.id, u));
    }

    const data = ratingsData.map(rating => ({
      ...rating,
      rater: usersMap.get(rating.rater_id) || null,
      rated_player: usersMap.get(rating.rated_player_id) || null
    }));

    return (data || []).map(rating => ({
      id: rating.id,
      skillRating: rating.skill_rating,
      sportsmanshipRating: rating.sportsmanship_rating,
      communicationRating: rating.communication_rating,
      feedbackText: rating.feedback_text,
      createdAt: rating.created_at,
      rater: {
        id: rating.rater?.id || rating.rater_id,
        name: rating.rater?.full_name?.trim() || rating.rater?.username?.trim() || 'Player',
        username: rating.rater?.username || '',
        avatarUrl: rating.rater?.avatar_url || ''
      },
      ratedPlayer: {
        id: rating.rated_player?.id || rating.rated_player_id,
        name: rating.rated_player?.full_name?.trim() || rating.rated_player?.username?.trim() || 'Player',
        username: rating.rated_player?.username || '',
        avatarUrl: rating.rated_player?.avatar_url || ''
      }
    }));
  }

  // User Testing Feedback
  static async submitUserTestingFeedback(feedbackData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_testing_feedback')
        .insert([feedbackData]);

      if (error) throw error;
      
      console.log('✅ User testing feedback submitted successfully');
    } catch (error) {
      console.error('❌ Failed to submit user testing feedback:', error);
      throw error;
    }
  }
}
