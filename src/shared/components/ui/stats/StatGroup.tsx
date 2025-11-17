import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { StatCard, StatCardProps } from './StatCard';

export interface StatGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  stats: Omit<StatCardProps, 'size'>[];
  columns?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Stat Group Component
 * 
 * Displays multiple stat cards in a grid layout.
 * 
 * @example
 * ```tsx
 * <StatGroup
 *   stats={[
 *     { label: 'Games', value: 50, icon: <Activity /> },
 *     { label: 'Wins', value: 35, icon: <Trophy /> },
 *     { label: 'Rating', value: 4.8, icon: <Star /> },
 *   ]}
 *   columns={3}
 * />
 * ```
 */
export function StatGroup({
  stats,
  columns = 3,
  size = 'md',
  className,
  ...props
}: StatGroupProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns];

  return (
    <div
      className={cn('grid gap-4', gridCols, className)}
      {...props}
    >
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} size={size} />
      ))}
    </div>
  );
}

