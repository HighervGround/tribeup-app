import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  Flame,
  Star
} from 'lucide-react';
import { useSuccessfulGames, useFeaturedGame } from '@/domains/games/hooks/useSuccessfulGames';
import type { GameMetrics } from '@/domains/games/services/gameMetrics';
import { cn } from '@/shared/utils/utils';

interface SuccessfulGamesSectionProps {
  /** Maximum number of games to display */
  limit?: number;
  /** Whether to show the featured game of the week */
  showFeatured?: boolean;
  /** Optional className for the container */
  className?: string;
}

/**
 * SuccessfulGamesSection - Showcases games with high participation and success
 * 
 * Features:
 * - Featured Game of the Week highlight
 * - Grid of successful games with metrics
 * - Participation rate indicators
 * - Links to game details
 */
export function SuccessfulGamesSection({
  limit = 6,
  showFeatured = true,
  className,
}: SuccessfulGamesSectionProps) {
  const navigate = useNavigate();
  const { data: successfulGames, isLoading: gamesLoading, error: gamesError } = useSuccessfulGames(limit);
  const { data: featuredGame, isLoading: featuredLoading } = useFeaturedGame();

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  // Don't render if no games and not loading
  if (!gamesLoading && (!successfulGames || successfulGames.length === 0) && !featuredGame) {
    return null;
  }

  return (
    <section 
      className={cn('py-6', className)}
      aria-labelledby="successful-games-heading"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <h2 id="successful-games-heading" className="text-lg font-bold">
            Popular Games
          </h2>
        </div>
        {successfulGames && successfulGames.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/app/search')}
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Featured Game of the Week */}
      {showFeatured && (
        <div className="mb-6">
          {featuredLoading ? (
            <FeaturedGameSkeleton />
          ) : featuredGame ? (
            <FeaturedGameCard 
              game={featuredGame} 
              onClick={() => handleGameClick(featuredGame.id)} 
            />
          ) : null}
        </div>
      )}

      {/* Games Grid */}
      {gamesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SuccessfulGameCardSkeleton key={i} />
          ))}
        </div>
      ) : gamesError ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load popular games</p>
        </div>
      ) : successfulGames && successfulGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {successfulGames.map((game) => (
            <SuccessfulGameCard
              key={game.id}
              game={game}
              onClick={() => handleGameClick(game.id)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Featured Game Card - Highlighted card for "Game of the Week"
 */
interface FeaturedGameCardProps {
  game: GameMetrics;
  onClick: () => void;
}

function FeaturedGameCard({ game, onClick }: FeaturedGameCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 hover:shadow-lg transition-all duration-200"
      onClick={onClick}
      role="article"
      aria-label={`Featured game: ${game.title}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          {game.imageUrl && (
            <div className="relative w-full sm:w-48 h-32 sm:h-auto flex-shrink-0">
              <ImageWithFallback
                src={game.imageUrl}
                alt={game.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 p-4">
            {/* Featured Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="orange" className="gap-1">
                <Star className="w-3 h-3" aria-hidden="true" />
                Game of the Week
              </Badge>
            </div>

            {/* Title and Sport */}
            <h3 className="font-bold text-lg mb-1 line-clamp-1">{game.title}</h3>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {game.sport}
              </Badge>
              {game.isHighAttendance && (
                <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                  <Flame className="w-3 h-3" aria-hidden="true" />
                  High Demand
                </Badge>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>{game.currentPlayers}/{game.maxPlayers} joined</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" aria-hidden="true" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {game.participationRate}% fill rate
                </span>
              </div>
            </div>

            {/* Location and Date */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span className="line-clamp-1">{game.location.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>{formatDate(game.date)}</span>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <ClickableAvatar
                userId={game.creatorId}
                src={game.creatorAvatar}
                alt={game.creatorName}
                size="xs"
              />
              <span className="text-sm text-muted-foreground">
                Organized by <span className="font-medium text-foreground">{game.creatorName}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Successful Game Card - Compact card for grid display
 */
interface SuccessfulGameCardProps {
  game: GameMetrics;
  onClick: () => void;
}

function SuccessfulGameCard({ game, onClick }: SuccessfulGameCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 group"
      onClick={onClick}
      role="article"
      aria-label={`${game.title} - ${game.participationRate}% filled`}
    >
      <CardContent className="p-0">
        {/* Image or Gradient Header */}
        <div className="relative h-24 bg-gradient-to-br from-primary/10 to-primary/5">
          {game.imageUrl ? (
            <ImageWithFallback
              src={game.imageUrl}
              alt={game.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400/50" aria-hidden="true" />
            </div>
          )}
          
          {/* Participation Badge */}
          <div className="absolute top-2 right-2">
            <ParticipationBadge rate={game.participationRate} />
          </div>

          {/* Completed Badge */}
          {game.isCompleted && (
            <Badge 
              className="absolute top-2 left-2 bg-green-500 text-white border-none text-[10px] px-1.5"
            >
              Completed
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-sm line-clamp-1 flex-1 pr-2">
              {game.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {game.sport}
            </Badge>
            {game.isHighAttendance && (
              <Flame className="w-3 h-3 text-orange-500" aria-hidden="true" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" aria-hidden="true" />
            <span>{game.currentPlayers}/{game.maxPlayers}</span>
            <span className="text-border">•</span>
            <span>{formatDate(game.date)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Participation Badge - Visual indicator of fill rate
 */
function ParticipationBadge({ rate }: { rate: number }) {
  let bgColor = 'bg-gray-500';
  let textColor = 'text-white';
  
  if (rate >= 90) {
    bgColor = 'bg-green-500';
  } else if (rate >= 70) {
    bgColor = 'bg-amber-500';
  } else if (rate >= 50) {
    bgColor = 'bg-blue-500';
  }

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
        bgColor,
        textColor
      )}
      aria-label={`${rate}% filled`}
    >
      <TrendingUp className="w-2.5 h-2.5" aria-hidden="true" />
      {rate}%
    </span>
  );
}

/**
 * Skeleton components for loading states
 */
function FeaturedGameSkeleton() {
  return (
    <Card className="overflow-hidden border-amber-200 dark:border-amber-800">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <Skeleton className="w-full sm:w-48 h-32" />
          <div className="flex-1 p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessfulGameCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="h-24 w-full" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  }
  if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export default SuccessfulGamesSection;
