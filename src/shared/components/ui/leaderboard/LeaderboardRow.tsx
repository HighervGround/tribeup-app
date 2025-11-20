import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

export interface LeaderboardPlayer {
  id?: string;
  name: string;
  avatar?: string | null;
  rank: number;
  stats: {
    gamesPlayed?: number;
    wins?: number;
    losses?: number;
    rating?: number;
    winRate?: number;
    [key: string]: number | string | undefined;
  };
  isCurrentUser?: boolean;
}

export interface LeaderboardRowProps extends React.HTMLAttributes<HTMLDivElement> {
  player: LeaderboardPlayer;
  showRankBadge?: boolean;
  showStats?: boolean;
  statKeys?: string[];
  highlightCurrentUser?: boolean;
  onPlayerClick?: (player: LeaderboardPlayer) => void;
}

/**
 * Leaderboard Row Component
 * 
 * Displays a single player entry in a leaderboard with rank, avatar, name, and stats.
 * 
 * @example
 * ```tsx
 * <LeaderboardRow
 *   player={{
 *     id: '1',
 *     name: 'John Doe',
 *     rank: 1,
 *     stats: { gamesPlayed: 50, wins: 35, rating: 4.8 }
 *   }}
 *   showRankBadge
 * />
 * ```
 */
export function LeaderboardRow({
  player,
  showRankBadge = true,
  showStats = true,
  statKeys = ['gamesPlayed', 'wins', 'rating'],
  highlightCurrentUser = true,
  onPlayerClick,
  className,
  ...props
}: LeaderboardRowProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="size-5 text-yellow-500 fill-current" />;
    }
    if (rank === 2) {
      return <Medal className="size-5 text-gray-400 fill-current" />;
    }
    if (rank === 3) {
      return <Award className="size-5 text-amber-600 fill-current" />;
    }
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  const formatStatValue = (key: string, value: number | string | undefined): string => {
    if (value === undefined || value === null) return '—';
    
    if (key === 'rating' || key === 'winRate') {
      return typeof value === 'number' ? value.toFixed(1) : value.toString();
    }
    
    return value.toString();
  };

  const getStatLabel = (key: string): string => {
    const labels: Record<string, string> = {
      gamesPlayed: 'Games',
      wins: 'Wins',
      losses: 'Losses',
      rating: 'Rating',
      winRate: 'Win Rate',
    };
    return labels[key] || key;
  };

  const handleClick = () => {
    if (onPlayerClick) {
      onPlayerClick(player);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        'hover:bg-muted/50',
        highlightCurrentUser && player.isCurrentUser && 'bg-primary/5 border border-primary/20',
        onPlayerClick && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {/* Rank Badge */}
      {showRankBadge && (
        <div className="flex-shrink-0 w-10 flex items-center justify-center">
          {getRankIcon(player.rank) || (
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center font-bold text-sm',
                getRankBadgeColor(player.rank)
              )}
            >
              {player.rank}
            </div>
          )}
        </div>
      )}

      {/* Avatar */}
      <div className="flex-shrink-0">
        {player.id ? (
          <ClickableAvatar
            userId={player.id}
            src={player.avatar || undefined}
            alt={player.name}
            size="md"
            onClick={onPlayerClick ? () => handleClick() : undefined}
          />
        ) : (
          <Avatar className="size-10">
            <AvatarImage src={player.avatar || undefined} alt={player.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {player.name
                ?.split(' ')
                ?.map((word) => word[0])
                ?.join('')
                ?.toUpperCase() || '?'}
          </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-semibold truncate',
              highlightCurrentUser && player.isCurrentUser && 'text-primary'
            )}
          >
            {player.name}
          </span>
          {highlightCurrentUser && player.isCurrentUser && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
        </div>

        {/* Stats */}
        {showStats && player.stats && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {statKeys.map((key) => {
              const value = player.stats[key];
              if (value === undefined) return null;
              return (
                <span key={key}>
                  <span className="font-medium">{getStatLabel(key)}:</span>{' '}
                  {formatStatValue(key, value)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

