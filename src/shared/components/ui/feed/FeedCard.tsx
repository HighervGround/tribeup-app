import * as React from 'react';
import { FeedItem, FeedItemProps } from './FeedItem';

export interface FeedCardProps extends FeedItemProps {
  variant?: 'default' | 'compact' | 'expanded';
}

/**
 * Feed Card Component
 * 
 * Card variant of FeedItem with different display styles.
 * 
 * @example
 * ```tsx
 * <FeedCard
 *   variant="compact"
 *   user={user}
 *   action="joined_game"
 *   timestamp={new Date()}
 * />
 * ```
 */
export function FeedCard({
  variant = 'default',
  className,
  ...props
}: FeedCardProps) {
  const variantClasses = {
    default: '',
    compact: 'p-3',
    expanded: 'p-6',
  }[variant];

  return (
    <FeedItem
      className={variantClasses}
      {...props}
    />
  );
}

