import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Inbox,
  Search,
  Users,
  Calendar,
  Trophy,
  MessageSquare,
  Bell,
  MapPin,
  Heart,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users2,
  type LucideIcon,
} from 'lucide-react';

/**
 * EmptyState - A comprehensive, reusable empty state component
 * 
 * Features:
 * - Multiple variants for common scenarios
 * - Customizable icon, title, description
 * - Primary and secondary action buttons
 * - Size options (sm, md, lg)
 * - Optional card wrapper
 * - Contextual tips section
 * - Accessibility support with ARIA attributes
 */

export type EmptyStateVariant =
  | 'no-results'      // Search/filter with no matches
  | 'no-data'         // Empty list/collection
  | 'no-games'        // No games/activities found
  | 'no-tribes'       // No tribes/communities found
  | 'no-friends'      // No friends/following
  | 'no-messages'     // No messages/chat
  | 'no-notifications'// No notifications
  | 'no-achievements' // No achievements earned
  | 'no-sports'       // No sports selected
  | 'error'           // Error state
  | 'success'         // Completed/empty with success
  | 'onboarding';     // Welcome/getting started

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  icon?: React.ReactNode;
}

export interface EmptyStateTip {
  emoji?: string;
  text: string;
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Preset variant for common empty state scenarios */
  variant?: EmptyStateVariant;
  /** Title text - uses variant default if not provided */
  title?: string;
  /** Description text - uses variant default if not provided */
  description?: string;
  /** Custom icon element (overrides variant icon) */
  icon?: React.ReactNode;
  /** Custom illustration element (takes precedence over icon) */
  illustration?: React.ReactNode;
  /** Primary call-to-action button */
  primaryAction?: EmptyStateAction;
  /** Secondary call-to-action button */
  secondaryAction?: EmptyStateAction;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Wrap in a Card component */
  withCard?: boolean;
  /** Optional tips to display below the description */
  tips?: EmptyStateTip[];
  /** Additional CSS classes */
  className?: string;
}

interface VariantConfig {
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
}

