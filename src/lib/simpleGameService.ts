/**
 * SIMPLE Game Service - No timeouts, no complex joins, just works
 * 
 * This is what we should have built from the start.
 */

import { supabase } from './supabase';

export class SimpleGameService {
  
  /**
   * Get games - the simple way that actually works
   */
  static async getGames() {
    console.log('🎯 [Simple] Getting games the easy way...');
    
    try {
      // Step 1: Just get the damn games
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(50);
        
      if (error) throw error;
      
      console.log(`✅ [Simple] Got ${games.length} games in one query`);
      return games || [];
      
    } catch (error) {
      console.error('❌ [Simple] Failed:', error);
      
      // Return empty array instead of crashing
      return [];
    }
  }
  
  /**
   * Get single game - the simple way
   */
  static async getGame(gameId: string) {
    console.log('🎯 [Simple] Getting game:', gameId);
    
    try {
      const { data: game, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (error) throw error;
      
      console.log('✅ [Simple] Got game');
      return game;
      
    } catch (error) {
      console.error('❌ [Simple] Failed:', error);
      return null;
    }
  }
  
  /**
   * Check if user joined game - separate simple query
   */
  static async isUserJoined(gameId: string, userId: string) {
    if (!userId) return false;
    
    try {
      const { data } = await supabase
        .from('game_participants')
        .select('user_id')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle();
        
      return !!data;
    } catch (error) {
      console.error('❌ [Simple] Join check failed:', error);
      return false;
    }
  }
  
  /**
   * Get current user - simple, no timeouts
   */
  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('❌ [Simple] Auth failed:', error);
      return null;
    }
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).simpleGameService = SimpleGameService;
}
