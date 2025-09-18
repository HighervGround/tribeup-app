import React from 'react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Trophy, Star, Crown, Target } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned_at?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'participation':
      return <Target className="w-3 h-3" />;
    case 'hosting':
      return <Crown className="w-3 h-3" />;
    case 'social':
      return <Star className="w-3 h-3" />;
    default:
      return <Trophy className="w-3 h-3" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'participation':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300';
    case 'hosting':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300';
    case 'social':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';
  }
};

export function AchievementBadge({ 
  achievement, 
  size = 'md', 
  showTooltip = true,
  variant = 'default'
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  const badgeContent = (
    <Badge 
      variant={variant}
      className={`
        ${sizeClasses[size]} 
        ${variant === 'default' ? getCategoryColor(achievement.category) : ''}
        inline-flex items-center font-medium
      `}
    >
      <span className="text-lg">{achievement.icon}</span>
      <span className="truncate max-w-[100px]">{achievement.name}</span>
      {size === 'lg' && (
        <span className="text-xs opacity-75">+{achievement.points}</span>
      )}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{achievement.icon}</span>
              <span className="font-semibold">{achievement.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {getCategoryIcon(achievement.category)}
                <span className="capitalize">{achievement.category}</span>
              </div>
              <span className="text-primary font-medium">+{achievement.points} pts</span>
            </div>
            {achievement.earned_at && (
              <p className="text-xs text-muted-foreground">
                Earned {new Date(achievement.earned_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementGrid({ 
  achievements, 
  maxDisplay = 6, 
  size = 'md' 
}: AchievementGridProps) {
  const displayAchievements = achievements.slice(0, maxDisplay);
  const remainingCount = Math.max(0, achievements.length - maxDisplay);

  return (
    <div className="flex flex-wrap gap-2">
      {displayAchievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className={`${size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
