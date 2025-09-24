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
      // First, check if the user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // Ensure we have a valid email (column is NOT NULL + UNIQUE)
      let email: string | null = userData.email || null;
      if (!email) {
        const { data: authUser } = await supabase.auth.getUser();
        email = authUser.user?.email ?? null;
      }
      if (!email) {
        throw new Error('Unable to determine user email for profile creation');
      }
      
      // Prepare the profile data according to the database schema
      // Note: do NOT include non-existent columns like updated_at
      const profileData = {
        id: userId,
        email,
        full_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'New User',
        username: userData.username || `user_${Math.random().toString(36).substring(2, 10)}`,
        bio: userData.bio || '',
        location: userData.location || '',
        role: userData.role || 'user',
        preferred_sports: Array.isArray(userData.selectedSports)
          ? (userData.selectedSports
              .filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0))
          : []
        // created_at has a default; let the DB handle it
      } as const;
      
      console.log('Profile data to save:', profileData);
      
      // Use upsert to handle both insert and update in one operation
      const { data, error } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving profile:', error);
        throw error;
      }
      
      console.log('Profile saved successfully:', data);
      return data;
      
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('🔍 Getting user profile for:', userId);
      
      // Validate userId format
      if (!userId || userId.trim() === '') {
        console.log('❌ Invalid user ID provided:', userId);
        return null;
      }
      
      // Check if current user is authenticated - if not, return null quickly
      console.log('🔍 Checking if user is authenticated...');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🔍 Current user from auth:', currentUser?.id);
      
      if (!currentUser) {
        console.log('ℹ️ Anonymous user cannot access user profiles due to RLS - returning null');
        return null;
      }
      
      // Only proceed with query if user is authenticated
      console.log('🔍 User is authenticated, executing query for user ID:', userId.trim());
      
      // Use shorter timeout for user profile queries to prevent hanging
      console.log('🔍 Starting database query...');
      const data = await networkService.executeWithRetry(
        async () => {
          console.log('🔍 Executing Supabase query...');
          // Use explicit field selection to avoid PGRST116 coercion errors
          const { data, error } = await supabase
            .from('users')
            .select(`
              id,
              email,
              username,
              full_name,
              avatar_url,
              bio,
              location,
              preferred_sports,
              role,
              stats,
              created_at
            `)
            .eq('id', userId.trim())
            .maybeSingle();
          
          console.log('🔍 Query completed. Data:', data, 'Error:', error);
          
          if (error) {
            // Handle PGRST116 specifically - this means data coercion failed
            if (error.code === 'PGRST116') {
              console.error('❌ PGRST116 Error: Cannot coerce result to single JSON object');
              console.error('❌ This usually means multiple rows returned or data type mismatch');
              
              // Try a fallback query with just basic fields
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('users')
                .select('id, email, username, full_name, avatar_url, bio, location, role')
                .eq('id', userId.trim())
                .limit(1)
                .single();
                
              if (fallbackError) {
                throw fallbackError;
              }
              
              console.log('✅ Fallback query succeeded, using basic user data');
              // Create a minimal user object with fallback data
              return {
                ...fallbackData,
                preferred_sports: [],
                stats: {},
                created_at: new Date().toISOString()
              };
            }
            throw error;
          }
          return data;
        },
        `getUserProfile-${userId}`,
        { maxRetries: 1, timeout: 3000 }
      );

      if (!data) {
        console.log('❌ No user found for ID:', userId);
        // Let's also check if there are any users in the table
        const { data: allUsers, error: countError } = await supabase
          .from('users')
          .select('id, full_name')
          .limit(5);
        console.log('🔍 Sample users in database:', allUsers?.map(u => ({ id: u.id, name: u.full_name })));
        return null;
      }

      console.log('✅ User profile loaded:', data?.id, data?.full_name);
      console.log('🔍 Raw user data from DB:', {
        id: data?.id,
        full_name: data?.full_name,
        username: data?.username,
        email: data?.email,
        avatar_url: data?.avatar_url,
        bio: data?.bio,
        location: data?.location,
        preferred_sports: data?.preferred_sports,
        role: data?.role
      });
      const transformedUser = transformUserFromDB(data);
      console.log('🔍 Transformed user (complete):', transformedUser);
      return transformedUser;
    } catch (error) {
      console.error('❌ getUserProfile failed:', error);
      if (error instanceof Error && error.message === 'getUserProfile timeout') {
        // Return null on timeout to prevent infinite loading
        return null;
      }
      return null; // Return null instead of throwing to prevent app crashes
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
    
    // Build update object without role column until migration is applied
    const updateData: any = {
      full_name: updates.full_name,
      username: updates.username,
      avatar_url: updates.avatar_url,
      bio: updates.bio,
      location: updates.location,
      preferred_sports: updates.preferred_sports || updates.sports_preferences
    };

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
        currentPlayers: 6,
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
        currentPlayers: 18,
        description: 'Friendly soccer match. Bring your own water!',
        imageUrl: '',
        sportColor: '#22C55E',
        isJoined: false,
        createdBy: 'mock-user',
        createdAt: today.toISOString()
      }
    ];
  }

  // Games methods - Ultra-fast direct query
  static async getGames(): Promise<Game[]> {
    const startTime = performance.now();
    console.log('🚀 Starting getGames...');
    
    try {
      // Get current user to check join status
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
        const queryStart = performance.now();
        
        console.log(`🔍 Getting games for user: ${userId}`);
        
        // If user is authenticated, get games with join status
        if (userId) {
        const { data: gamesWithParticipants, error } = await supabase
          .from('games')
          .select(`
            *,
            game_participants(user_id),
            creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
          `)
          // Filter out games that are fully in the past (date + time has passed)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);
        
        const queryTime = performance.now() - queryStart;
        console.log(`📊 Supabase query with participants took: ${queryTime.toFixed(2)}ms`);

        if (error) throw error;
        
        const transformStart = performance.now();
        const games = (gamesWithParticipants || []).map((game: any) => {
          try {
            const isJoined = game.game_participants?.some((p: any) => p.user_id === userId) || false;
            console.log(`🔍 Game ${game.id} (${game.title}): isJoined=${isJoined}, participants=`, game.game_participants);
            return transformGameFromDB(game, isJoined);
          } catch (transformError) {
            console.error('❌ Transform error for game:', game.id, transformError);
            // Fallback to basic game object
            return {
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
              currentPlayers: game.current_players,
              description: game.description,
              imageUrl: game.image_url || '',
              sportColor: '#6B7280',
              isJoined: false,
              createdBy: game.creator_id,
              createdAt: game.created_at,
            };
          }
        });
        
        const transformTime = performance.now() - transformStart;
        const totalTime = performance.now() - startTime;
        
        console.log(`⚡ Transform took: ${transformTime.toFixed(2)}ms`);
        console.log(`✅ Total getGames took: ${totalTime.toFixed(2)}ms`);
        console.log(`📦 Returned ${games.length} games`);
        
        return games;
      } else {
        // If no user, get games without join status
        const { data: gamesData, error } = await supabase
          .from('games')
          .select(`
            *,
            creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
          `)
          // Filter out games that are fully in the past (date + time has passed)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('created_at', { ascending: false })
          .limit(50);
        
        const queryTime = performance.now() - queryStart;
        console.log(`📊 Supabase query took: ${queryTime.toFixed(2)}ms`);

        if (error) throw error;
        
        const transformStart = performance.now();
        const games = (gamesData || []).map((game: any) => {
          try {
            return transformGameFromDB(game, false);
          } catch (transformError) {
            console.error('❌ Transform error for game:', game.id, transformError);
            // Fallback to basic game object
            return {
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
              currentPlayers: game.current_players,
              description: game.description,
              imageUrl: game.image_url || '',
              sportColor: '#6B7280',
              isJoined: false,
              createdBy: game.creator_id,
              createdAt: game.created_at,
            };
          }
        });
        
        const transformTime = performance.now() - transformStart;
        const totalTime = performance.now() - startTime;
        
        console.log(`⚡ Transform took: ${transformTime.toFixed(2)}ms`);
        console.log(`✅ Total getGames took: ${totalTime.toFixed(2)}ms`);
        console.log(`📦 Returned ${games.length} games`);
        
        return games;
      }
      
    } catch (error) {
      console.error('❌ getGames error:', error);
      return this.getMockGames();
    }
  }

  static async getMyGames(userId: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:users!games_creator_id_fkey(full_name, username)
      `)
      .eq('creator_id', userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return data.map(game => transformGameFromDB(game, true));
  }

  static async getNearbyGames(latitude?: number, longitude?: number, radius: number = 25): Promise<Game[]> {
    try {
      // Get current user directly without caching
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let query = supabase
        .from('games')
        .select('id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id')
;

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
        return (gamesData || []).map((game: any) => transformGameFromDB(game, false));
      }

      // For authenticated users, use optimized join query
      const { data: gamesWithParticipants, error } = await query
        .select(`
          *,
          game_participants(user_id)
        `)
        .order('date', { ascending: true })
        .limit(50);

      if (error) throw error;

      return (gamesWithParticipants || []).map((game: any) => {
        const isJoined = game.game_participants?.some((p: any) => p.user_id === userId) || false;
        return transformGameFromDB(game, isJoined);
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
        creator_id: currentUser.id
        // Note: duration field doesn't exist in current database schema
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
    if (!currentUser) throw new Error('User not authenticated');

    console.log(`🔧 User ${currentUser.id} joining game ${gameId}`);

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
      .from('public_rsvps')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createPublicRSVP(gameId: string, rsvpData: { name: string; email: string; phone?: string }): Promise<void> {
    // Check if email already RSVPed for this game
    const { data: existing } = await supabase
      .from('public_rsvps')
      .select('id')
      .eq('game_id', gameId)
      .eq('email', rsvpData.email)
      .single();

    if (existing) {
      throw new Error('This email has already RSVPed for this game');
    }

    const { error } = await supabase
      .from('public_rsvps')
      .insert({
        game_id: gameId,
        name: rsvpData.name,
        email: rsvpData.email,
        phone: rsvpData.phone
      });

    if (error) throw error;
  }

  static async getGameById(gameId: string): Promise<any> {
    // Get current user to check join status
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (userId) {
      // For authenticated users, get game with join status and creator info
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_participants(user_id),
          creator:users!creator_id(id, full_name, username, avatar_url)
        `)
        .eq('id', gameId)
        .single();

      if (error) throw error;
      
      const isJoined = data.game_participants?.some((p: any) => p.user_id === userId) || false;
      return transformGameFromDB(data, isJoined);
    } else {
      // For unauthenticated users, get game without join status but with creator info
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          creator:users!creator_id(id, full_name, username, avatar_url)
        `)
        .eq('id', gameId)
        .single();

      if (error) throw error;
      return transformGameFromDB(data, false);
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
    try {
      // First, get the participant user IDs
      const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select('user_id, joined_at')
        .eq('game_id', gameId);

      if (participantsError) throw participantsError;

      console.log('🔍 Raw participants data:', participants);

      if (!participants || participants.length === 0) {
        return [];
      }

      // Then fetch user details for each participant
      const userIds = participants.map(p => p.user_id);
      
      // Try profiles table first, fallback to users table
      let { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);
      
      // If profiles table doesn't exist or fails, try users table
      if (usersError || !users) {
        console.log('📋 Profiles table not available, trying users table');
        const { data: usersData, error: usersTableError } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url, email')
          .in('id', userIds);
        
        users = usersData;
        usersError = usersTableError;
      }

      if (usersError) {
        console.error('❌ Error fetching user details:', usersError);
        console.error('❌ This is likely due to RLS policies blocking access to user profiles');
        console.error('❌ Run the SQL fix in Supabase to allow public profile access');
        // Fallback: return participants with basic info
        return participants.map(participant => ({
          id: participant.user_id,
          name: `User ${participant.user_id.slice(0, 8)}`,
          avatar: null,
          isHost: false,
          rating: 4.5
        }));
      }

      console.log('🔍 Fetched user details:', users);

      // Combine participant and user data
      return participants.map(participant => {
        const user = users?.find(u => u.id === participant.user_id);
        console.log('🔍 Processing participant:', participant.user_id, 'user:', user);
        
        return {
          id: participant.user_id,
          name: user?.full_name || user?.username || user?.email?.split('@')[0] || `User ${participant.user_id.slice(0, 8)}`,
          avatar: user?.avatar_url || null,
          isHost: false, // We'll determine this separately by checking if user is game creator
          rating: 4.5 // Default rating - in real app this would come from a ratings table
        };
      });
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

      let query = supabase
        .from('games')
        .select('id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id')
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

      // For authenticated users, use optimized join query
      const { data: gamesWithParticipants, error } = await query
        .select(`
          *,
          game_participants(user_id)
        `)
        .order('date', { ascending: true })
        .limit(50);

      if (error) throw error;

      return (gamesWithParticipants || []).map((game: any) => {
        const isJoined = game.game_participants?.some((p: any) => p.user_id === userId) || false;
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
      if (userId) {
        const { data: gamesWithParticipants, error } = await supabase
          .from('games')
          .select(`
            id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id,
            game_participants(user_id)
          `)
          .in('sport', preferred)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);

        if (error) throw error;

        return (gamesWithParticipants || []).map((game: any) => {
          const isJoined = game.game_participants?.some((p: any) => p.user_id === userId) || false;
          return transformGameFromDB(game, isJoined);
        });
      } else {
        const { data: gamesData, error } = await supabase
          .from('games')
          .select('id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id')
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
        .from('games')
        .select('*')
        .lt('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(50);

      if (userId) {
        // Get games where user was a participant or creator
        const { data: gamesData, error } = await supabase
          .from('games')
          .select(`
            *,
            game_participants(user_id)
          `)
          .lt('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(50);

        if (error) throw error;

        return (gamesData || [])
          .filter((game: any) => 
            game.creator_id === userId || 
            game.game_participants?.some((p: any) => p.user_id === userId)
          )
          .map((game: any) => {
            const isJoined = game.game_participants?.some((p: any) => p.user_id === userId) || false;
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
          .from('games')
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
    // First check if the status column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
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
    const { data, error } = await supabase
      .from('game_waitlist')
      .select(`
        *,
        user:users!game_waitlist_user_id_fkey(id, full_name, username, avatar_url)
      `)
      .eq('game_id', gameId)
      .order('position', { ascending: true });

    if (error) throw error;

    return (data || []).map(entry => ({
      id: entry.id,
      position: entry.position,
      joinedAt: entry.joined_at,
      status: entry.status,
      expiresAt: entry.expires_at,
      user: {
        id: entry.user.id,
        name: entry.user.full_name || entry.user.username,
        username: entry.user.username,
        avatarUrl: entry.user.avatar_url
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
    let query = supabase
      .from('recurring_game_templates')
      .select(`
        *,
        creator:users!recurring_game_templates_creator_id_fkey(id, full_name, username, avatar_url),
        _count:recurring_game_instances(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('creator_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

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
        id: template.creator.id,
        name: template.creator.full_name || template.creator.username,
        username: template.creator.username,
        avatarUrl: template.creator.avatar_url
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
      const { data, error } = await supabase
        .from('game_reviews')
        .select(`
          *,
          reviewer:users!game_reviews_reviewer_id_fkey(id, full_name, username, avatar_url)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching game reviews:', error);
        return [];
      }

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
    let query = supabase
      .from('player_ratings')
      .select(`
        *,
        rater:users!player_ratings_rater_id_fkey(id, full_name, username, avatar_url),
        rated_player:users!player_ratings_rated_player_id_fkey(id, full_name, username, avatar_url)
      `)
      .eq('game_id', gameId);

    if (playerId) {
      query = query.eq('rated_player_id', playerId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(rating => ({
      id: rating.id,
      skillRating: rating.skill_rating,
      sportsmanshipRating: rating.sportsmanship_rating,
      communicationRating: rating.communication_rating,
      feedbackText: rating.feedback_text,
      createdAt: rating.created_at,
      rater: {
        id: rating.rater.id,
        name: rating.rater.full_name || rating.rater.username,
        username: rating.rater.username,
        avatarUrl: rating.rater.avatar_url
      },
      ratedPlayer: {
        id: rating.rated_player.id,
        name: rating.rated_player.full_name || rating.rated_player.username,
        username: rating.rated_player.username,
        avatarUrl: rating.rated_player.avatar_url
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
