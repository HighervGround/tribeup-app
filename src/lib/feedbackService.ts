import { supabase } from './supabase';

export interface GameFeedback {
  id: string;
  game_id: string;
  user_id: string;
  rating: 'positive' | 'negative';
  comment?: string;
  created_at: string;
  user_name: string;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  positivePercentage: number;
}

export class FeedbackService {
  // Submit feedback for a game
  static async submitFeedback(
    gameId: string, 
    rating: 'positive' | 'negative', 
    comment?: string
  ): Promise<GameFeedback | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user profile for name
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, username')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile?.full_name || profile?.username || 'Anonymous';

      // Check if user already gave feedback for this game
      const { data: existingFeedback } = await supabase
        .from('game_feedback')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .single();

      if (existingFeedback) {
        // Update existing feedback
        const { data, error } = await supabase
          .from('game_feedback')
          .update({
            rating,
            comment: comment || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFeedback.id)
          .select()
          .single();

        if (error) throw error;
        return { ...data, user_name: userName };
      } else {
        // Create new feedback
        const { data, error } = await supabase
          .from('game_feedback')
          .insert({
            game_id: gameId,
            user_id: user.id,
            rating,
            comment: comment || null,
            user_name: userName
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return null;
    }
  }

  // Get feedback for a game
  static async getGameFeedback(gameId: string): Promise<GameFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('game_feedback')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }

  // Get feedback statistics for a game
  static async getFeedbackStats(gameId: string): Promise<FeedbackStats> {
    try {
      const feedback = await this.getGameFeedback(gameId);
      
      const total = feedback.length;
      const positive = feedback.filter(f => f.rating === 'positive').length;
      const negative = feedback.filter(f => f.rating === 'negative').length;
      const positivePercentage = total > 0 ? Math.round((positive / total) * 100) : 0;

      return {
        total,
        positive,
        negative,
        positivePercentage
      };
    } catch (error) {
      console.error('Error calculating feedback stats:', error);
      return {
        total: 0,
        positive: 0,
        negative: 0,
        positivePercentage: 0
      };
    }
  }

  // Get user's feedback for a specific game
  static async getUserFeedback(gameId: string): Promise<GameFeedback | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('game_feedback')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      return null;
    }
  }

  // Delete feedback (only by the user who created it)
  static async deleteFeedback(feedbackId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('game_feedback')
        .delete()
        .eq('id', feedbackId)
        .eq('user_id', user.id); // Ensure user can only delete their own feedback

      return !error;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return false;
    }
  }

  // Get feedback summary text
  static getFeedbackSummary(stats: FeedbackStats): string {
    if (stats.total === 0) {
      return 'No feedback yet';
    }

    if (stats.positivePercentage >= 80) {
      return `Great game! ${stats.positivePercentage}% positive (${stats.total} reviews)`;
    } else if (stats.positivePercentage >= 60) {
      return `Good game! ${stats.positivePercentage}% positive (${stats.total} reviews)`;
    } else {
      return `${stats.positivePercentage}% positive (${stats.total} reviews)`;
    }
  }

  // Get feedback emoji based on rating
  static getFeedbackEmoji(rating: 'positive' | 'negative'): string {
    return rating === 'positive' ? '👍' : '👎';
  }

  // Check if user participated in game (required for feedback)
  static async canUserProvideFeedback(gameId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user was a participant or creator
      const { data: game } = await supabase
        .from('games')
        .select('creator_id')
        .eq('id', gameId)
        .single();

      if (game?.creator_id === user.id) return true;

      const { data: participant } = await supabase
        .from('game_participants')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .single();

      return !!participant;
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      return false;
    }
  }
}
