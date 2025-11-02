import { supabase } from '@/core/database/supabase';

// Types for ELO system
export interface PlayerEloRating {
  id: string;
  user_id: string;
  sport: string;
  elo_rating: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  last_updated: string;
  created_at: string;
}

export interface GameResult {
  id: string;
  game_id: string;
  result_type: 'completed' | 'cancelled' | 'no_show';
  winning_team?: string[];
  losing_team?: string[];
  individual_winner?: string;
  individual_loser?: string;
  is_draw: boolean;
  recorded_by: string;
  elo_changes: Record<string, number>;
}

export interface PlayerReputation {
  id: string;
  user_id: string;
  reputation_score: number;
  reliability_score: number;
  sportsmanship_score: number;
  total_games: number;
  no_shows: number;
  late_arrivals: number;
  positive_feedback: number;
  negative_feedback: number;
}

export interface MatchmakingPreferences {
  user_id: string;
  skill_matching_enabled: boolean;
  preferred_skill_range: number;
  competitive_mode: boolean;
  allow_mixed_skill: boolean;
  reputation_threshold: number;
}

// Sport-specific configurations
const SPORT_CONFIGS = {
  basketball: {
    k_factor: 32,
    team_size: 5,
    skill_variance: 150, // ELO range for balanced games
    competitive_threshold: 1400,
  },
  soccer: {
    k_factor: 28,
    team_size: 11,
    skill_variance: 200,
    competitive_threshold: 1350,
  },
  tennis: {
    k_factor: 40,
    team_size: 1,
    skill_variance: 100,
    competitive_threshold: 1500,
  },
  volleyball: {
    k_factor: 30,
    team_size: 6,
    skill_variance: 175,
    competitive_threshold: 1375,
  },
  baseball: {
    k_factor: 25,
    team_size: 9,
    skill_variance: 225,
    competitive_threshold: 1300,
  },
  default: {
    k_factor: 32,
    team_size: 1,
    skill_variance: 150,
    competitive_threshold: 1400,
  }
};

export class EloService {
  
  // Get sport configuration
  private static getSportConfig(sport: string) {
    return SPORT_CONFIGS[sport.toLowerCase() as keyof typeof SPORT_CONFIGS] || SPORT_CONFIGS.default;
  }

  // Calculate ELO change using standard formula with sport-specific K-factor
  static calculateEloChange(
    currentRating: number,
    opponentRating: number,
    result: number, // 1 for win, 0.5 for draw, 0 for loss
    sport: string,
    gamesPlayed: number = 0
  ): number {
    const config = this.getSportConfig(sport);
    
    // Adjust K-factor based on games played (higher for new players)
    let kFactor = config.k_factor;
    if (gamesPlayed < 10) {
      kFactor = Math.round(kFactor * 1.5); // 50% higher for new players
    } else if (gamesPlayed < 30) {
      kFactor = Math.round(kFactor * 1.2); // 20% higher for developing players
    }

    // Calculate expected score
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    
    // Calculate rating change
    const ratingChange = Math.round(kFactor * (result - expectedScore));
    
    return ratingChange;
  }

  // Get player's ELO rating for a specific sport
  static async getPlayerElo(userId: string, sport: string): Promise<PlayerEloRating | null> {
    try {
      const { data, error } = await supabase
        .from('player_elo_ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('sport', sport.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching player ELO:', error);
      return null;
    }
  }

