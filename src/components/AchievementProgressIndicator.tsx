import React from 'react';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Target, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: any;
  points: number;
}

interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  total: number;
  percentage: number;
}

interface AchievementProgressIndicatorProps {
  achievements: AchievementProgress[];
  title?: string;
  showAll?: boolean;
}

export function AchievementProgressIndicator({ 
  achievements, 
  title = "Next Achievements",
  showAll = false 
}: AchievementProgressIndicatorProps) {
  const displayAchievements = showAll ? achievements : achievements.slice(0, 3);

  if (displayAchievements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        
        <div className="space-y-4">
          {displayAchievements.map((item) => {
            const achievement = item.achievement || item;
            return (
              <div key={achievement?.id || Math.random()} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{achievement?.icon || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {achievement?.name || 'Unknown Achievement'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {achievement?.description || 'No description'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline" className="text-xs">
                      +{achievement?.points || 0}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {item.progress} / {item.total}
                    </span>
                    <span className="font-medium text-primary">
                      {item.percentage}%
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
        
        {!showAll && achievements.length > 3 && (
          <div className="text-center mt-4">
            <button className="text-xs text-muted-foreground hover:text-primary">
              View all achievements →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickProgressProps {
  label: string;
  current: number;
  target: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function QuickProgress({ 
  label, 
  current, 
  target, 
  icon = <Zap className="w-4 h-4" />,
  color = 'blue'
}: QuickProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs font-medium">
          {current}/{target}
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}

interface GameProgressWidgetProps {
  gamesPlayed: number;
  gamesHosted: number;
  nextAchievements: AchievementProgress[];
}

export function GameProgressWidget({ 
  gamesPlayed, 
  gamesHosted, 
  nextAchievements 
}: GameProgressWidgetProps) {
  // Find next participation and hosting milestones
  const nextParticipation = nextAchievements.find(a => {
    const achievement = a.achievement || a;
    return achievement?.category === 'engagement' || achievement?.category === 'participation';
  });
  const nextHosting = nextAchievements.find(a => {
    const achievement = a.achievement || a;
    return achievement?.category === 'hosting' || achievement?.category === 'engagement';
  });

  return (
    <div className="space-y-3">
      {nextParticipation && (
        <QuickProgress
          label="Activities Played"
          current={gamesPlayed}
          target={nextParticipation.total}
          icon={<Trophy className="w-4 h-4" />}
          color="blue"
        />
      )}
      
      {nextHosting && (
        <QuickProgress
          label="Activities Hosted"
          current={gamesHosted}
          target={nextHosting.total}
          icon={<Target className="w-4 h-4" />}
          color="purple"
        />
      )}
    </div>
  );
}
