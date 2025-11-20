import { supabase } from '@/core/database/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/core/database/database.types';

export type Tribe = Tables<'tribes'>;
export type TribeInsert = TablesInsert<'tribes'>;
export type TribeUpdate = TablesUpdate<'tribes'>;

export interface TribeWithCreator extends Tribe {
  creator?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export class TribeService {
  /**
   * Get all public tribes
   */
  static async getPublicTribes(activity?: string) {
    try {
      let query = supabase
        .from('tribes')
        .select('*')
        .eq('is_public', true)
        .order('member_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (activity) {
        query = query.eq('activity', activity);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public tribes:', error);
      throw error;
    }
  }

  /**
   * Get tribe by ID
   */
  static async getTribeById(tribeId: string): Promise<Tribe | null> {
    try {
      const { data, error } = await supabase
        .from('tribes')
        .select('*')
        .eq('id', tribeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tribe:', error);
      return null;
    }
  }

  /**
   * Get tribe with creator info
   */
  static async getTribeWithCreator(tribeId: string): Promise<TribeWithCreator | null> {
    try {
      const { data: tribe, error: tribeError } = await supabase
        .from('tribes')
        .select('*')
        .eq('id', tribeId)
        .single();

      if (tribeError) throw tribeError;
      if (!tribe) return null;

      // Get creator info - use 'users' table, not 'user_profiles'
      const { data: creator } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .eq('id', tribe.creator_id)
        .single();

      return {
        ...tribe,
        creator: creator || undefined,
      };
    } catch (error) {
      console.error('Error fetching tribe with creator:', error);
      return null;
    }
  }

  /**
   * Create a new tribe
   */
  static async createTribe(tribeData: TribeInsert): Promise<Tribe> {
    try {
      const { data, error } = await supabase
        .from('tribes')
        .insert(tribeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tribe:', error);
      throw error;
    }
  }

  /**
   * Update tribe
   */
  static async updateTribe(tribeId: string, updates: TribeUpdate): Promise<Tribe> {
    try {
      const { data, error } = await supabase
        .from('tribes')
        .update(updates)
        .eq('id', tribeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating tribe:', error);
      throw error;
    }
  }

  /**
   * Delete tribe (only creator can delete)
   */
  static async deleteTribe(tribeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tribes')
        .delete()
        .eq('id', tribeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting tribe:', error);
      throw error;
    }
  }

  /**
   * Search tribes by name or activity
   */
  static async searchTribes(query: string, activity?: string) {
    try {
      let dbQuery = supabase
        .from('tribes')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_public', true)
        .order('member_count', { ascending: false })
        .limit(20);

      if (activity) {
        dbQuery = dbQuery.eq('activity', activity);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching tribes:', error);
      throw error;
    }
  }

  /**
   * Get user's tribes
   */
  static async getUserTribes(userId: string) {
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select('tribe_id, tribes(*)')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      return (data || []).map((item: any) => item.tribes).filter(Boolean);
    } catch (error) {
      console.error('Error fetching user tribes:', error);
      throw error;
    }
  }

  /**
   * Get tribe statistics
   */
  static async getTribeStatistics(tribeId: string) {
    try {
      const { data, error } = await supabase
        .from('tribe_statistics')
        .select('*')
        .eq('tribe_id', tribeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tribe statistics:', error);
      return null;
    }
  }
}

