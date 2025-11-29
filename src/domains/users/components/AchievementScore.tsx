import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Trophy, Star, TrendingUp } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned_at?: string;
}

interface AchievementScoreProps {
  achievements: Achievement[];
  className?: string;
}

export function AchievementScore({ achievements, className = '' }: AchievementScoreProps) {
  // Calculate total score
  const totalScore = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
  
  // Calculate category breakdown
  const categoryStats = achievements.reduce((stats, achievement) => {
    const category = achievement.category;
    if (!stats[category]) {
      stats[category] = { count: 0, points: 0 };
    }
    stats[category].count += 1;
    stats[category].points += achievement.points;
    return stats;
  }, {} as Record<string, { count: number; points: number }>);

  // Get achievement rank based on total score
  const getAchievementRank = (score: number) => {
    if (score >= 200) return { title: 'Legend', icon: '👑', color: 'text-yellow-600' };
    if (score >= 150) return { title: 'Champion', icon: '🏆', color: 'text-purple-600' };
    if (score >= 100) return { title: 'Expert', icon: '⭐', color: 'text-blue-600' };
    if (score >= 50) return { title: 'Rising Star', icon: '🌟', color: 'text-green-600' };
    if (score >= 25) return { title: 'Rookie', icon: '🎯', color: 'text-orange-700' };
    return { title: 'Beginner', icon: '🔰', color: 'text-gray-600' };
  };

  const rank = getAchievementRank(totalScore);

  // Calculate next rank threshold
  const getNextRankThreshold = (score: number) => {
    if (score < 25) return 25;
    if (score < 50) return 50;
    if (score < 100) return 100;
    if (score < 150) return 150;
    if (score < 200) return 200;
    return null; // Max rank achieved
  };

  const nextThreshold = getNextRankThreshold(totalScore);
  const progressToNext = nextThreshold ? ((totalScore / nextThreshold) * 100) : 100;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5" />
          Achievement Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Score Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-primary">{totalScore}</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{rank.icon}</span>
            <Badge variant="secondary" className={`${rank.color} font-medium`}>
              {rank.title}
            </Badge>
          </div>
          {nextThreshold && (
            <div className="text-sm text-muted-foreground">
              {nextThreshold - totalScore} points to next rank
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {nextThreshold && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to next rank</span>
              <span>{Math.round(progressToNext)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {Object.keys(categoryStats).length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Category Breakdown
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{category}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {stats.count}
                    </Badge>
                    <span className="text-primary font-medium">{stats.points}pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievement Count */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">Total Achievements</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{achievements.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for achievement score calculations
export function useAchievementScore(achievements: Achievement[]) {
  const totalScore = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
  
  const categoryBreakdown = achievements.reduce((stats, achievement) => {
    const category = achievement.category;
    if (!stats[category]) {
      stats[category] = { count: 0, points: 0, achievements: [] };
    }
    stats[category].count += 1;
    stats[category].points += achievement.points;
    stats[category].achievements.push(achievement);
    return stats;
  }, {} as Record<string, { count: number; points: number; achievements: Achievement[] }>);

  const getAchievementRank = (score: number) => {
    if (score >= 200) return { title: 'Legend', icon: '👑', color: 'text-yellow-600', level: 6 };
    if (score >= 150) return { title: 'Champion', icon: '🏆', color: 'text-purple-600', level: 5 };
    if (score >= 100) return { title: 'Expert', icon: '⭐', color: 'text-blue-600', level: 4 };
    if (score >= 50) return { title: 'Rising Star', icon: '🌟', color: 'text-green-600', level: 3 };
    if (score >= 25) return { title: 'Rookie', icon: '🎯', color: 'text-orange-700', level: 2 };
    return { title: 'Beginner', icon: '🔰', color: 'text-gray-600', level: 1 };
  };

  const rank = getAchievementRank(totalScore);

  return {
    totalScore,
    categoryBreakdown,
    rank,
    achievementCount: achievements.length
  };
}
