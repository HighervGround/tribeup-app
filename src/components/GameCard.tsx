import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Calendar, Users, Clock, Star } from 'lucide-react';
import { useGameJoinToggle } from '../hooks/useGameJoinToggle';

interface GameCardProps {
  game: {
    id: string;
    title: string;
    sport: string;
    sportColor: string;
    location: string;
    date: string;
    time: string;
    description: string;
    imageUrl: string;
    participants: number;
    maxParticipants: number;
    isJoined: boolean;
    isHosted: boolean;
    host: {
      name: string;
      avatar: string;
    };
    rating?: number;
  };
  compact?: boolean;
  onSelect?: (gameId: string) => void;
}

export function GameCard({ game, compact = false, onSelect }: GameCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { toggleJoin, isLoading, getButtonText, getButtonVariant } = useGameJoinToggle();

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(game.id);
    } else {
      navigate(`/game/${game.id}`);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className={`overflow-hidden cursor-pointer transition-all duration-200 ease-out ${
          compact ? 'w-full' : ''
        } ${isHovered ? 'shadow-medium' : 'shadow-subtle'}`}
        onClick={handleCardClick}
      >
        <div className="relative overflow-hidden">
          {game.imageUrl ? (
            <div className={`aspect-video ${compact ? 'aspect-[4/3]' : ''} overflow-hidden`}>
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
              <span className="text-xs text-muted-foreground">{game.date}</span>
            </div>
            <div className="text-sm font-medium">{game.time}</div>
          </div>

          {/* Sport Tag - Top Right */}
          <div className="absolute top-3 right-3">
            <Badge className={`${game.sportColor} text-white border-none`}>
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
          {/* Game Title & Location */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold mb-1">
              {game.title}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{game.location}</span>
            </div>
          </div>

          {/* Description */}
          {!compact && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {game.description}
            </p>
          )}

          {/* Host Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {game.host.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                Hosted by {game.host.name}
              </span>
            </div>
            {game.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-muted-foreground">{game.rating}</span>
              </div>
            )}
          </div>

          {/* Participants & Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{game.currentPlayers || game.participants}/{game.maxPlayers || game.maxParticipants}</span>
            </div>
            
            {!compact && (
              <Button 
                size="sm" 
                variant={getButtonVariant(game)}
                onClick={(e) => toggleJoin(game, e)}
                className="transition-all duration-200"
                disabled={isLoading || (game.currentPlayers >= game.maxPlayers && !game.isJoined)}
              >
                {game.currentPlayers >= game.maxPlayers && !game.isJoined ? 'Game Full' : getButtonText(game)}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}