const variantConfigs: Record<EmptyStateVariant, VariantConfig> = {
  'no-results': {
    icon: Search,
    iconBgClass: 'bg-muted',
    iconColorClass: 'text-muted-foreground',
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  'no-data': {
    icon: Inbox,
    iconBgClass: 'bg-muted',
    iconColorClass: 'text-muted-foreground',
    title: 'No data available',
    description: 'There\'s nothing here yet. Get started by creating your first item!',
  },
  'no-games': {
    icon: Calendar,
    iconBgClass: 'bg-orange-100 dark:bg-orange-900/30',
    iconColorClass: 'text-orange-600',
    title: 'No activities yet',
    description: 'Be the first to create an activity and start building your community!',
  },
  'no-tribes': {
    icon: Users2,
    iconBgClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconColorClass: 'text-blue-600',
    title: 'No tribes yet',
    description: 'Create or join a tribe to connect with others who share your interests!',
  },
  'no-friends': {
    icon: Users,
    iconBgClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconColorClass: 'text-purple-600',
    title: 'Not following anyone yet',
    description: 'Follow other players to see their activities and stay connected.',
  },
  'no-messages': {
    icon: MessageSquare,
    iconBgClass: 'bg-green-100 dark:bg-green-900/30',
    iconColorClass: 'text-green-600',
    title: 'No messages yet',
    description: 'Start the conversation! Send your first message to get things going.',
  },
  'no-notifications': {
    icon: Bell,
    iconBgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColorClass: 'text-yellow-600',
    title: 'All caught up!',
    description: 'You have no new notifications. Check back later for updates.',
  },
  'no-achievements': {
    icon: Trophy,
    iconBgClass: 'bg-amber-100 dark:bg-amber-900/30',
    iconColorClass: 'text-amber-600',
    title: 'No achievements yet',
    description: 'Join and create activities to start earning achievements!',
  },
  'no-sports': {
    icon: Heart,
    iconBgClass: 'bg-red-100 dark:bg-red-900/30',
    iconColorClass: 'text-red-600',
    title: 'No sports selected',
    description: 'Add your favorite sports to get personalized activity recommendations.',
  },
  'error': {
    icon: AlertCircle,
    iconBgClass: 'bg-destructive/10',
    iconColorClass: 'text-destructive',
    title: 'Something went wrong',
    description: 'We encountered an error. Please try again or contact support.',
  },
  'success': {
    icon: CheckCircle,
    iconBgClass: 'bg-green-100 dark:bg-green-900/30',
    iconColorClass: 'text-green-600',
    title: 'All done!',
    description: 'You\'ve completed everything. Great job!',
  },
  'onboarding': {
    icon: Plus,
    iconBgClass: 'bg-primary/10',
    iconColorClass: 'text-primary',
    title: 'Welcome to TribeUp!',
    description: 'Find your game, find your tribe. Let\'s get you started.',
  },
};

const sizeConfigs = {
  sm: {
    container: 'py-6 px-4',
    iconContainer: 'w-12 h-12',
    iconSize: 'w-6 h-6',
    title: 'text-base font-medium',
    description: 'text-sm',
    gap: 'gap-3',
  },
  md: {
    container: 'py-10 px-6',
    iconContainer: 'w-16 h-16',
    iconSize: 'w-8 h-8',
    title: 'text-lg font-semibold',
    description: 'text-base',
    gap: 'gap-4',
  },
  lg: {
    container: 'py-14 px-8',
    iconContainer: 'w-20 h-20',
    iconSize: 'w-10 h-10',
    title: 'text-xl font-bold',
    description: 'text-base',
    gap: 'gap-5',
  },
};

export function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon,
  illustration,
  primaryAction,
  secondaryAction,
  size = 'md',
  withCard = false,
  tips,
  className,
  ...props
}: EmptyStateProps) {
  const config = variantConfigs[variant];
  const sizeConfig = sizeConfigs[size];
  const IconComponent = config.icon;

  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeConfig.container,
        sizeConfig.gap,
        className
      )}
      role="status"
      aria-label={displayTitle}
      {...props}
    >
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-2">{illustration}</div>
      ) : icon ? (
        <div
          className={cn(
            'rounded-full flex items-center justify-center',
            sizeConfig.iconContainer,
            config.iconBgClass
          )}
        >
          {icon}
        </div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center',
            sizeConfig.iconContainer,
            config.iconBgClass
          )}
        >
          <IconComponent className={cn(sizeConfig.iconSize, config.iconColorClass)} />
        </div>
      )}

      {/* Title */}
      <h3 className={cn(sizeConfig.title, 'text-foreground')}>
        {displayTitle}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p className={cn('text-muted-foreground max-w-md', sizeConfig.description)}>
          {displayDescription}
        </p>
      )}

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant ?? 'default'}
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
              variant={secondaryAction.variant ?? 'outline'}
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

      {/* Tips Section */}
      {tips && tips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border w-full max-w-md">
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <p key={index} className="text-xs text-muted-foreground">
                {tip.emoji && <span className="mr-1">{tip.emoji}</span>}
                {tip.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (withCard) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

/**
 * Preset Empty States for Common Scenarios
 * These provide consistent, contextual messaging across the app
 */

export interface NoGamesEmptyStateProps {
  onCreateGame?: () => void;
  onExplore?: () => void;
  isFiltered?: boolean;
}

export function NoGamesEmptyState({
  onCreateGame,
  onExplore,
  isFiltered = false,
}: NoGamesEmptyStateProps) {
  return (
    <EmptyState
      variant={isFiltered ? 'no-results' : 'no-games'}
      title={isFiltered ? 'No matching activities' : undefined}
      description={
        isFiltered
          ? 'Try adjusting your filters to see more activities.'
          : undefined
      }
      illustration={<span className="text-6xl">🏀</span>}
      primaryAction={
        onCreateGame
          ? {
              label: 'Create Activity',
              onClick: onCreateGame,
              icon: <Plus className="w-4 h-4" />,
            }
          : undefined
      }
      secondaryAction={
        isFiltered && onExplore
          ? {
              label: 'Clear Filters',
              onClick: onExplore,
              variant: 'outline',
            }
          : onExplore
          ? {
              label: 'Explore',
              onClick: onExplore,
              variant: 'outline',
            }
          : undefined
      }
      tips={
        !isFiltered
          ? [
              { emoji: '💡', text: 'Tip: Start with a small group for better turnout!' },
            ]
          : undefined
      }
    />
  );
}

export interface NoTribesEmptyStateProps {
  onCreateTribe?: () => void;
  onExplore?: () => void;
  isSearch?: boolean;
}

export function NoTribesEmptyState({
  onCreateTribe,
  onExplore,
  isSearch = false,
}: NoTribesEmptyStateProps) {
  return (
    <EmptyState
      variant={isSearch ? 'no-results' : 'no-tribes'}
      title={isSearch ? 'No tribes found' : undefined}
      description={
        isSearch
          ? 'Try a different search term or create a new tribe.'
          : undefined
      }
      primaryAction={
        isSearch && onExplore
          ? {
              label: 'Clear Search',
              onClick: onExplore,
              variant: 'outline',
            }
          : onCreateTribe
          ? {
              label: 'Create Tribe',
              onClick: onCreateTribe,
              icon: <Plus className="w-4 h-4" />,
            }
          : undefined
      }
      secondaryAction={
        !isSearch && onExplore
          ? {
              label: 'Explore Tribes',
              onClick: onExplore,
              variant: 'outline',
            }
          : undefined
      }
    />
  );
}

export interface NoFriendsEmptyStateProps {
  onFindFriends?: () => void;
  onExploreGames?: () => void;
}

export function NoFriendsEmptyState({
  onFindFriends,
  onExploreGames,
}: NoFriendsEmptyStateProps) {
  return (
    <EmptyState
      variant="no-friends"
      primaryAction={
        onFindFriends
          ? {
              label: 'Find People to Follow',
              onClick: onFindFriends,
              icon: <Users className="w-4 h-4" />,
            }
          : undefined
      }
      secondaryAction={
        onExploreGames
          ? {
              label: 'Explore Activities',
              onClick: onExploreGames,
              variant: 'outline',
            }
          : undefined
      }
      tips={[
        { emoji: '💡', text: 'Tip: Join activities to meet people, then follow them to see their future activities!' },
      ]}
    />
  );
}

export interface NoRecentGamesEmptyStateProps {
  onFindGames?: () => void;
}

export function NoRecentGamesEmptyState({ onFindGames }: NoRecentGamesEmptyStateProps) {
  return (
    <EmptyState
      variant="no-games"
      title="No recent games"
      description="Join your first game to see it here!"
      primaryAction={
        onFindGames
          ? {
              label: 'Find Activities',
              onClick: onFindGames,
              icon: <Search className="w-4 h-4" />,
            }
          : undefined
      }
      size="sm"
    />
  );
}

export interface NoAchievementsEmptyStateProps {
  onFindGames?: () => void;
}

export function NoAchievementsEmptyState({ onFindGames }: NoAchievementsEmptyStateProps) {
  return (
    <EmptyState
      variant="no-achievements"
      primaryAction={
        onFindGames
          ? {
              label: 'Find Activities',
              onClick: onFindGames,
              icon: <Search className="w-4 h-4" />,
            }
          : undefined
      }
      tips={[
        { emoji: '🏆', text: 'Play games to unlock your first achievement!' },
      ]}
    />
  );
}

export interface NoSportsSelectedEmptyStateProps {
  onEditProfile?: () => void;
}

export function NoSportsSelectedEmptyState({ onEditProfile }: NoSportsSelectedEmptyStateProps) {
  return (
    <EmptyState
      variant="no-sports"
      primaryAction={
        onEditProfile
          ? {
              label: 'Add Your Sports',
              onClick: onEditProfile,
              variant: 'outline',
            }
          : undefined
      }
      size="sm"
    />
  );
}

export interface NoMessagesEmptyStateProps {
  isChannel?: boolean;
}

export function NoMessagesEmptyState({ isChannel = false }: NoMessagesEmptyStateProps) {
  return (
    <EmptyState
      variant="no-messages"
      title={isChannel ? 'No messages in this channel' : undefined}
      description={isChannel ? 'Be the first to send a message!' : undefined}
      size="sm"
    />
  );
}

export interface ErrorEmptyStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorEmptyState({ onRetry, message }: ErrorEmptyStateProps) {
  return (
    <EmptyState
      variant="error"
      description={message}
      primaryAction={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
              icon: <RefreshCw className="w-4 h-4" />,
            }
          : undefined
      }
    />
  );
}

export default EmptyState;
