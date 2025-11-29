import { supabase } from '@/core/database/supabase';

/**
 * Game Success Metrics Service
 * 
 * Calculates metrics to determine successful games:
 * - High participation rate (current_players / max_players)
 * - Completed games (past date with participants)
 * - High attendance (games that reached capacity or near capacity)
 */

export interface GameMetrics {
  id: string;
  title: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  imageUrl?: string;
  maxPlayers: number;
  currentPlayers: number;
  participationRate: number; // Percentage (0-100)
  isCompleted: boolean;
  isHighAttendance: boolean;
  successScore: number; // Weighted score for ranking
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
}

export interface SuccessfulGamesResult {
  games: GameMetrics[];
  loading: boolean;
  error: Error | null;
}

// Thresholds for success metrics
const PARTICIPATION_THRESHOLD = 70; // 70% or more is considered high participation
const HIGH_ATTENDANCE_THRESHOLD = 80; // 80% or more is considered high attendance

/**
 * Calculate participation rate as a percentage
 */
export function calculateParticipationRate(currentPlayers: number, maxPlayers: number): number {
  if (maxPlayers <= 0) return 0;
  return Math.round((currentPlayers / maxPlayers) * 100);
}

/**
 * Calculate success score for ranking games
 * Weighted formula:
 * - Participation rate: 50%
 * - Completed status: 30%
 * - High attendance: 20%
 */
export function calculateSuccessScore(
  participationRate: number,
  isCompleted: boolean,
  isHighAttendance: boolean
): number {
  const participationScore = participationRate * 0.5;
  const completedScore = isCompleted ? 30 : 0;
  const attendanceScore = isHighAttendance ? 20 : 0;
  
  return Math.round(participationScore + completedScore + attendanceScore);
}

/**
 * Check if a game is completed (past date)
 */
export function isGameCompleted(gameDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const gameDateObj = new Date(gameDate);
  gameDateObj.setHours(0, 0, 0, 0);
  
  return gameDateObj < today;
}

/**
 * Check if a game has high attendance
 */
export function isHighAttendance(currentPlayers: number, maxPlayers: number): boolean {
  const rate = calculateParticipationRate(currentPlayers, maxPlayers);
  return rate >= HIGH_ATTENDANCE_THRESHOLD;
}

/**
 * Fetch successful games - games with high participation, completed, or high attendance
 */
export async function getSuccessfulGames(limit: number = 10): Promise<GameMetrics[]> {
  try {
    // Fetch completed games (past date) and current games with high participation
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch games from games_with_counts view
    const { data: gamesData, error: gamesError } = await supabase
      .from('games_with_counts')
      .select(`
        id, title, sport, date, time, location, image_url,
        max_players, current_players, creator_id
      `)
      .order('date', { ascending: false })
      .limit(50); // Fetch more to filter and sort

    if (gamesError) {
      console.error('❌ [getSuccessfulGames] Error fetching games:', gamesError);
      throw gamesError;
    }

    if (!gamesData || gamesData.length === 0) {
      return [];
    }

    // Fetch creator profiles
    const creatorIds = [...new Set(gamesData.map(g => g.creator_id).filter(Boolean))];
    const creatorMap = new Map<string, { full_name?: string; username?: string; avatar_url?: string }>();
    
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .in('id', creatorIds);
      
      if (creators) {
        creators.forEach(c => creatorMap.set(c.id, c));
      }
    }

    // Transform and calculate metrics
    const gamesWithMetrics: GameMetrics[] = gamesData.map(game => {
      const currentPlayers = Number(game.current_players ?? 0);
      const maxPlayers = Number(game.max_players ?? 0);
      const participationRate = calculateParticipationRate(currentPlayers, maxPlayers);
      const completed = isGameCompleted(game.date);
      const highAttendance = isHighAttendance(currentPlayers, maxPlayers);
      const successScore = calculateSuccessScore(participationRate, completed, highAttendance);
      
      const creator = creatorMap.get(game.creator_id);
      const creatorName = creator?.full_name?.trim() || creator?.username?.trim() || 'Host';
      
      return {
        id: game.id,
        title: game.title,
        sport: game.sport,
        date: game.date,
        time: game.time,
        location: game.location,
        imageUrl: game.image_url || undefined,
        maxPlayers,
        currentPlayers,
        participationRate,
        isCompleted: completed,
        isHighAttendance: highAttendance,
        successScore,
        creatorId: game.creator_id,
        creatorName,
        creatorAvatar: creator?.avatar_url || '',
      };
    });

    // Filter to only include successful games (high participation OR completed with participants)
    const successfulGames = gamesWithMetrics.filter(game => 
      game.participationRate >= PARTICIPATION_THRESHOLD || 
      (game.isCompleted && game.currentPlayers >= 2) ||
      game.isHighAttendance
    );

    // Sort by success score (highest first)
    successfulGames.sort((a, b) => b.successScore - a.successScore);

    // Return top games
    return successfulGames.slice(0, limit);
  } catch (error) {
    console.error('❌ [getSuccessfulGames] Error:', error);
    throw error;
  }
}

