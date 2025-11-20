import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export interface LeaderboardColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface LeaderboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: LeaderboardColumn[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  showRank?: boolean;
}

/**
 * Leaderboard Header Component
 * 
 * Displays column headers for a leaderboard with sorting functionality.
 * 
 * @example
 * ```tsx
 * <LeaderboardHeader
 *   columns={[
 *     { key: 'name', label: 'Player', sortable: false },
 *     { key: 'gamesPlayed', label: 'Games', sortable: true },
 *     { key: 'wins', label: 'Wins', sortable: true },
 *   ]}
 *   sortKey="wins"
 *   sortDirection="desc"
 *   onSort={(key) => setSortKey(key)}
 * />
 * ```
 */
export function LeaderboardHeader({
  columns,
  sortKey,
  sortDirection,
  onSort,
  showRank = true,
  className,
  ...props
}: LeaderboardHeaderProps) {
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortKey || sortKey !== columnKey) {
      return <ArrowUpDown className="size-3 text-muted-foreground" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="size-3 text-primary" />;
    }
    return <ArrowDown className="size-3 text-primary" />;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/30',
        className
      )}
      {...props}
    >
      {/* Rank Column */}
      {showRank && (
        <div className="flex-shrink-0 w-10 flex items-center justify-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Rank
          </span>
        </div>
      )}

      {/* Avatar Column (spacer) */}
      <div className="flex-shrink-0 w-10" />

      {/* Dynamic Columns */}
      {columns.map((column) => (
        <div
          key={column.key}
          className={cn(
            'flex-1',
            column.align === 'center' && 'justify-center',
            column.align === 'right' && 'justify-end',
            'flex items-center gap-1'
          )}
        >
          {column.sortable && onSort ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-auto p-0 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground',
                sortKey === column.key && 'text-primary'
              )}
              onClick={() => handleSort(column.key)}
            >
              <span>{column.label}</span>
              {getSortIcon(column.key)}
            </Button>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {column.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

