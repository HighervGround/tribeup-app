import { supabase } from './supabase';

export interface GameParticipant {
  id: string;
  game_id: string;
  user_id: string;
  status: 'joined' | 'left' | 'kicked' | 'banned';
  joined_at: string;
  left_at?: string;
}

/**
 * Join a game - creates a new participant record
 * The database triggers will automatically:
 * 1. Set user_id = auth.uid() via RLS policy
 * 2. Update games.current_players count
 */
export async function joinGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🎯 Joining game: ${gameId}`);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Must be logged in to join games' };
    }
    
    // Use the helper function to avoid RLS issues
    const { data, error } = await supabase.rpc('test_join', { 
      game: gameId 
    });
      
    if (error) {
      console.error('❌ Join game failed:', error);
      
      // Handle specific error cases
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'You are already in this game' };
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('✅ Successfully joined game:', data);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Join game error:', error);
    return { success: false, error: 'Failed to join game' };
  }
}

/**
 * Leave a game - updates participant status to 'left'
 * The database triggers will automatically:
 * 1. Set left_at = now()
 * 2. Update games.current_players count
 */
export async function leaveGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚪 Leaving game: ${gameId}`);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Must be logged in to leave games' };
    }
    
    // Use the helper function to avoid RLS issues
    const { data, error } = await supabase.rpc('test_leave', { 
      game: gameId 
    });
      
    if (error) {
      console.error('❌ Leave game failed:', error);
      
      if (error.code === 'PGRST116') { // No rows found
        return { success: false, error: 'You are not currently in this game' };
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('✅ Successfully left game:', data);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Leave game error:', error);
    return { success: false, error: 'Failed to leave game' };
  }
}

/**
 * Check if current user is in a game
 */
export async function isUserInGame(gameId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('game_participants')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .eq('status', 'joined')
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking game participation:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking game participation:', error);
    return false;
  }
}

/**
 * Get participants for a game (visible based on RLS policies)
 */
export async function getGameParticipants(gameId: string): Promise<GameParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('status', 'joined')
      .order('joined_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching game participants:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching game participants:', error);
    return [];
  }
}
