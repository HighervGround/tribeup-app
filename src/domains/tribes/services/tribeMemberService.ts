import { supabase } from '@/core/database/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/core/database/database.types';

export type TribeMember = Tables<'tribe_members'>;
export type TribeMemberInsert = TablesInsert<'tribe_members'>;
export type TribeMemberUpdate = TablesUpdate<'tribe_members'>;

export interface TribeMemberWithProfile extends TribeMember {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export class TribeMemberService {
  /**
   * Join a tribe
   */
  static async joinTribe(tribeId: string, userId: string): Promise<TribeMember> {
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .insert({
          tribe_id: tribeId,
          user_id: userId,
          role: 'member',
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error joining tribe:', error);
      throw error;
    }
  }

  /**
   * Leave a tribe
   */
  static async leaveTribe(tribeId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tribe_members')
        .update({ status: 'left' })
        .eq('tribe_id', tribeId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving tribe:', error);
      throw error;
    }
  }

  /**
   * Get tribe members
   */
  static async getTribeMembers(tribeId: string): Promise<TribeMemberWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('tribe_member_details')
        .select('*')
        .eq('tribe_id', tribeId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TribeMemberWithProfile[];
    } catch (error) {
      console.error('Error fetching tribe members:', error);
      throw error;
    }
  }

  /**
   * Check if user is member of tribe
   */
  static async isMember(tribeId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select('id')
        .eq('tribe_id', tribeId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  /**
   * Get user's role in tribe
   */
  static async getUserRole(tribeId: string, userId: string): Promise<'member' | 'moderator' | 'admin' | null> {
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select('role')
        .eq('tribe_id', tribeId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  /**
   * Update member role (admin/moderator only)
   */
  static async updateMemberRole(
    tribeId: string,
    memberId: string,
    newRole: 'member' | 'moderator' | 'admin'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('tribe_members')
        .update({ role: newRole })
        .eq('tribe_id', tribeId)
        .eq('user_id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Remove member from tribe (admin/moderator only)
   */
  static async removeMember(tribeId: string, memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tribe_members')
        .update({ status: 'removed' })
        .eq('tribe_id', tribeId)
        .eq('user_id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }
}

