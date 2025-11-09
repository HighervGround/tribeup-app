import { supabase } from '@/core/database/supabase';
import { EloService } from '@/domains/users/services/eloService';

// Types for moderation system
export interface PlayerBehavior {
  id: string;
  user_id: string;
  behavior_type: 'no_show' | 'late_arrival' | 'early_leave' | 'disruptive' | 'positive' | 'helpful';
  game_id?: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  reported_by?: string;
  auto_detected: boolean;
  created_at: string;
}

export interface PlayerPenalty {
  id: string;
  user_id: string;
  penalty_type: 'warning' | 'temporary_ban' | 'skill_restriction' | 'reputation_penalty';
  reason: string;
  severity: 'minor' | 'moderate' | 'severe';
  duration_hours?: number;
  active: boolean;
  auto_applied: boolean;
  applied_by?: string;
  expires_at?: string;
  created_at: string;
}

export interface ModerationAction {
  behavior: PlayerBehavior;
  penalties: PlayerPenalty[];
  reputation_impact: number;
  notification_sent: boolean;
}

// Penalty configurations based on behavior patterns
const PENALTY_RULES = {
  no_show: {
    first_offense: { type: 'warning', duration: 0, reputation_penalty: -5 },
    second_offense: { type: 'reputation_penalty', duration: 0, reputation_penalty: -10 },
    third_offense: { type: 'temporary_ban', duration: 24, reputation_penalty: -15 },
    chronic_offender: { type: 'temporary_ban', duration: 72, reputation_penalty: -25 }
  },
  late_arrival: {
    first_offense: { type: 'warning', duration: 0, reputation_penalty: -2 },
    repeated: { type: 'reputation_penalty', duration: 0, reputation_penalty: -5 },
    chronic: { type: 'temporary_ban', duration: 12, reputation_penalty: -10 }
  },
  disruptive: {
    minor: { type: 'warning', duration: 0, reputation_penalty: -10 },
    moderate: { type: 'temporary_ban', duration: 48, reputation_penalty: -20 },
    severe: { type: 'temporary_ban', duration: 168, reputation_penalty: -35 }
  },
  early_leave: {
    first_offense: { type: 'warning', duration: 0, reputation_penalty: -3 },
    repeated: { type: 'reputation_penalty', duration: 0, reputation_penalty: -8 }
  }
};

export class ModerationService {

