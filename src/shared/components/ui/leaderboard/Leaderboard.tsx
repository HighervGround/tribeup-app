import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { LeaderboardRow, LeaderboardPlayer } from './LeaderboardRow';
import { LeaderboardHeader, LeaderboardColumn } from './LeaderboardHeader';
import { EmptyStateEnhanced } from '@/shared/components/ui/empty-state-enhanced';

export interface LeaderboardProps extends React.HTMLAttributes<HTMLDivElement> {
  players: LeaderboardPlayer[];
  columns?: LeaderboardColumn[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onPlayerClick?: (player: LeaderboardPlayer) => void;
  showRankBadge?: boolean;
  showStats?: boolean;
  statKeys?: string[];
  highlightCurrentUser?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  maxHeight?: string;
  currentUserId?: string;
}

/**
 * Leaderboard Component
 * 
 * Complete leaderboard display with sorting, pagination, and player interaction.
 * 
 * @example
 * ```tsx
 * <Leaderboard
 *   players={leaderboardData}
 *   columns={[
 *     { key: 'name', label: 'Player', sortable: false },
 *     { key: 'gamesPlayed', label: 'Games', sortable: true },
 *     { key: 'wins', label: 'Wins', sortable: true },
 *   ]}
 *   sortKey="wins"
 *   sortDirection="desc"
 *   onSort={(key) => handleSort(key)}
 *   onPlayerClick={(player) => navigate(`/user/${player.id}`)}
 * />
 * ```
 */
export function Leaderboard({
  players,
  columns = [
    { key: 'name', label: 'Player', sortable: false },
    { key: 'gamesPlayed', label: 'Games', sortable: true },
    { key: 'wins', label: 'Wins', sortable: true },
    { key: 'rating', label: 'Rating', sortable: true },
  ],
  sortKey,
  sortDirection,
  onSort,
  onPlayerClick,
  showRankBadge = true,
  showStats = true,
  statKeys = ['gamesPlayed', 'wins', 'rating'],
  highlightCurrentUser = true,
  emptyMessage = 'No players yet',
  emptyDescription = 'Be the first to join and start competing!',
  maxHeight = '600px',
  currentUserId,
  className,
  ...props
}: LeaderboardProps) {
  // Mark current user
  const playersWithCurrentUser = React.useMemo(() => {
    if (!currentUserId) return players;
    return players.map((player) => ({
      ...player,
      isCurrentUser: player.id === currentUserId,
    }));
  }, [players, currentUserId]);

  // Handle sorting
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  if (players.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)} {...props}>
        <EmptyStateEnhanced
          title={emptyMessage}
          description={emptyDescription}
          icon={<div className="text-4xl">🏆</div>}
        />
      </div>
    );
  }

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)} {...props}>
      {/* Header */}
      <LeaderboardHeader
        columns={columns}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        showRank={showRankBadge}
      />

      {/* Player List */}
      <ScrollArea style={{ maxHeight }}>
        <div className="divide-y divide-border">
          {playersWithCurrentUser.map((player) => (
            <LeaderboardRow
              key={player.id || player.name}
              player={player}
              showRankBadge={showRankBadge}
              showStats={showStats}
              statKeys={statKeys}
              highlightCurrentUser={highlightCurrentUser}
              onPlayerClick={onPlayerClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Simple Leaderboard - Minimal configuration
 */
export function SimpleLeaderboard({
  players,
  onPlayerClick,
  currentUserId,
  ...props
}: Omit<LeaderboardProps, 'columns' | 'sortKey' | 'sortDirection' | 'onSort'>) {
  return (
    <Leaderboard
      players={players}
      onPlayerClick={onPlayerClick}
      currentUserId={currentUserId}
      columns={[
        { key: 'name', label: 'Player', sortable: false },
        { key: 'gamesPlayed', label: 'Games', sortable: false },
        { key: 'wins', label: 'Wins', sortable: false },
      ]}
      showStats={false}
      {...props}
    />
  );
}

