import { supabase } from '@/core/database/supabase';

export interface GameParticipant {
  id: string;
  game_id: string;
  user_id: string;
  status: 'joined' | 'left' | 'kicked' | 'banned';
  joined_at: string;
  left_at?: string;
}

/**
 * Join a game - inserts participant record with status 'going'
 * Uses ignore-duplicates to handle re-joins gracefully (no UPDATE policy needed)
 * Client must explicitly include user_id equal to auth.uid()
 */
export async function joinGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🎯 Joining game: ${gameId}`);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Must be logged in to join games' };
    }
    
    // Insert with explicit user_id (required for RLS policy)
    // Using upsert with onConflict will perform UPDATE if exists (requires UPDATE policy)
    const { error } = await supabase
      .from('game_participants')
      .upsert(
        {
          game_id: gameId,
          user_id: user.id, // Explicitly include user_id
          status: 'joined' // Database expects: 'joined' | 'left' | 'completed' | 'no_show'
        },
        {
          onConflict: 'game_id,user_id'
        }
      );
      
    if (error) {
      console.error('❌ Join game failed:', error);
      
      // Handle specific error cases
      if (error.code === '23505') { // Unique constraint violation
        // This shouldn't happen with upsert, but handle it gracefully
        console.log('⚠️ Duplicate detected, user may already be in game');
        return { success: true }; // Treat as success
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('✅ Successfully joined game');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Join game error:', error);
    return { success: false, error: 'Failed to join game' };
  }
}

/**
 * Leave a game - deletes the participant row for the current user
 * Explicitly filters by user_id and game_id for clarity
 * RLS policy ensures user can only delete their own participation
 */
export async function leaveGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚪 Leaving game: ${gameId}`);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Must be logged in to leave games' };
    }
    
    // Delete the participant row - explicitly filter by both game_id and user_id
    // RLS policy will additionally enforce that user_id matches auth.uid()
    const { error } = await supabase
      .from('game_participants')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', user.id); // Explicitly include user_id filter
      
    if (error) {
      console.error('❌ Leave game failed:', error);
      
      if (error.code === 'PGRST116') { // No rows found
        return { success: false, error: 'You are not currently in this game' };
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('✅ Successfully left game');
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
    
    // RLS will automatically filter by auth.uid() for user_id
    const { data, error } = await supabase
      .from('game_participants')
      .select('id')
      .eq('game_id', gameId)
      .eq('status', 'joined')
      .maybeSingle();
      
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
