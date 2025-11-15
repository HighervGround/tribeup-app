import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { MapPin, Calendar, Users, Clock, Star } from 'lucide-react';
import { useGameCard } from '@/domains/games/hooks/useGameCard';
import { formatTimeString, formatCost, formatEventHeader } from '@/shared/utils/dateUtils';
import { GameCapacity } from '@/shared/components/ui/GameCapacity';
import { SimpleCalendarButton } from '@/shared/components/common/SimpleCalendarButton';

interface Game {
  id: string;
  title: string;
  sport: string;
  sportColor?: string;
  location: string;
  date: string;
  time: string;
  description: string;
  imageUrl?: string;
  currentPlayers: number;
  maxPlayers: number;
  isJoined: boolean;
  cost?: string;
  category?: string;
  host?: {
    id?: string;
    name: string;
    avatar?: string;
  };
  rating?: number;
  [key: string]: any;
}

interface UnifiedGameCardProps {
  game: Game;
  variant?: 'full' | 'simple' | 'compact';
  showImage?: boolean;
  showJoinButton?: boolean;
  onSelect?: (gameId: string) => void;
  onJoinLeave?: (gameId: string) => void;
}

/**
 * Unified GameCard component that handles all game card variants
 * Replaces SimpleGameCard components in HomeScreen and SearchDiscovery
 */
export function UnifiedGameCard({ 
  game, 
  variant = 'simple',
  showImage = false,
  showJoinButton = true,
  onSelect,
  onJoinLeave
}: UnifiedGameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const {
    handleCardClick,
    handleJoinClick,
    isLoading,
    getButtonText,
    getButtonVariant,
    getCategoryBadge,
    getPlayerCount,
    getJoinStatus,
    game: currentGame // Use the game from hook which has cache updates
  } = useGameCard(game, { onSelect, onJoinLeave });
  
  // Use currentGame from hook (with cache updates) instead of prop
  const gameToRender = currentGame || game;

  // Full variant (original GameCard)
  if (variant === 'full') {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card 
          className={`overflow-hidden cursor-pointer transition-all duration-200 ease-out ${
            isHovered ? 'shadow-medium' : 'shadow-subtle'
          }`}
          onClick={handleCardClick}
        >
          <div className="relative overflow-hidden">
            {gameToRender.imageUrl ? (
              <div className="aspect-video overflow-hidden">
                <ImageWithFallback
                  src={gameToRender.imageUrl}
                  alt={gameToRender.sport}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out"
                />
              </div>
            ) : (
              <div className="h-16 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center">
                <Badge variant="secondary" className="text-sm">
                  {gameToRender.sport}
                </Badge>
              </div>
            )}
            
            {/* Gradient overlay on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-200 ${
                isHovered ? 'opacity-10' : 'opacity-0'
              }`}
            />
            
            {/* Date/Time Block - Top Left */}
            <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[80px]">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatEventHeader(gameToRender.date, gameToRender.time).date}</span>
              </div>
              <div className="text-sm font-medium">{formatTimeString(gameToRender.time)}</div>
            </div>

            {/* Sport Tag - Top Right */}
            <div className="absolute top-3 right-3">
              <Badge className={`${gameToRender.sportColor || 'bg-primary'} text-white border-none`}>
                {gameToRender.sport}
              </Badge>
            </div>

            {/* Join status indicator */}
            {/* Use gameToRender from useGameCard hook which has cache updates */}
            {gameToRender.isJoined && (
              <div className="absolute bottom-3 right-3 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">{gameToRender.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{gameToRender.location}</span>
                </div>
              </div>
              
              {/* Host info */}
              {gameToRender.host && (
                <div className="flex items-center gap-2 text-sm">
                  <ClickableAvatar
                    userId={gameToRender.host.id}
                    src={gameToRender.host.avatar}
                    alt={gameToRender.host.name}
                    size="xs"
                  />
                  <span className="text-muted-foreground">Hosted by {gameToRender.host.name}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <GameCapacity
                  totalPlayers={gameToRender.totalPlayers}
                  maxPlayers={gameToRender.maxPlayers}
                  availableSpots={gameToRender.availableSpots}
                />
                
                <div className="flex gap-2">
                  {showJoinButton && (
                    <Button 
                      size="sm" 
                      variant={getButtonVariant(gameToRender)}
                      onClick={handleJoinClick}
                      className="transition-all duration-200 flex-1"
                      disabled={isLoading || (gameToRender.totalPlayers >= gameToRender.maxPlayers && !gameToRender.isJoined)}
                    >
                      {gameToRender.totalPlayers >= gameToRender.maxPlayers && !gameToRender.isJoined ? 'Game Full' : getButtonText(gameToRender)}
                    </Button>
                  )}
                  <SimpleCalendarButton 
                    game={gameToRender} 
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Simple variant (for HomeScreen and SearchDiscovery) - Optimized for less scrolling
  return (
    <div 
      className="bg-card rounded-lg p-3 border border-border cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      {/* Header with title and category badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-3 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate">{gameToRender.title}</h3>
            {getCategoryBadge() && (
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${getCategoryBadge()?.className}`}>
                {getCategoryBadge()?.text}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{gameToRender.sport}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {gameToRender.cost && <div className="text-xs font-medium">{formatCost(gameToRender.cost)}</div>}
          <GameCapacity
            totalPlayers={gameToRender.totalPlayers}
            maxPlayers={gameToRender.maxPlayers}
            availableSpots={gameToRender.availableSpots}
            className="text-xs justify-end"
          />
        </div>
      </div>
      
      {/* Game details - Condensed */}
      <div className="space-y-1 text-xs text-muted-foreground mb-2">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{gameToRender.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{gameToRender.date} at {formatTimeString(gameToRender.time)}</span>
        </div>
      </div>
      
      {/* Truncated description */}
      {gameToRender.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {gameToRender.description}
        </p>
      )}
      
      {/* Footer with join button */}
      {showJoinButton && (
        <div className="flex items-center justify-end gap-2">
          {getJoinStatus() && (
            <span className={`inline-block text-xs ${getJoinStatus()?.className}`}>
              {getJoinStatus()?.text}
            </span>
          )}
          
          <button
            onClick={handleJoinClick}
            disabled={isLoading}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : gameToRender.isJoined 
                  ? 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive hover:bg-destructive/30 dark:hover:bg-destructive/40' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {getButtonText(gameToRender)}
          </button>
        </div>
      )}
    </div>
  );
}

export default UnifiedGameCard;
