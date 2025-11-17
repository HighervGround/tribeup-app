import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Inbox,
  Search,
  Users,
  Calendar,
  Trophy,
  MessageSquare,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

export type EmptyStateVariant =
  | 'no-results'
  | 'no-data'
  | 'error'
  | 'onboarding'
  | 'success'
  | 'loading';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  icon?: React.ReactNode;
}

export interface EmptyStateEnhancedProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantConfig: Record<
  EmptyStateVariant,
  {
    defaultIcon: React.ReactNode;
    defaultTitle?: string;
    defaultDescription?: string;
    colorClass?: string;
  }
> = {
  'no-results': {
    defaultIcon: <Search className="size-12 text-muted-foreground" />,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search or filters to find what you\'re looking for.',
    colorClass: 'text-muted-foreground',
  },
  'no-data': {
    defaultIcon: <Inbox className="size-12 text-muted-foreground" />,
    defaultTitle: 'No data available',
    defaultDescription: 'There\'s nothing here yet. Get started by creating your first item!',
    colorClass: 'text-muted-foreground',
  },
  error: {
    defaultIcon: <AlertCircle className="size-12 text-destructive" />,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'We encountered an error. Please try again or contact support if the problem persists.',
    colorClass: 'text-destructive',
  },
  onboarding: {
    defaultIcon: <Plus className="size-12 text-primary" />,
    defaultTitle: 'Get started',
    defaultDescription: 'Welcome! Let\'s set up your profile and start exploring.',
    colorClass: 'text-primary',
  },
  success: {
    defaultIcon: <Trophy className="size-12 text-success" />,
    defaultTitle: 'All done!',
    defaultDescription: 'You\'ve completed everything. Great job!',
    colorClass: 'text-success',
  },
  loading: {
    defaultIcon: <RefreshCw className="size-12 text-muted-foreground animate-spin" />,
    defaultTitle: 'Loading...',
    defaultDescription: 'Please wait while we load your content.',
    colorClass: 'text-muted-foreground',
  },
};

const sizeClasses = {
  sm: {
    container: 'py-8 px-4',
    icon: 'size-10',
    title: 'text-base',
    description: 'text-sm',
    gap: 'gap-3',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'size-16',
    title: 'text-lg',
    description: 'text-base',
    gap: 'gap-4',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'size-20',
    title: 'text-xl',
    description: 'text-lg',
    gap: 'gap-6',
  },
};

/**
 * Enhanced Empty State Component
 * 
 * A comprehensive empty state component with variants, illustrations, and multiple CTAs.
 * Based on Strava's empty state patterns.
 * 
 * @example
 * ```tsx
 * <EmptyStateEnhanced
 *   variant="no-results"
 *   title="No games found"
 *   description="Try adjusting your filters"
 *   primaryAction={{
 *     label: "Create Game",
 *     onClick: () => navigate('/create'),
 *     icon: <Plus />
 *   }}
 * />
 * ```
 */
