import React from 'react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Trophy, Star, Crown, Target, Handshake, User } from 'lucide-react';

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
  showScore?: boolean;
  layout?: 'compact' | 'card';
}

const getAchievementIcon = (iconName: string) => {
  switch (iconName) {
    case 'trophy':
      return '🏆';
    case 'star':
      return '⭐';
    case 'handshake':
      return '🤝';
    case 'runner':
      return '🏃';
    case 'crown':
      return '👑';
    default:
      return '🎯';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'engagement':
      return <Target className="w-3 h-3" />;
    case 'milestone':
      return <Trophy className="w-3 h-3" />;
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
    case 'engagement':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300';
    case 'milestone':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';
    case 'hosting':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300';
    case 'social':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300';
  }
};

export function AchievementBadge({ 
  achievement, 
  size = 'md', 
  showTooltip = true,
  variant = 'default',
  showScore = true,
  layout = 'compact'
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: layout === 'card' ? 'text-xs p-2 gap-1' : 'text-xs px-1.5 py-0.5 gap-1',
    md: layout === 'card' ? 'text-sm p-3 gap-2' : 'text-xs px-2 py-1 gap-1.5',
    lg: layout === 'card' ? 'text-base p-4 gap-3' : 'text-sm px-3 py-1.5 gap-2'
  };

  if (layout === 'card') {
    const cardContent = (
      <div className={`
        ${sizeClasses[size]} 
        ${variant === 'default' ? getCategoryColor(achievement.category) : 'bg-card border border-border'}
        rounded-lg flex flex-col items-center text-center font-medium transition-all hover:shadow-md cursor-pointer
      `}>
        <div className="text-3xl mb-2">{getAchievementIcon(achievement.icon)}</div>
        <div className="font-semibold text-sm mb-1 line-clamp-2">{achievement.name}</div>
        {showScore && (
          <div className="text-lg font-bold text-primary">+{achievement.points}</div>
        )}
        {achievement.earned_at && (
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(achievement.earned_at).toLocaleDateString()}
          </div>
        )}
      </div>
    );
    
    if (!showTooltip) {
      return cardContent;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getAchievementIcon(achievement.icon)}</span>
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

  const badgeContent = (
    <Badge 
      variant={variant}
      className={`
        ${sizeClasses[size]} 
        ${variant === 'default' ? getCategoryColor(achievement.category) : ''}
        inline-flex items-center font-medium
      `}
    >
      <span className="text-lg">{getAchievementIcon(achievement.icon)}</span>
      <span className="truncate max-w-[100px]">{achievement.name}</span>
      {(showScore && (size === 'lg' || size === 'md')) && (
        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-1">+{achievement.points}</span>
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
              <span className="text-lg">{getAchievementIcon(achievement.icon)}</span>
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
  layout?: 'compact' | 'card';
  showScore?: boolean;
}

export function AchievementGrid({ 
  achievements, 
  maxDisplay = 6, 
  size = 'md',
  layout = 'compact',
  showScore = true
}: AchievementGridProps) {
  const displayAchievements = achievements.slice(0, maxDisplay);
  const remainingCount = Math.max(0, achievements.length - maxDisplay);

  const gridClasses = layout === 'card' 
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
    : 'flex flex-wrap gap-2';

  return (
    <div className={gridClasses}>
      {displayAchievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size={size}
          layout={layout}
          showScore={showScore}
        />
      ))}
      {remainingCount > 0 && layout === 'compact' && (
        <Badge variant="outline" className={`${size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
          +{remainingCount} more
        </Badge>
      )}
      {remainingCount > 0 && layout === 'card' && (
        <div className="flex items-center justify-center p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl mb-1">+{remainingCount}</div>
            <div className="text-xs">more</div>
          </div>
        </div>
      )}
    </div>
  );
}