  // Automatically detect no-shows for games that have ended
  static async detectNoShows(): Promise<ModerationAction[]> {
    try {
      const actions: ModerationAction[] = [];
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 2); // 2 hours after game time

      // Find games that ended more than 2 hours ago without results
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          id, title, sport, date, time,
          game_participants(user_id, user:users(full_name, email))
        `)
        .lt('date', cutoffTime.toISOString().split('T')[0])
        .not('id', 'in', `(SELECT game_id FROM game_results)`);

      if (error) throw error;

      for (const game of games || []) {
        const gameDateTime = new Date(`${game.date}T${game.time}`);
        
        // Only process games that ended more than 2 hours ago
        if (gameDateTime.getTime() + (2 * 60 * 60 * 1000) > Date.now()) {
          continue;
        }

        // Process each participant as potential no-show
        for (const participant of game.game_participants || []) {
          const action = await this.processNoShow(participant.user_id, game.id, game.title);
          if (action) {
            actions.push(action);
          }
        }

        // Mark game as processed by creating a no-show result
        await supabase
          .from('game_results')
          .insert({
            game_id: game.id,
            result_type: 'no_show',
            recorded_by: null
          });
      }

      return actions;
    } catch (error) {
      console.error('Error detecting no-shows:', error);
      return [];
    }
  }

  // Process a no-show incident
  private static async processNoShow(userId: string, gameId: string, gameTitle: string): Promise<ModerationAction | null> {
    try {
      // Record the behavior
      const behavior = await this.recordBehavior({
        user_id: userId,
        behavior_type: 'no_show',
        game_id: gameId,
        severity: 'moderate',
        description: `No-show detected for game: ${gameTitle}`,
        auto_detected: true
      });

      // Get user's no-show history
      const { data: history } = await supabase
        .from('player_behavior')
        .select('*')
        .eq('user_id', userId)
        .eq('behavior_type', 'no_show')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      const recentNoShows = history?.length || 0;
      let penaltyRule;

      if (recentNoShows >= 4) {
        penaltyRule = PENALTY_RULES.no_show.chronic_offender;
      } else if (recentNoShows === 3) {
        penaltyRule = PENALTY_RULES.no_show.third_offense;
      } else if (recentNoShows === 2) {
        penaltyRule = PENALTY_RULES.no_show.second_offense;
      } else {
        penaltyRule = PENALTY_RULES.no_show.first_offense;
      }

      // Apply penalty
      const penalties = await this.applyPenalty(userId, {
        type: penaltyRule.type as any,
        reason: `No-show penalty (${recentNoShows + 1} recent incidents)`,
        severity: 'moderate',
        duration_hours: penaltyRule.duration,
        auto_applied: true
      });

      // Update reputation
      await this.updateReputation(userId, penaltyRule.reputation_penalty, 'no_show');

      // Send notification
      await this.sendModerationNotification(userId, {
        type: 'penalty_applied',
        title: 'No-Show Penalty Applied',
        message: `You've received a penalty for not showing up to "${gameTitle}". Please be more reliable to maintain your reputation.`,
        penalty_type: penaltyRule.type,
        duration_hours: penaltyRule.duration
      });

      return {
        behavior,
        penalties,
        reputation_impact: penaltyRule.reputation_penalty,
        notification_sent: true
      };
    } catch (error) {
      console.error('Error processing no-show:', error);
      return null;
    }
  }

  // Record player behavior
  static async recordBehavior(behaviorData: {
    user_id: string;
    behavior_type: PlayerBehavior['behavior_type'];
    game_id?: string;
    severity: PlayerBehavior['severity'];
    description: string;
    reported_by?: string;
    auto_detected?: boolean;
  }): Promise<PlayerBehavior> {
    const { data, error } = await supabase
      .from('player_behavior')
      .insert({
        ...behaviorData,
        auto_detected: behaviorData.auto_detected || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Apply penalty to a player
  static async applyPenalty(userId: string, penaltyData: {
    type: PlayerPenalty['penalty_type'];
    reason: string;
    severity: PlayerPenalty['severity'];
    duration_hours?: number;
    auto_applied?: boolean;
    applied_by?: string;
  }): Promise<PlayerPenalty[]> {
    const expiresAt = penaltyData.duration_hours 
      ? new Date(Date.now() + penaltyData.duration_hours * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('player_penalties')
      .insert({
        user_id: userId,
        penalty_type: penaltyData.type,
        reason: penaltyData.reason,
        severity: penaltyData.severity,
        duration_hours: penaltyData.duration_hours,
        active: true,
        auto_applied: penaltyData.auto_applied || false,
        applied_by: penaltyData.applied_by,
        expires_at: expiresAt
      })
      .select();

    if (error) throw error;
    return data || [];
  }

  // Update player reputation
  static async updateReputation(userId: string, reputationChange: number, reason: string): Promise<void> {
    try {
      // Get current reputation or create new record
      let { data: reputation } = await supabase
        .from('player_reputation')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!reputation) {
        reputation = await EloService.initializePlayerReputation(userId);
      }

      const newScore = Math.max(0, Math.min(100, reputation.reputation_score + reputationChange));
      
      // Update reputation based on behavior type
      const updates: any = {
        reputation_score: newScore,
        last_updated: new Date().toISOString()
      };

      if (reason === 'no_show') {
        updates.no_shows = reputation.no_shows + 1;
        updates.reliability_score = Math.max(0, reputation.reliability_score - 5);
      } else if (reason === 'late_arrival') {
        updates.late_arrivals = reputation.late_arrivals + 1;
        updates.reliability_score = Math.max(0, reputation.reliability_score - 2);
      } else if (reason === 'disruptive') {
        updates.negative_feedback = reputation.negative_feedback + 1;
        updates.sportsmanship_score = Math.max(0, reputation.sportsmanship_score - 10);
      } else if (reason === 'positive') {
        updates.positive_feedback = reputation.positive_feedback + 1;
        updates.sportsmanship_score = Math.min(100, reputation.sportsmanship_score + 5);
      }

      await supabase
        .from('player_reputation')
        .update(updates)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating reputation:', error);
      throw error;
    }
  }

  // Report player behavior manually
  static async reportPlayerBehavior(
    reportedUserId: string,
    reporterUserId: string,
    behaviorData: {
      behavior_type: PlayerBehavior['behavior_type'];
      game_id?: string;
      severity: PlayerBehavior['severity'];
      description: string;
    }
  ): Promise<ModerationAction> {
    try {
      // Record the behavior report
      const behavior = await this.recordBehavior({
        user_id: reportedUserId,
        reported_by: reporterUserId,
        auto_detected: false,
        ...behaviorData
      });

      // Get recent behavior history for this user
      const { data: recentBehavior } = await supabase
        .from('player_behavior')
        .select('*')
        .eq('user_id', reportedUserId)
        .eq('behavior_type', behaviorData.behavior_type)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      const recentIncidents = recentBehavior?.length || 0;
      let penalties: PlayerPenalty[] = [];
      let reputationImpact = 0;

      // Apply automatic penalties based on behavior type and history
      if (behaviorData.behavior_type === 'disruptive') {
        const rule = PENALTY_RULES.disruptive[behaviorData.severity];
        penalties = await this.applyPenalty(reportedUserId, {
          type: rule.type as any,
          reason: `Disruptive behavior reported: ${behaviorData.description}`,
          severity: behaviorData.severity,
          duration_hours: rule.duration,
          auto_applied: true
        });
        reputationImpact = rule.reputation_penalty;
        await this.updateReputation(reportedUserId, reputationImpact, 'disruptive');
      } else if (behaviorData.behavior_type === 'late_arrival' && recentIncidents >= 2) {
        const rule = PENALTY_RULES.late_arrival.chronic;
        penalties = await this.applyPenalty(reportedUserId, {
          type: rule.type as any,
          reason: `Chronic late arrivals (${recentIncidents + 1} recent incidents)`,
          severity: 'moderate',
          duration_hours: rule.duration,
          auto_applied: true
        });
        reputationImpact = rule.reputation_penalty;
        await this.updateReputation(reportedUserId, reputationImpact, 'late_arrival');
      }

      // Send notification to reported player
      await this.sendModerationNotification(reportedUserId, {
        type: 'behavior_reported',
        title: 'Behavior Report Filed',
        message: `A report has been filed regarding your behavior: ${behaviorData.description}`,
        penalty_type: penalties[0]?.penalty_type,
        duration_hours: penalties[0]?.duration_hours
      });

      // Notify reporter that action was taken
      await this.sendModerationNotification(reporterUserId, {
        type: 'report_processed',
        title: 'Report Processed',
        message: 'Thank you for your report. Appropriate action has been taken.',
        penalty_type: undefined,
        duration_hours: undefined
      });

      return {
        behavior,
        penalties,
        reputation_impact: reputationImpact,
        notification_sent: true
      };
    } catch (error) {
      console.error('Error reporting player behavior:', error);
      throw error;
    }
  }

  // Send moderation notification
  private static async sendModerationNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    penalty_type?: string;
    duration_hours?: number;
  }): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: {
            penalty_type: notification.penalty_type,
            duration_hours: notification.duration_hours
          },
          read: false
        });
    } catch (error) {
      console.error('Error sending moderation notification:', error);
    }
  }

  // Get player's active penalties
  static async getActivePenalties(userId: string): Promise<PlayerPenalty[]> {
    try {
      const { data, error } = await supabase
        .from('player_penalties')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active penalties:', error);
      return [];
    }
  }

  // Check if player is currently banned
  static async isPlayerBanned(userId: string): Promise<{
    banned: boolean;
    reason?: string;
    expires_at?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('player_penalties')
        .select('*')
        .eq('user_id', userId)
        .eq('penalty_type', 'temporary_ban')
        .eq('active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        return {
          banned: true,
          reason: data[0].reason,
          expires_at: data[0].expires_at
        };
      }

      return { banned: false };
    } catch (error) {
      console.error('Error checking ban status:', error);
      return { banned: false };
    }
  }

  // Expire old penalties
  static async expirePenalties(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('player_penalties')
        .update({ active: false })
        .eq('active', true)
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error expiring penalties:', error);
      return 0;
    }
  }

  // Get moderation statistics for admin dashboard
  static async getModerationStats(days: number = 30): Promise<{
    total_reports: number;
    auto_detected: number;
    manual_reports: number;
    active_penalties: number;
    behavior_breakdown: Record<string, number>;
    penalty_breakdown: Record<string, number>;
  }> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get behavior reports
      const { data: behaviors } = await supabase
        .from('player_behavior')
        .select('behavior_type, auto_detected')
        .gte('created_at', cutoffDate);

      // Get penalties
      const { data: penalties } = await supabase
        .from('player_penalties')
        .select('penalty_type, active')
        .gte('created_at', cutoffDate);

      const behaviorBreakdown: Record<string, number> = {};
      const penaltyBreakdown: Record<string, number> = {};
      
      let autoDetected = 0;
      let manualReports = 0;

      behaviors?.forEach(behavior => {
        behaviorBreakdown[behavior.behavior_type] = (behaviorBreakdown[behavior.behavior_type] || 0) + 1;
        if (behavior.auto_detected) {
          autoDetected++;
        } else {
          manualReports++;
        }
      });

      let activePenalties = 0;
      penalties?.forEach(penalty => {
        penaltyBreakdown[penalty.penalty_type] = (penaltyBreakdown[penalty.penalty_type] || 0) + 1;
        if (penalty.active) {
          activePenalties++;
        }
      });

      return {
        total_reports: behaviors?.length || 0,
        auto_detected: autoDetected,
        manual_reports: manualReports,
        active_penalties: activePenalties,
        behavior_breakdown: behaviorBreakdown,
        penalty_breakdown: penaltyBreakdown
      };
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      return {
        total_reports: 0,
        auto_detected: 0,
        manual_reports: 0,
        active_penalties: 0,
        behavior_breakdown: {},
        penalty_breakdown: {}
      };
    }
  }

  // Appeal a penalty (for future implementation)
  static async appealPenalty(penaltyId: string, userId: string, reason: string): Promise<void> {
    try {
      // Create an appeal record (would need new table)
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'penalty_appeal_submitted',
          title: 'Penalty Appeal Submitted',
          message: `Your appeal for penalty ${penaltyId} has been submitted and will be reviewed by moderators.`,
          data: { penalty_id: penaltyId, appeal_reason: reason },
          read: false
        });

      // Notify moderators (would need admin notification system)
      console.log(`Penalty appeal submitted for penalty ${penaltyId} by user ${userId}`);
    } catch (error) {
      console.error('Error submitting penalty appeal:', error);
      throw error;
    }
  }
}
