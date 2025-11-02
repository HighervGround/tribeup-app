import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Trophy, X, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned_at?: string;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
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

// Floating achievement notification component
export function AchievementNotification({ 
  achievement, 
  onClose, 
  autoClose = true, 
  duration = 6000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const handleViewProfile = () => {
    navigate('/profile?tab=achievements');
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <Card className="w-80 shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Achievement Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">{getAchievementIcon(achievement.icon)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Achievement Unlocked!</span>
              </div>
              
              <h3 className="font-semibold text-foreground mb-1">{achievement.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
              
              <div className="flex items-center justify-between">
                <Badge className={getCategoryColor(achievement.category)}>
                  <Star className="w-3 h-3 mr-1" />
                  +{achievement.points} pts
                </Badge>
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewProfile}
                    className="text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    View All
                  </Button>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex-shrink-0 w-6 h-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing achievement notifications
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<Achievement[]>([]);

  const showAchievementNotification = (achievement: Achievement) => {
    // Add to notifications state
    setNotifications(prev => [...prev, achievement]);

    // Also show toast notification as backup
    toast.success(
      `🎉 Achievement Unlocked!`,
      {
        description: `${getAchievementIcon(achievement.icon)} ${achievement.name} - ${achievement.description} (+${achievement.points} points)`,
        duration: 6000,
        action: {
          label: 'View All',
          onClick: () => {
            window.location.href = '/profile?tab=achievements';
          }
        }
      }
    );
  };

  const removeNotification = (achievementId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== achievementId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showAchievementNotification,
    removeNotification,
    clearAllNotifications
  };
}

// Component to render all active notifications
export function AchievementNotificationContainer() {
  const { notifications, removeNotification } = useAchievementNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((achievement, index) => (
        <div 
          key={achievement.id} 
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index 
          }}
        >
          <AchievementNotification
            achievement={achievement}
            onClose={() => removeNotification(achievement.id)}
          />
        </div>
      ))}
    </div>
  );
}
