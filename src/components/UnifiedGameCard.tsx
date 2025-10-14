import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ClickableAvatar } from './ui/clickable-avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Calendar, Users, Clock, Star } from 'lucide-react';
import { useGameCard } from '../hooks/useGameCard';
import { formatTimeString, formatCost, formatEventHeader } from '../lib/dateUtils';
import { RealtimeAvatarStack } from './realtime-avatar-stack';
import { SimpleCalendarButton } from './SimpleCalendarButton';

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
    getJoinStatus
  } = useGameCard(game, { onSelect, onJoinLeave });

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
            {game.imageUrl ? (
              <div className="aspect-video overflow-hidden">
                <ImageWithFallback
                  src={game.imageUrl}
                  alt={game.sport}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out"
                />
              </div>
            ) : (
              <div className="h-16 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center">
                <Badge variant="secondary" className="text-sm">
                  {game.sport}
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
                <span className="text-xs text-muted-foreground">{formatEventHeader(game.date, game.time).date}</span>
              </div>
              <div className="text-sm font-medium">{formatTimeString(game.time)}</div>
            </div>

            {/* Sport Tag - Top Right */}
            <div className="absolute top-3 right-3">
              <Badge className={`${game.sportColor || 'bg-primary'} text-white border-none`}>
                {game.sport}
              </Badge>
            </div>

            {/* Join status indicator */}
            {game.isJoined && (
              <div className="absolute bottom-3 right-3 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">{game.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{game.location}</span>
                </div>
              </div>
              
              {/* Host info */}
              {game.host && (
                <div className="flex items-center gap-2 text-sm">
                  <ClickableAvatar
                    userId={game.host.id}
                    src={game.host.avatar}
                    alt={game.host.name}
                    size="sm"
                  />
                  <span className="text-muted-foreground">Hosted by {game.host.name}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{getPlayerCount()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RealtimeAvatarStack roomName={`game-${game.id}`} />
                    <span className="text-xs text-muted-foreground">online</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {showJoinButton && (
                    <Button 
                      size="sm" 
                      variant={getButtonVariant(game)}
                      onClick={handleJoinClick}
                      className="transition-all duration-200 flex-1"
                      disabled={isLoading || (game.currentPlayers >= game.maxPlayers && !game.isJoined)}
                    >
                      {game.currentPlayers >= game.maxPlayers && !game.isJoined ? 'Game Full' : getButtonText(game)}
                    </Button>
                  )}
                  <SimpleCalendarButton 
                    game={game} 
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

  // Simple variant (for HomeScreen and SearchDiscovery)
  return (
    <div 
      className="bg-card rounded-lg p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      {/* Header with title and category badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{game.title}</h3>
            {getCategoryBadge() && (
              <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${getCategoryBadge()?.className}`}>
                {getCategoryBadge()?.text}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{game.sport}</p>
          
          {/* Host info for simple variant */}
          {game.host && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <ClickableAvatar
                userId={game.host.id}
                src={game.host.avatar}
                alt={game.host.name}
                size="sm"
              />
              <span className="text-muted-foreground">Hosted by {game.host.name}</span>
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {game.cost && <div className="text-sm font-medium">{formatCost(game.cost)}</div>}
          <div className="text-xs text-muted-foreground">
            {getPlayerCount()}
          </div>
        </div>
      </div>
      
      {/* Game details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{game.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{getPlayerCount()}</span>
          <div className="flex items-center gap-1 ml-2">
            <RealtimeAvatarStack roomName={`game-${game.id}`} />
            <span className="text-xs text-muted-foreground">online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{game.date} at {formatTimeString(game.time)}</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-3">{game.description}</p>
      
      {/* Footer with join status and button */}
      {showJoinButton && (
        <div className="flex items-center justify-between mt-3">
          {getJoinStatus() ? (
            <span className={`inline-block ${getJoinStatus()?.className}`}>
              {getJoinStatus()?.text}
            </span>
          ) : (
            <div></div>
          )}
          
          <button
            onClick={handleJoinClick}
            disabled={isLoading}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : game.isJoined 
                  ? 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive hover:bg-destructive/30 dark:hover:bg-destructive/40' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {getButtonText(game)}
          </button>
        </div>
      )}
    </div>
  );
}

export default UnifiedGameCard;
