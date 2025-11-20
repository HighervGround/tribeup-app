import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
  MessageCircle,
  UserPlus,
  Star,
  Trophy,
  Activity,
  MapPin,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

export interface PlayerStats {
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  rating?: number;
  winRate?: number;
  favoriteSport?: string;
  location?: string;
}

export interface PlayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  player: {
    id?: string;
    name: string;
    avatar?: string | null;
    username?: string;
    stats?: PlayerStats;
    isOnline?: boolean;
    isInGame?: boolean;
    isCurrentUser?: boolean;
  };
  variant?: 'list' | 'card' | 'compact';
  showStats?: boolean;
  showActions?: boolean;
  onInvite?: (playerId: string) => void;
  onMessage?: (playerId: string) => void;
  onViewProfile?: (playerId: string) => void;
  onMoreActions?: (playerId: string) => void;
}

/**
 * Player/Athlete Card Component
 * 
 * Displays a player profile with stats, status indicators, and quick actions.
 * Based on Strava's athlete card patterns.
 * 
 * @example
 * ```tsx
 * <PlayerCard
 *   player={{
 *     id: '1',
 *     name: 'John Doe',
 *     avatar: '/avatar.jpg',
 *     stats: { gamesPlayed: 50, wins: 35, rating: 4.8 }
 *   }}
 *   variant="card"
 *   showStats
 *   onInvite={(id) => invitePlayer(id)}
 * />
 * ```
 */
export function PlayerCard({
  player,
  variant = 'card',
  showStats = true,
  showActions = true,
  onInvite,
  onMessage,
  onViewProfile,
  onMoreActions,
  className,
  ...props
}: PlayerCardProps) {
  const stats = player.stats || {};

  const handleInvite = () => {
    if (player.id && onInvite) {
      onInvite(player.id);
    }
  };

  const handleMessage = () => {
    if (player.id && onMessage) {
      onMessage(player.id);
    }
  };

  const handleViewProfile = () => {
    if (player.id && onViewProfile) {
      onViewProfile(player.id);
    }
  };

  // Compact variant - minimal display
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors',
          className
        )}
        {...props}
      >
        {player.id ? (
          <ClickableAvatar
            userId={player.id}
            src={player.avatar || undefined}
            alt={player.name}
            size="sm"
          />
        ) : (
          <Avatar className="size-8">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{player.name}</span>
            {player.isOnline && (
              <div className="size-2 rounded-full bg-success" title="Online" />
            )}
          </div>
          {stats.rating && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-warning text-warning" />
              <span>{stats.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List variant - horizontal layout
  if (variant === 'list') {
    return (
      <Card
        className={cn(
          'hover:shadow-medium transition-all duration-200',
          className
        )}
        {...props}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              {player.id ? (
                <ClickableAvatar
                  userId={player.id}
                  src={player.avatar || undefined}
                  alt={player.name}
                  size="md"
                />
              ) : (
                <Avatar className="size-12">
                  <AvatarImage src={player.avatar || undefined} alt={player.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {player.name
                      ?.split(' ')
                      ?.map((word) => word[0])
                      ?.join('')
                      ?.toUpperCase() || '?'}
                </AvatarFallback>
                </Avatar>
              )}
              {/* Status Indicators */}
              {player.isOnline && (
                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-success border-2 border-background" />
              )}
              {player.isInGame && (
                <div className="absolute top-0 right-0 size-3 rounded-full bg-primary border-2 border-background" />
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{player.name}</h3>
                {player.isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
              {player.username && (
                <p className="text-sm text-muted-foreground">@{player.username}</p>
              )}

              {/* Stats */}
              {showStats && (
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {stats.gamesPlayed !== undefined && (
                    <div className="flex items-center gap-1">
                      <Activity className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {stats.gamesPlayed} games
                      </span>
                    </div>
                  )}
                  {stats.wins !== undefined && (
                    <div className="flex items-center gap-1">
                      <Trophy className="size-3 text-warning" />
                      <span className="text-muted-foreground">{stats.wins} wins</span>
                    </div>
                  )}
                  {stats.rating !== undefined && (
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-warning text-warning" />
                      <span className="text-muted-foreground">
                        {stats.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && !player.isCurrentUser && (
              <div className="flex-shrink-0 flex items-center gap-2">
                {onMessage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleMessage}
                    aria-label={`Message ${player.name}`}
                  >
                    <MessageCircle className="size-4" />
                  </Button>
                )}
                {onInvite && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleInvite}
                    aria-label={`Invite ${player.name}`}
                  >
                    <UserPlus className="size-4" />
                  </Button>
                )}
                {onMoreActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="More actions"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewProfile && (
                        <DropdownMenuItem onClick={handleViewProfile}>
                          View Profile
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onMoreActions(player.id!)}>
                        More Options
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card variant - full card layout
  return (
    <Card
      className={cn(
        'hover:shadow-medium transition-all duration-200 cursor-pointer',
        className
      )}
      onClick={handleViewProfile}
      {...props}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Avatar */}
          <div className="relative">
            {player.id ? (
              <ClickableAvatar
                userId={player.id}
                src={player.avatar || undefined}
                alt={player.name}
                size="lg"
              />
            ) : (
              <Avatar className="size-16">
                <AvatarImage src={player.avatar || undefined} alt={player.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {player.name
                    ?.split(' ')
                    ?.map((word) => word[0])
                    ?.join('')
                    ?.toUpperCase() || '?'}
              </AvatarFallback>
              </Avatar>
            )}
            {/* Status Indicators */}
            {player.isOnline && (
              <div className="absolute bottom-0 right-0 size-4 rounded-full bg-success border-2 border-background" />
            )}
            {player.isInGame && (
              <div className="absolute top-0 right-0 size-4 rounded-full bg-primary border-2 border-background" />
            )}
          </div>

          {/* Player Info */}
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="font-semibold">{player.name}</h3>
              {player.isCurrentUser && (
                <Badge variant="secondary" className="text-xs">
                  You
                </Badge>
              )}
            </div>
            {player.username && (
              <p className="text-sm text-muted-foreground">@{player.username}</p>
            )}

            {/* Stats */}
            {showStats && (
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                {stats.gamesPlayed !== undefined && (
                  <div className="flex flex-col items-center">
                    <Activity className="size-4 text-muted-foreground mb-1" />
                    <span className="text-xs font-semibold">{stats.gamesPlayed}</span>
                    <span className="text-[10px] text-muted-foreground">Games</span>
                  </div>
                )}
                {stats.wins !== undefined && (
                  <div className="flex flex-col items-center">
                    <Trophy className="size-4 text-warning mb-1" />
                    <span className="text-xs font-semibold">{stats.wins}</span>
                    <span className="text-[10px] text-muted-foreground">Wins</span>
                  </div>
                )}
                {stats.rating !== undefined && (
                  <div className="flex flex-col items-center">
                    <Star className="size-4 fill-warning text-warning mb-1" />
                    <span className="text-xs font-semibold">{stats.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground">Rating</span>
                  </div>
                )}
              </div>
            )}

            {/* Location */}
            {stats.location && (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span>{stats.location}</span>
              </div>
            )}

            {/* Actions */}
            {showActions && !player.isCurrentUser && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {onMessage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessage();
                    }}
                  >
                    <MessageCircle className="size-3 mr-1" />
                    Message
                  </Button>
                )}
                {onInvite && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInvite();
                    }}
                  >
                    <UserPlus className="size-3 mr-1" />
                    Invite
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

