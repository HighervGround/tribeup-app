import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { MapPin, Calendar, Users, Clock, Star, ChevronRight } from 'lucide-react';
import { ActivityLikeButton } from './ActivityLikeButton';
import { ActivityMapPreview } from './ActivityMapPreview';
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
  totalPlayers?: number;
  availableSpots?: number;
  isJoined: boolean;
  cost?: string;
  category?: string;
  followerCount?: number;
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
  variant?: 'full' | 'simple' | 'compact' | 'strava';
  showImage?: boolean;
  showJoinButton?: boolean;
  onSelect?: (gameId: string) => void;
  onJoinLeave?: (gameId: string) => void;
  distance?: string | null; // Distance in formatted string (e.g., "2.3 mi")
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
  onJoinLeave,
  distance = null
}: UnifiedGameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeJoining, setIsSwipeJoining] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Touch gesture handlers for swipe-to-join
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameToRender.isJoined) return; // Don't allow swipe if already joined

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeOffset(0);
    setIsSwipeJoining(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || gameToRender.isJoined) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Only respond to horizontal swipes (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault(); // Prevent scrolling when swiping
      const newOffset = Math.max(0, Math.min(deltaX, 80)); // Max 80px swipe
      setSwipeOffset(newOffset);
      setIsSwipeJoining(newOffset > 40); // Trigger join at 40px
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || gameToRender.isJoined) {
      setSwipeOffset(0);
      setIsSwipeJoining(false);
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const currentX = e.changedTouches[0].clientX;
    const deltaX = currentX - touchStartX.current;

    // If swiped far enough, trigger join
    if (deltaX > 60 && !gameToRender.isJoined && !isLoading) {
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

      // Trigger join
      handleJoinClick(e as any);
      setIsSwipeJoining(false);
    }

    // Reset swipe state
    setSwipeOffset(0);
    setIsSwipeJoining(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

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

  // Strava variant - Image-first design with statistics overlay
  if (variant === 'strava') {
    return (
      <div
        ref={cardRef}
        className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-lg transition-all duration-200 ease-out group"
        onClick={handleCardClick}
      >
        {/* Hero Image - Only show if there's an actual image */}
        {gameToRender.imageUrl && (
          <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
            <ImageWithFallback
              src={gameToRender.imageUrl}
              alt={gameToRender.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-0" />
            
            {/* User Avatar + Name Overlay - Top Left */}
            {gameToRender.host && (
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <ClickableAvatar
                  userId={gameToRender.host.id}
                  src={gameToRender.host.avatar}
                  alt={gameToRender.host.name}
                  size="sm"
                  className="ring-2 ring-white/50"
                />
                <span className="text-white font-medium text-sm drop-shadow-lg">
                  {gameToRender.host.name}
                </span>
              </div>
            )}
            
            {/* Statistics Overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Players Stat */}
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
                    <Users className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-semibold">
                      {gameToRender.totalPlayers}/{gameToRender.maxPlayers}
                    </span>
                  </div>
                  
                  {/* Time Stat */}
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
                    <Clock className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-semibold">
                      {formatTimeString(gameToRender.time)}
                    </span>
                  </div>
                  
                  {/* Location Stat */}
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-semibold truncate max-w-[100px]">
                      {gameToRender.location.split(',')[0]}
                    </span>
                  </div>
                </div>
                
                {/* Host Avatar */}
                {gameToRender.host && (
                  <div className="flex items-center gap-1.5">
                    <ClickableAvatar
                      userId={gameToRender.host.id}
                      src={gameToRender.host.avatar}
                      alt={gameToRender.host.name}
                      size="xs"
                      className="ring-2 ring-white/50"
                    />
                    <span className="text-white font-medium text-xs drop-shadow-lg">{gameToRender.host.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Stats bar when no image - inline with content */}
        {!gameToRender.imageUrl && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Players Stat */}
                <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-border/50">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-semibold">
                    {gameToRender.totalPlayers}/{gameToRender.maxPlayers}
                  </span>
                </div>
                
                {/* Time Stat */}
                <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-border/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-semibold">
                    {formatTimeString(gameToRender.time)}
                  </span>
                </div>
                
                {/* Location Stat */}
                <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-border/50">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-semibold truncate max-w-[100px]">
                    {gameToRender.location.split(',')[0]}
                  </span>
                </div>
              </div>
              
              {/* Host Avatar */}
              {gameToRender.host && (
                <div className="flex items-center gap-1.5">
                  <ClickableAvatar
                    userId={gameToRender.host.id}
                    src={gameToRender.host.avatar}
                    alt={gameToRender.host.name}
                    size="xs"
                  />
                  <span className="text-xs font-medium">{gameToRender.host.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Card Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1 truncate">{gameToRender.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {gameToRender.sport}
                </Badge>
                {gameToRender.cost && (
                  <Badge variant="outline" className="text-xs">
                    {formatCost(gameToRender.cost)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {gameToRender.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {gameToRender.description}
            </p>
          )}
          
          {/* Map Preview - Only if coordinates exist */}
          {gameToRender.latitude && gameToRender.longitude && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <ActivityMapPreview
                latitude={gameToRender.latitude}
                longitude={gameToRender.longitude}
                location={gameToRender.location}
                className="h-40 w-full"
                onClick={() => handleCardClick()}
              />
            </div>
          )}
          
          {/* Footer with Join Button */}
          {showJoinButton && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <ActivityLikeButton 
                  activityId={gameToRender.id} 
                  variant="minimal"
                  showCount={true}
                />
                {gameToRender.followerCount && gameToRender.followerCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{gameToRender.followerCount}</span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                  }
                  handleJoinClick(e);
                }}
                disabled={isLoading || (gameToRender.totalPlayers >= gameToRender.maxPlayers && !gameToRender.isJoined)}
                size="sm"
                variant={gameToRender.isJoined ? "destructive" : "default"}
                className="font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  gameToRender.totalPlayers >= gameToRender.maxPlayers && !gameToRender.isJoined
                    ? 'Full'
                    : getButtonText(gameToRender)
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Simple variant (for HomeScreen and SearchDiscovery) - Optimized for less scrolling
  return (
    <div
      ref={cardRef}
      className={`bg-card rounded-lg p-4 border border-border cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 ease-out relative overflow-hidden group ${
        swipeOffset > 0 ? 'transition-none' : ''
      } ${isHovered ? 'shadow-sm' : ''}`}
      style={{
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator background */}
      {swipeOffset > 0 && !gameToRender.isJoined && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-start pl-4">
          <div className="flex items-center gap-2 text-primary">
            <ChevronRight className="w-5 h-5" />
            <span className="font-medium text-sm">Swipe to join</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {/* Header with title and category badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-3 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-base truncate leading-tight text-foreground">{gameToRender.title}</h3>
              {getCategoryBadge() && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shadow-sm ${getCategoryBadge()?.className}`}>
                  {getCategoryBadge()?.text}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">{gameToRender.sport}</span>
              {gameToRender.cost && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {formatCost(gameToRender.cost)}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
            {/* Follower count indicator */}
            {(gameToRender.followerCount && gameToRender.followerCount > 0) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{gameToRender.followerCount} follower{gameToRender.followerCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <GameCapacity
              totalPlayers={gameToRender.totalPlayers}
              maxPlayers={gameToRender.maxPlayers}
              availableSpots={gameToRender.availableSpots}
              className="text-sm justify-end"
            />
          </div>
        </div>
      
        {/* Game details - Condensed */}
        <div className="space-y-1 text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{gameToRender.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
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

            <Button
              onClick={(e) => {
                e.stopPropagation();
                // Add haptic feedback for mobile
                if ('vibrate' in navigator) {
                  navigator.vibrate(50);
                }
                handleJoinClick(e);
              }}
              disabled={isLoading || (gameToRender.isJoined && getButtonVariant(gameToRender) === 'secondary')}
              size="sm"
              variant={getButtonVariant(gameToRender) === 'secondary' ? 'secondary' : (gameToRender.isJoined ? "destructive" : "default")}
              className={`font-semibold transition-all duration-200 ${
                getButtonVariant(gameToRender) === 'secondary'
                  ? 'opacity-60 cursor-not-allowed'
                  : gameToRender.isJoined
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              title={getButtonVariant(gameToRender) === 'secondary' ? "You created this activity" : undefined}
            >
              {isLoading ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Joining...</span>
                </div>
              ) : (
                getButtonText(gameToRender)
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedGameCard;
