import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SupabaseService } from '@/core/database/supabaseService';
import { useAppStore } from '@/store/appStore';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: any;
  points: number;
  is_active: boolean;
  created_at: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress?: any;
  achievement: Achievement;
}

interface UserStats {
  user_id: string;
  games_played: number;
  games_hosted: number;
  total_play_time_minutes: number;
  favorite_sport?: string;
  last_activity: string;
}

export function useAchievements() {
  const { user } = useAppStore();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user achievements and stats
  useEffect(() => {
    if (!user?.id) return;

    const loadAchievements = async () => {
      try {
        setIsLoading(true);
        const [achievementsData, statsData] = await Promise.all([
          SupabaseService.getUserAchievements(user.id),
          SupabaseService.getUserStats(user.id)
        ]);
        
        setAchievements(achievementsData);
        setUserStats(statsData);
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, [user?.id]);

  // Check for new achievements after game participation
  const checkForNewAchievements = async () => {
    if (!user?.id) return;

    try {
      const newAchievements = await SupabaseService.checkAndAwardAchievements(user.id);
      
      if (newAchievements.length > 0) {
        // Show achievement toast notifications
        newAchievements.forEach((achievement: Achievement) => {
          showAchievementToast(achievement);
        });

        // Refresh achievements list
        const updatedAchievements = await SupabaseService.getUserAchievements(user.id);
        setAchievements(updatedAchievements);
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  };

  // Show achievement toast notification
  const showAchievementToast = (achievement: Achievement) => {
    toast.success(
      `🎉 Achievement Unlocked!`,
      {
        description: `${achievement.icon} ${achievement.name} - ${achievement.description} (+${achievement.points} points)`,
        duration: 6000,
        action: {
          label: 'View All',
          onClick: () => {
            // Navigate to achievements page
            window.location.href = '/profile?tab=achievements';
          }
        }
      }
    );
  };

  // Calculate achievement progress based on criteria
  const getAchievementProgress = (achievement: Achievement, stats: UserStats) => {
    const criteria = typeof achievement.criteria === 'string' 
      ? JSON.parse(achievement.criteria) 
      : achievement.criteria;
    
    let progress = 0;
    let total = 1;

    switch (criteria.type) {
      case 'game_count':
        total = criteria.count;
        progress = Math.min(stats.games_played, total);
        break;
      case 'host_count':
        total = criteria.count;
        progress = Math.min(stats.games_hosted, total);
        break;
      case 'play_time_minutes':
        total = criteria.count;
        progress = Math.min(stats.total_play_time_minutes, total);
        break;
      case 'first_login':
        // First login is binary - either achieved or not
        total = 1;
        progress = stats.last_activity ? 1 : 0;
        break;
      default:
        total = 1;
        progress = 0;
    }

    return { progress, total, percentage: Math.round((progress / total) * 100) };
  };

  // Calculate total achievement score
  const getTotalScore = () => {
    return achievements.reduce((total, userAchievement) => {
      // Handle both nested and flat achievement structures
      const achievement = userAchievement.achievement || userAchievement;
      return total + (achievement?.points || 0);
    }, 0);
  };

  // Get achievement rank based on total score
  const getAchievementRank = (score: number) => {
    if (score >= 200) return { title: 'Legend', icon: '👑', color: 'text-yellow-600', level: 6 };
    if (score >= 150) return { title: 'Champion', icon: '🏆', color: 'text-purple-600', level: 5 };
    if (score >= 100) return { title: 'Expert', icon: '⭐', color: 'text-blue-600', level: 4 };
    if (score >= 50) return { title: 'Rising Star', icon: '🌟', color: 'text-green-600', level: 3 };
    if (score >= 25) return { title: 'Rookie', icon: '🎯', color: 'text-orange-600', level: 2 };
    return { title: 'Beginner', icon: '🔰', color: 'text-gray-600', level: 1 };
  };

  // Get next achievements to unlock
  const getNextAchievements = async () => {
    if (!user?.id || !userStats) return [];

    try {
      const allAchievements = await SupabaseService.getAllAchievements();
      const earnedIds = new Set(achievements.map(ua => ua.achievement_id));
      
      return allAchievements
        .filter(achievement => !earnedIds.has(achievement.id) && achievement.is_active)
        .map(achievement => ({
          ...achievement,
          progress: getAchievementProgress(achievement, userStats)
        }))
        .sort((a, b) => b.progress.percentage - a.progress.percentage)
        .slice(0, 3); // Show top 3 closest achievements
    } catch (error) {
      console.error('Failed to get next achievements:', error);
      return [];
    }
  };

  const totalScore = getTotalScore();
  const currentRank = getAchievementRank(totalScore);

  return {
    achievements,
    userStats,
    isLoading,
    totalScore,
    currentRank,
    checkForNewAchievements,
    showAchievementToast,
    getAchievementProgress,
    getAchievementRank,
    getNextAchievements
  };
}
