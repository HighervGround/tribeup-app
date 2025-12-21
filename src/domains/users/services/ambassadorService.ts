import { supabase } from '@/core/database/supabase';
import { toast } from 'sonner';

export interface CampusAmbassador {
  id: string;
  user_id: string;
  campus_name: string;
  university: string;
  application_status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  reviewed_by?: string | null;
  profile_verified: boolean;
  badge_level: string;
  referral_code?: string | null;
  referral_goal: number;
  referral_count: number;
  events_hosted: number;
  meetups_attended: number;
  application_data?: Record<string, any> | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmbassadorReferralStats {
  user_id: string;
  referral_code: string | null;
  clicks: number;
  signups: number;
  conversions: number;
}

export const AmbassadorService = {
  async getAmbassadorProfile(userId: string): Promise<CampusAmbassador | null> {
    const { data, error } = await supabase
      .from('campus_ambassadors')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[AmbassadorService] getAmbassadorProfile error:', error);
      return null;
    }
    return (data as any) || null;
  },

  async applyForAmbassador(userId: string, payload: {
    campus_name: string;
    university?: string;
    application_data?: Record<string, any>;
  }): Promise<CampusAmbassador> {
    const { data, error } = await supabase
      .from('campus_ambassadors')
      .insert({
        user_id: userId,
        campus_name: payload.campus_name,
        university: payload.university || 'University of Florida',
        application_data: payload.application_data || {},
      })
      .select('*')
      .single();

    if (error) {
      console.error('[AmbassadorService] applyForAmbassador error:', error);
      throw error;
    }
    toast.success('Application submitted! We will review soon.');
    return data as any;
  },

  async ensureReferralCode(userId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('ensure_ambassador_referral_code', { p_user_id: userId });
    if (error) {
      console.error('[AmbassadorService] ensureReferralCode error:', error);
      return null;
    }

    // Refresh profile after code generation
    return (data as any) || null;
  },

  async getReferralStats(userId: string): Promise<AmbassadorReferralStats | null> {
    const { data, error } = await supabase
      .from('ambassador_referral_stats')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[AmbassadorService] getReferralStats error:', error);
      return null;
    }
    return (data as any) || null;
  },

  async approveApplication(applicationId: string, reviewerUserId: string): Promise<void> {
    const { error } = await supabase.rpc('approve_ambassador_application', {
      p_application_id: applicationId,
      p_reviewer: reviewerUserId,
    });
    if (error) {
      console.error('[AmbassadorService] approveApplication error:', error);
      throw error;
    }
    toast.success('Ambassador application approved.');
  },
};