/**
 * Get featured game of the week
 * Returns the game with highest success score from the past week
 */
export async function getFeaturedGameOfWeek(): Promise<GameMetrics | null> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Fetch completed games from the past week
    const { data: gamesData, error: gamesError } = await supabase
      .from('games_with_counts')
      .select(`
        id, title, sport, date, time, location, image_url,
        max_players, current_players, creator_id
      `)
      .gte('date', oneWeekAgoStr)
      .lt('date', today)
      .order('current_players', { ascending: false })
      .limit(20);

    if (gamesError) {
      console.error('❌ [getFeaturedGameOfWeek] Error:', gamesError);
      throw gamesError;
    }

    if (!gamesData || gamesData.length === 0) {
      return null;
    }

    // Fetch creator profiles
    const creatorIds = [...new Set(gamesData.map(g => g.creator_id).filter(Boolean))];
    const creatorMap = new Map<string, { full_name?: string; username?: string; avatar_url?: string }>();
    
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .in('id', creatorIds);
      
      if (creators) {
        creators.forEach(c => creatorMap.set(c.id, c));
      }
    }

    // Find the game with highest success score
    let bestGame: GameMetrics | null = null;
    let highestScore = 0;

    for (const game of gamesData) {
      const currentPlayers = Number(game.current_players ?? 0);
      const maxPlayers = Number(game.max_players ?? 0);
      const participationRate = calculateParticipationRate(currentPlayers, maxPlayers);
      const completed = isGameCompleted(game.date);
      const highAttendance = isHighAttendance(currentPlayers, maxPlayers);
      const successScore = calculateSuccessScore(participationRate, completed, highAttendance);

      if (successScore > highestScore && currentPlayers >= 2) {
        highestScore = successScore;
        
        const creator = creatorMap.get(game.creator_id);
        const creatorName = creator?.full_name?.trim() || creator?.username?.trim() || 'Host';
        
        bestGame = {
          id: game.id,
          title: game.title,
          sport: game.sport,
          date: game.date,
          time: game.time,
          location: game.location,
          imageUrl: game.image_url || undefined,
          maxPlayers,
          currentPlayers,
          participationRate,
          isCompleted: completed,
          isHighAttendance: highAttendance,
          successScore,
          creatorId: game.creator_id,
          creatorName,
          creatorAvatar: creator?.avatar_url || '',
        };
      }
    }

    return bestGame;
  } catch (error) {
    console.error('❌ [getFeaturedGameOfWeek] Error:', error);
    return null;
  }
}

/**
 * Get success metrics for a specific game
 */
export function getGameSuccessMetrics(
  currentPlayers: number,
  maxPlayers: number,
  gameDate: string
): {
  participationRate: number;
  isCompleted: boolean;
  isHighAttendance: boolean;
  successScore: number;
  isSuccessful: boolean;
} {
  const participationRate = calculateParticipationRate(currentPlayers, maxPlayers);
  const completed = isGameCompleted(gameDate);
  const highAttendance = isHighAttendance(currentPlayers, maxPlayers);
  const successScore = calculateSuccessScore(participationRate, completed, highAttendance);
  const isSuccessful = participationRate >= PARTICIPATION_THRESHOLD || 
                       (completed && currentPlayers >= 2) ||
                       highAttendance;

  return {
    participationRate,
    isCompleted: completed,
    isHighAttendance: highAttendance,
    successScore,
    isSuccessful,
  };
}
