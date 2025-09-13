import { supabase, transformGameFromDB, transformUserFromDB, Database } from './supabase';
import type { Game, User, UserPreferences } from '../store/appStore';

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
            game_participants(user_id)
          `)
          .eq('archived', false)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('created_at', { ascending: false })
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
          .select('*')
          .eq('archived', false)
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
      .eq('archived', false)
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
        .eq('archived', false)
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
    latitude?: number;
    longitude?: number;
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
        max_players: gameData.maxPlayers,
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

  static async updateGame(gameId: string, updates: Partial<{
    title: string;
    sport: string;
    description: string;
    date: string;
    time: string;
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

    // Check time restrictions (can't edit within 2 hours of game time)
    const gameDateTime = new Date(`${gameData.date}T${gameData.time}`);
    const now = new Date();
    const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilGame < 2) {
      throw new Error('Cannot edit game within 2 hours of start time');
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

  static async deleteGame(gameId: string, reason?: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // First check if user is the creator and get game details
    const { data: gameData, error: fetchError } = await supabase
      .from('games')
      .select('creator_id, date, time, title')
      .eq('id', gameId)
      .single();

    if (fetchError) throw fetchError;
    if (gameData.creator_id !== currentUser.id) {
      throw new Error('Only the game creator can delete this game');
    }

    // Check time restrictions (can't delete within 4 hours of game time)
    const gameDateTime = new Date(`${gameData.date}T${gameData.time}`);
    const now = new Date();
    const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilGame < 4) {
      throw new Error('Cannot delete game within 4 hours of start time');
    }

    // Notify participants before deletion
    await this.notifyGameParticipants(gameId, 'game_cancelled', {
      title: 'Game Cancelled',
      message: `The game "${gameData.title}" has been cancelled${reason ? `: ${reason}` : '.'}`
    });

    // Archive the game instead of hard delete to preserve data
    const { error } = await supabase
      .from('games')
      .update({ archived: true })
      .eq('id', gameId);

    if (error) throw error;
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
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) throw error;
    return transformGameFromDB(data, false);
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
      content: notification.message,
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
    // Temporarily disabled to prevent WebSocket connection failures
    console.log('Realtime subscriptions disabled to prevent WebSocket failures');
    return { unsubscribe: () => {} };
  }

  // Subscribe to all games (INSERT) to keep the home feed fresh
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
        .eq('archived', false);

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
            game_participants!left(user_id)
          `)
          .in('sport', preferred)
          .eq('archived', false)
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
          .eq('archived', false)
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

  // Method to get archived/past games
  static async getArchivedGames(userId?: string): Promise<Game[]> {
    try {
      let query = supabase
        .from('games')
        .select('*')
        .or(`archived.eq.true,date.lt.${new Date().toISOString().split('T')[0]}`)
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
          .or(`archived.eq.true,date.lt.${new Date().toISOString().split('T')[0]}`)
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

      const { error } = await supabase
        .from('games')
        .update({ archived: true })
        .eq('archived', false)
        .lt('date', yesterdayStr);

      if (error) throw error;
      console.log('✅ Old games archived successfully');
    } catch (error) {
      console.error('❌ Error archiving old games:', error);
    }
  }
}
