import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';

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

  // Calculate achievement progress
  const getAchievementProgress = (achievement: Achievement, stats: UserStats) => {
    const criteria = achievement.criteria;
    let progress = 0;
    let total = 1;

    if (criteria.games_played) {
      total = criteria.games_played;
      progress = Math.min(stats.games_played, total);
    } else if (criteria.games_hosted) {
      total = criteria.games_hosted;
      progress = Math.min(stats.games_hosted, total);
    }

    return { progress, total, percentage: Math.round((progress / total) * 100) };
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

  return {
    achievements,
    userStats,
    isLoading,
    checkForNewAchievements,
    showAchievementToast,
    getAchievementProgress,
    getNextAchievements
  };
}