export function EmptyStateEnhanced({
  variant = 'no-data',
  title,
  description,
  icon,
  illustration,
  primaryAction,
  secondaryAction,
  size = 'md',
  className,
  ...props
}: EmptyStateEnhancedProps) {
  const config = variantConfig[variant];
  const sizes = sizeClasses[size];

  const displayIcon = icon || illustration || config.defaultIcon;
  const displayTitle = title || config.defaultTitle || 'Empty';
  const displayDescription = description || config.defaultDescription;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        sizes.gap,
        className
      )}
      {...props}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-2">{illustration}</div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center mb-2',
            sizes.icon,
            config.colorClass
          )}
        >
          {displayIcon}
        </div>
      )}

      {/* Title */}
      <h3 className={cn('font-semibold', sizes.title)}>{displayTitle}</h3>

      {/* Description */}
      {displayDescription && (
        <p className={cn('text-muted-foreground max-w-md', sizes.description)}>
          {displayDescription}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || 'default'}
              size={size === 'sm' ? 'sm' : 'default'}
              className="w-full sm:w-auto"
            >
              {primaryAction.icon && (
                <span className="mr-2">{primaryAction.icon}</span>
              )}
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
              size={size === 'sm' ? 'sm' : 'default'}
              className="w-full sm:w-auto"
            >
              {secondaryAction.icon && (
                <span className="mr-2">{secondaryAction.icon}</span>
              )}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Preset Empty States for Common Scenarios
 */

export function NoGamesFound({
  onCreateGame,
  onExplore,
}: {
  onCreateGame?: () => void;
  onExplore?: () => void;
}) {
  return (
    <EmptyStateEnhanced
      variant="no-results"
      title="No activities found"
      description="Be the first to create an activity in your area and start building your sports community!"
      illustration={<div className="text-6xl">🏀</div>}
      primaryAction={
        onCreateGame
          ? {
              label: 'Create Activity',
              onClick: onCreateGame,
              icon: <Plus className="size-4" />,
            }
          : undefined
      }
      secondaryAction={
        onExplore
          ? {
              label: 'Explore',
              onClick: onExplore,
              variant: 'outline',
            }
          : undefined
      }
    />
  );
}

export function NoPlayersFound({
  onInvite,
}: {
  onInvite?: () => void;
}) {
  return (
    <EmptyStateEnhanced
      variant="no-data"
      title="No players yet"
      description="Invite friends or wait for others to join this activity."
      icon={<Users className="size-12 text-muted-foreground" />}
      primaryAction={
        onInvite
          ? {
              label: 'Invite Players',
              onClick: onInvite,
              icon: <Users className="size-4" />,
            }
          : undefined
      }
    />
  );
}

export function NoUpcomingGames({
  onCreateGame,
}: {
  onCreateGame?: () => void;
}) {
  return (
    <EmptyStateEnhanced
      variant="no-data"
      title="No upcoming activities"
      description="Create an activity to get started, or check back later for new opportunities."
      icon={<Calendar className="size-12 text-muted-foreground" />}
      primaryAction={
        onCreateGame
          ? {
              label: 'Create Activity',
              onClick: onCreateGame,
              icon: <Plus className="size-4" />,
            }
          : undefined
      }
    />
  );
}

export function EmptyLeaderboard({
  onJoinGame,
}: {
  onJoinGame?: () => void;
}) {
  return (
    <EmptyStateEnhanced
      variant="onboarding"
      title="Leaderboard is empty"
      description="Join your first activity to start competing and climb the leaderboard!"
      icon={<Trophy className="size-12 text-primary" />}
      primaryAction={
        onJoinGame
          ? {
              label: 'Find Activities',
              onClick: onJoinGame,
            }
          : undefined
      }
    />
  );
}

export function ErrorState({
  onRetry,
  onContactSupport,
}: {
  onRetry?: () => void;
  onContactSupport?: () => void;
}) {
  return (
    <EmptyStateEnhanced
      variant="error"
      title="Something went wrong"
      description="We encountered an error. Please try again or contact support if the problem persists."
      primaryAction={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
              icon: <RefreshCw className="size-4" />,
            }
          : undefined
      }
      secondaryAction={
        onContactSupport
          ? {
              label: 'Contact Support',
              onClick: onContactSupport,
              variant: 'outline',
            }
          : undefined
      }
    />
  );
}

export function OnboardingWelcome({
  onGetStarted,
}: {
  onGetStarted?: () => void;
}) {
  return (
    <EmptyStateEnhanced
      variant="onboarding"
      title="Welcome to TribeUp!"
      description="Find your game, find your tribe. Let's get you set up and ready to play."
      illustration={<div className="text-6xl">🎉</div>}
      primaryAction={
        onGetStarted
          ? {
              label: 'Get Started',
              onClick: onGetStarted,
            }
          : undefined
      }
      size="lg"
    />
  );
}