  // Initialize ELO rating for new player
  static async initializePlayerElo(userId: string, sport: string): Promise<PlayerEloRating> {
    const { data, error } = await supabase
      .from('player_elo_ratings')
      .insert({
        user_id: userId,
        sport: sport.toLowerCase(),
        elo_rating: 1200, // Standard starting ELO
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update player ELO after game result
  static async updatePlayerElo(
    userId: string,
    sport: string,
    opponentRating: number,
    result: number
  ): Promise<void> {
    try {
      // Get current rating or create new one
      let playerElo = await this.getPlayerElo(userId, sport);
      
      if (!playerElo) {
        playerElo = await this.initializePlayerElo(userId, sport);
      }

      // Calculate ELO change
      const eloChange = this.calculateEloChange(
        playerElo.elo_rating,
        opponentRating,
        result,
        sport,
        playerElo.games_played
      );

      const newElo = Math.max(100, playerElo.elo_rating + eloChange); // Minimum ELO of 100

      // Update database
      const { error } = await supabase
        .from('player_elo_ratings')
        .update({
          elo_rating: newElo,
          games_played: playerElo.games_played + 1,
          wins: playerElo.wins + (result === 1 ? 1 : 0),
          losses: playerElo.losses + (result === 0 ? 1 : 0),
          draws: playerElo.draws + (result === 0.5 ? 1 : 0),
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('sport', sport.toLowerCase());

      if (error) throw error;
    } catch (error) {
      console.error('Error updating player ELO:', error);
      throw error;
    }
  }

  // Record game result and update all player ELOs
  static async recordGameResult(
    gameId: string,
    resultType: 'completed' | 'cancelled' | 'no_show',
    gameData: {
      sport: string;
      participants: string[];
      winners?: string[];
      losers?: string[];
      isDraw?: boolean;
    },
    recordedBy: string
  ): Promise<void> {
    try {
      const { sport, participants, winners = [], losers = [], isDraw = false } = gameData;
      const eloChanges: Record<string, number> = {};

      if (resultType === 'completed' && !isDraw) {
        // Calculate average ELO for each team
        const winnerElos = await Promise.all(
          winners.map(async (userId) => {
            const elo = await this.getPlayerElo(userId, sport);
            return elo?.elo_rating || 1200;
          })
        );

        const loserElos = await Promise.all(
          losers.map(async (userId) => {
            const elo = await this.getPlayerElo(userId, sport);
            return elo?.elo_rating || 1200;
          })
        );

        const avgWinnerElo = winnerElos.reduce((sum, elo) => sum + elo, 0) / winnerElos.length;
        const avgLoserElo = loserElos.reduce((sum, elo) => sum + elo, 0) / loserElos.length;

        // Update ELO for winners
        for (const userId of winners) {
          await this.updatePlayerElo(userId, sport, avgLoserElo, 1);
          const playerElo = await this.getPlayerElo(userId, sport);
          eloChanges[userId] = this.calculateEloChange(
            (playerElo?.elo_rating || 1200) - this.calculateEloChange(playerElo?.elo_rating || 1200, avgLoserElo, 1, sport),
            avgLoserElo,
            1,
            sport
          );
        }

        // Update ELO for losers
        for (const userId of losers) {
          await this.updatePlayerElo(userId, sport, avgWinnerElo, 0);
          const playerElo = await this.getPlayerElo(userId, sport);
          eloChanges[userId] = this.calculateEloChange(
            (playerElo?.elo_rating || 1200) - this.calculateEloChange(playerElo?.elo_rating || 1200, avgWinnerElo, 0, sport),
            avgWinnerElo,
            0,
            sport
          );
        }
      } else if (resultType === 'completed' && isDraw) {
        // Handle draws - all participants get 0.5 result
        const allElos = await Promise.all(
          participants.map(async (userId) => {
            const elo = await this.getPlayerElo(userId, sport);
            return elo?.elo_rating || 1200;
          })
        );

        const avgElo = allElos.reduce((sum, elo) => sum + elo, 0) / allElos.length;

        for (const userId of participants) {
          await this.updatePlayerElo(userId, sport, avgElo, 0.5);
          eloChanges[userId] = 0; // Draws typically result in minimal ELO change
        }
      }

      // Record the game result
      const { error } = await supabase
        .from('game_results')
        .insert({
          game_id: gameId,
          result_type: resultType,
          winning_team: winners.length > 0 ? winners : null,
          losing_team: losers.length > 0 ? losers : null,
          is_draw: isDraw,
          recorded_by: recordedBy,
          elo_changes: eloChanges
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording game result:', error);
      throw error;
    }
  }

  // Get player reputation
  static async getPlayerReputation(userId: string): Promise<PlayerReputation | null> {
    try {
      const { data, error } = await supabase
        .from('player_reputation')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching player reputation:', error);
      return null;
    }
  }

  // Initialize player reputation
  static async initializePlayerReputation(userId: string): Promise<PlayerReputation> {
    const { data, error } = await supabase
      .from('player_reputation')
      .insert({
        user_id: userId,
        reputation_score: 100,
        reliability_score: 100,
        sportsmanship_score: 100,
        total_games: 0,
        no_shows: 0,
        late_arrivals: 0,
        positive_feedback: 0,
        negative_feedback: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Check if player meets game requirements
  static async playerMeetsGameRequirements(userId: string, gameId: string): Promise<{
    eligible: boolean;
    reasons: string[];
  }> {
    try {
      const { data: canJoin, error } = await supabase.rpc('player_meets_game_requirements', {
        p_user_id: userId,
        p_game_id: gameId
      });

      if (error) throw error;

      if (canJoin) {
        return { eligible: true, reasons: [] };
      }

      // Get detailed reasons if not eligible
      const reasons: string[] = [];
      
      // Check for active penalties
      const { data: penalties } = await supabase
        .from('player_penalties')
        .select('penalty_type, reason, expires_at')
        .eq('user_id', userId)
        .eq('active', true);

      if (penalties && penalties.length > 0) {
        penalties.forEach(penalty => {
          if (!penalty.expires_at || new Date(penalty.expires_at) > new Date()) {
            reasons.push(`Active penalty: ${penalty.reason}`);
          }
        });
      }

      // Check game requirements vs player stats
      const { data: game } = await supabase
        .from('games')
        .select('skill_level, min_elo_rating, max_elo_rating, min_reputation, sport')
        .eq('id', gameId)
        .single();

      if (game) {
        const playerElo = await this.getPlayerElo(userId, game.sport);
        const playerReputation = await this.getPlayerReputation(userId);

        if (game.min_elo_rating && (!playerElo || playerElo.elo_rating < game.min_elo_rating)) {
          reasons.push(`ELO rating too low (required: ${game.min_elo_rating}, current: ${playerElo?.elo_rating || 1200})`);
        }

        if (game.max_elo_rating && playerElo && playerElo.elo_rating > game.max_elo_rating) {
          reasons.push(`ELO rating too high (maximum: ${game.max_elo_rating}, current: ${playerElo.elo_rating})`);
        }

        if (game.min_reputation && (!playerReputation || playerReputation.reputation_score < game.min_reputation)) {
          reasons.push(`Reputation too low (required: ${game.min_reputation}, current: ${playerReputation?.reputation_score || 100})`);
        }
      }

      return { eligible: false, reasons };
    } catch (error) {
      console.error('Error checking game requirements:', error);
      return { eligible: false, reasons: ['Error checking eligibility'] };
    }
  }

  // Get matchmaking preferences
  static async getMatchmakingPreferences(userId: string): Promise<MatchmakingPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('matchmaking_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching matchmaking preferences:', error);
      return null;
    }
  }

  // Update matchmaking preferences
  static async updateMatchmakingPreferences(
    userId: string,
    preferences: Partial<MatchmakingPreferences>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('matchmaking_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating matchmaking preferences:', error);
      throw error;
    }
  }

  // Find suitable games for a player based on skill and preferences
  static async findSuitableGames(userId: string, sport?: string): Promise<any[]> {
    try {
      const preferences = await this.getMatchmakingPreferences(userId);
      const playerElo = sport ? await this.getPlayerElo(userId, sport) : null;
      
      let query = supabase
        .from('games')
        .select(`
          *,
          creator:users!creator_id(full_name, username, avatar_url),
          game_participants(user_id)
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Filter by sport if specified
      if (sport) {
        query = query.eq('sport', sport.toLowerCase());
      }

      const { data: games, error } = await query;
      if (error) throw error;

      if (!games) return [];

      // Filter games based on skill matching and preferences
      const suitableGames = [];

      for (const game of games) {
        // Skip if already joined
        if (game.game_participants?.some((p: any) => p.user_id === userId)) {
          continue;
        }

        // Check basic eligibility
        const eligibility = await this.playerMeetsGameRequirements(userId, game.id);
        if (!eligibility.eligible) {
          continue;
        }

        // Apply skill-based filtering if enabled
        if (preferences?.skill_matching_enabled && playerElo) {
          const config = this.getSportConfig(game.sport);
          const skillRange = preferences.preferred_skill_range || config.skill_variance;

          if (game.min_elo_rating && Math.abs(playerElo.elo_rating - game.min_elo_rating) > skillRange) {
            continue;
          }

          if (game.max_elo_rating && Math.abs(playerElo.elo_rating - game.max_elo_rating) > skillRange) {
            continue;
          }

          // For competitive mode, apply stricter matching
          if (preferences.competitive_mode && game.competitive_mode) {
            const strictRange = skillRange * 0.6; // 40% tighter range
            if (game.min_elo_rating && Math.abs(playerElo.elo_rating - game.min_elo_rating) > strictRange) {
              continue;
            }
          }
        }

        suitableGames.push({
          ...game,
          skill_match_score: this.calculateSkillMatchScore(playerElo?.elo_rating || 1200, game, sport || game.sport)
        });
      }

      // Sort by skill match score (higher is better)
      return suitableGames.sort((a, b) => b.skill_match_score - a.skill_match_score);
    } catch (error) {
      console.error('Error finding suitable games:', error);
      return [];
    }
  }

  // Calculate how well a player matches a game's skill requirements
  private static calculateSkillMatchScore(playerElo: number, game: any, sport: string): number {
    const config = this.getSportConfig(sport);
    let score = 100; // Base score

    // Penalize for ELO mismatches
    if (game.min_elo_rating) {
      const diff = Math.abs(playerElo - game.min_elo_rating);
      score -= Math.min(50, diff / 10); // Reduce score based on ELO difference
    }

    if (game.max_elo_rating) {
      const diff = Math.abs(playerElo - game.max_elo_rating);
      score -= Math.min(50, diff / 10);
    }

    // Bonus for competitive players in competitive games
    if (game.competitive_mode && playerElo > config.competitive_threshold) {
      score += 20;
    }

    // Bonus for skill level match
    const skillLevelBonus = {
      'beginner': playerElo < 1100 ? 15 : -10,
      'intermediate': playerElo >= 1100 && playerElo <= 1400 ? 15 : -5,
      'advanced': playerElo > 1400 ? 15 : -10,
      'mixed': 10, // Always good for mixed games
      'competitive': playerElo > config.competitive_threshold ? 20 : -15
    };

    if (game.skill_level && skillLevelBonus[game.skill_level as keyof typeof skillLevelBonus] !== undefined) {
      score += skillLevelBonus[game.skill_level as keyof typeof skillLevelBonus];
    }

    return Math.max(0, score);
  }

  // Get player's skill level based on ELO
  static getSkillLevel(eloRating: number, sport: string): string {
    const config = this.getSportConfig(sport);
    
    if (eloRating < 1100) return 'beginner';
    if (eloRating < 1300) return 'intermediate';
    if (eloRating < config.competitive_threshold) return 'advanced';
    return 'competitive';
  }

  // Get leaderboard for a sport
  static async getLeaderboard(sport: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('player_elo_ratings')
        .select(`
          *,
          user:users!user_id(full_name, username, avatar_url)
        `)
        .eq('sport', sport.toLowerCase())
        .gte('games_played', 5) // Only include players with at least 5 games
        .order('elo_rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
}
