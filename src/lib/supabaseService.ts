import { supabase, transformGameFromDB, transformUserFromDB, Database } from './supabase';
import type { Game, User, UserPreferences } from '../store/appStore';

// Types for database operations
type GameRow = Database['public']['Tables']['games']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export class SupabaseService {
  // Cache for session data to avoid repeated calls
  private static sessionCache: { session: any; timestamp: number } | null = null;
  private static readonly SESSION_CACHE_TTL = 30000; // 30 seconds
  
  // Get cached session or fetch new one - Non-blocking approach
  private static async getCachedSession() {
    const now = Date.now();
    
    // Return cached session if still valid
    if (this.sessionCache && (now - this.sessionCache.timestamp) < this.SESSION_CACHE_TTL) {
      return this.sessionCache.session;
    }
    
    // If cache is stale but exists, return it and refresh in background
    if (this.sessionCache) {
      // Don't await - fire and forget background refresh
      this.refreshSessionCache().catch(() => {}); // Silently ignore errors
      return this.sessionCache.session;
    }
    
    // No cache exists, try to get session synchronously but with short timeout
    try {
      const { data } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initial session timeout')), 1500)
        )
      ]) as any;
      
      // Cache the result
      this.sessionCache = {
        session: data.session,
        timestamp: now
      };
      
      return data.session;
    } catch {
      // If initial fetch fails, return null and try background refresh
      this.refreshSessionCache().catch(() => {});
      return null;
    }
  }
  
  // Background session refresh - silent and resilient
  private static async refreshSessionCache() {
    try {
      const { data } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        )
      ]) as any;
      
      // Update cache
      this.sessionCache = {
        session: data.session,
        timestamp: Date.now()
      };
    } catch {
      // Silently fail - don't log warnings for background refreshes
      // Keep existing cache if refresh fails
    }
  }
  
  // Clear session cache (call on sign out)
  private static clearSessionCache() {
    this.sessionCache = null;
  }

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
    this.clearSessionCache(); // Clear cache on sign out
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return transformUserFromDB(data);
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
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: updates.full_name,
        username: updates.username,
        avatar_url: updates.avatar_url,
        bio: updates.bio,
        location: updates.location,
        preferred_sports: updates.sports_preferences
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
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
    const timeLabel = `SupabaseService.getGames ${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    console.time?.(timeLabel);
    
    try {
      // Skip session check entirely for speed - just get games
      const { data: gamesData, error } = await supabase
        .from('games')
        .select('id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform without join status for speed
      const games = (gamesData || []).map((game: any) => transformGameFromDB(game, false));
      
      console.log(`✅ Loaded ${games.length} games in`, timeLabel);
      return games;
      
    } catch (error) {
      console.error('[SupabaseService.getGames] Error:', error);
      return this.getMockGames();
    } finally {
      console.timeEnd?.(timeLabel);
    }
  }

  static async getMyGames(userId: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:users!games_creator_id_fkey(full_name, username)
      `)
      .or(`creator_id.eq.${userId},id.in.(${
        supabase
          .from('game_participants')
          .select('game_id')
          .eq('user_id', userId)
          .toString()
      })`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(game => transformGameFromDB(game, true));
  }

  static async getNearbyGames(latitude?: number, longitude?: number, radius: number = 25): Promise<Game[]> {
    try {
      // Use cached session for better performance
      const session = await this.getCachedSession();
      const userId = session?.user?.id;

      let query = supabase
        .from('games')
        .select('id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(20);

      if (latitude && longitude) {
        query = query
          .filter('latitude', 'gte', latitude - 0.1)
          .filter('latitude', 'lte', latitude + 0.1)
          .filter('longitude', 'gte', longitude - 0.1)
          .filter('longitude', 'lte', longitude + 0.1);
      }

      // If no user, return games without join status
      if (!userId) {
        const { data: gamesData, error } = await query;
        if (error) throw error;
        return (gamesData || []).map((game: any) => transformGameFromDB(game, false));
      }

      // For authenticated users, use optimized join query
      const { data: gamesWithParticipants, error } = await query
        .select(`
          *,
          game_participants!left(user_id)
        `);

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
    date: string;
    time: string;
    cost: string;
    maxPlayers: number;
    description: string;
    imageUrl?: string;
  }): Promise<Game> {
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
        max_players: parseInt(gameData.maxPlayers, 10),
        current_players: 1, // Creator is automatically a participant
        description: gameData.description,
        creator_id: currentUser.id
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

  static async joinGame(gameId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Use the database function
    const { error } = await supabase.rpc('join_game', {
      game_uuid: gameId
    });

    if (error) throw error;
  }

  static async leaveGame(gameId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Use the database function
    const { error } = await supabase.rpc('leave_game', {
      game_uuid: gameId
    });

    if (error) throw error;
  }

  // Chat methods
  static async getChatMessages(gameId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users!chat_messages_user_id_fkey(id, full_name, username, avatar_url)
      `)
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(msg => ({
      id: msg.id,
      message: msg.message,
      createdAt: msg.created_at,
      user: {
        id: (msg as any).user?.id ?? 'unknown',
        name: (msg as any).user?.full_name || (msg as any).user?.username || 'Unknown User',
        avatar: (msg as any).user?.avatar_url || ''
      }
    }));
  }

  static async sendMessage(gameId: string, message: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        game_id: gameId,
        user_id: currentUser.id,
        message
      });

    if (error) throw error;
  }

  // Notifications methods
  static async getNotifications(): Promise<any[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      data: notification.data,
      createdAt: notification.created_at
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

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUser.id);

    if (error) throw error;
  }

  static async getGameParticipants(gameId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        *,
        user:users!game_participants_user_id_fkey(id, full_name, username, avatar_url)
      `)
      .eq('game_id', gameId);

    if (error) throw error;

    return data.map(participant => ({
      id: (participant as any).user?.id ?? 'unknown',
      name: (participant as any).user?.full_name || (participant as any).user?.username || 'Unknown User',
      avatar: (participant as any).user?.avatar_url || '',
      isHost: participant.user_id === participant.game_id, // This logic might need adjustment
      rating: 4.5 // Default rating - in real app this would come from a ratings table
    }));
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

  static subscribeToNotifications(callback: (payload: any) => void) {
    return supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, callback)
      .subscribe();
  }

  // Subscribe to all games (INSERT) to keep the home feed fresh
  static subscribeToAllGames(callback: (payload: any) => void) {
    return supabase
      .channel('games:all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'games'
      }, callback)
      .subscribe();
  }

  // Utility methods
  static async searchGames(filters: {
    sports?: string[];
    dateRange?: { start: Date | null; end: Date | null };
    distance?: number;
    priceRange?: { min: number; max: number };
  }): Promise<Game[]> {
    try {
      // Use cached session for better performance
      const session = await this.getCachedSession();
      const userId = session?.user?.id;

      let query = supabase
        .from('games')
        .select('id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id');

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
          game_participants!left(user_id)
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
        const session = await this.getCachedSession();
        const userId = session?.user?.id;
        
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
      const session = await this.getCachedSession();
      const userId = session?.user?.id;

      // Optimized query with join for Pro tier
      if (userId) {
        const { data: gamesWithParticipants, error } = await supabase
          .from('games')
          .select(`
            id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id,
            game_participants!left(user_id)
          `)
          .in('sport', preferred)
          // .gte('date', new Date().toISOString().split('T')[0])  // Temporarily removed
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
          // .gte('date', new Date().toISOString().split('T')[0])  // Temporarily removed
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
}
