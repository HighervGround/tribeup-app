import React from 'react';
// import { motion } from 'framer-motion'; // TEMPORARILY DISABLED
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';
import { Bell, MessageSquare, Calendar, CheckCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8'
  };

  const iconSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeClasses[size],
        className
      )}
    >
      {icon && (
        <div className={cn(
          "text-muted-foreground mb-4 flex items-center justify-center",
          iconSizeClasses[size]
        )}>
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button 
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoGamesFound({ onCreateGame }: { onCreateGame: () => void }) {
  return (
    <EmptyState
      icon={<div className="text-6xl">🏀</div>}
      title="No activities found"
      description="Be the first to create an activity in your area and start building your sports community!"
      action={{
        label: "Create Activity",
        onClick: onCreateGame
      }}
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon={<div className="text-6xl">💬</div>}
      title="No messages yet"
      description="Start the conversation! Send your first message to get things going."
      size="sm"
    />
  );
}

export function NoFriends({ onExplore }: { onExplore: () => void }) {
  return (
    <EmptyState
      icon={<div className="text-6xl">👥</div>}
      title="No friends yet"
      description="Connect with other players by joining activities and building your sports network."
      action={{
        label: "Explore Activities",
        onClick: onExplore,
        variant: "outline"
      }}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={<div className="text-6xl">📡</div>}
      title="No internet connection"
      description="Check your connection and try again. Some features may not be available offline."
      action={{
        label: "Try Again",
        onClick: onRetry,
        variant: "outline"
      }}
    />
  );
}

export function NoNotifications({ filter }: { filter: string }) {
  const getEmptyContent = () => {
    switch (filter) {
      case 'unread':
        return {
          title: 'All caught up!',
          description: 'You have no unread notifications. You\'re all up to date!',
          icon: <CheckCircle className="w-8 h-8" />
        };
      case 'messages':
        return {
          title: 'No message notifications',
          description: 'You haven\'t received any message notifications recently.',
          icon: <MessageSquare className="w-8 h-8" />
        };
      case 'games':
        return {
          title: 'No activity notifications',
          description: 'No activity updates, reminders, or join requests at the moment.',
          icon: <Calendar className="w-8 h-8" />
        };
      default:
        return {
          title: 'No notifications',
          description: 'When you receive notifications, they\'ll appear here. Stay tuned for updates!',
          icon: <Bell className="w-8 h-8" />
        };
    }
  };

  const content = getEmptyContent();

  return (
    <EmptyState
      icon={content.icon}
      title={content.title}
      description={content.description}
      size="md"
    />
  );
}