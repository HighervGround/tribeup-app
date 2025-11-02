import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from './badge';

interface GameCapacityProps {
  currentPlayers: number; // Authenticated participants (private_count)
  maxPlayers: number; // max_players
  publicRsvpCount?: number; // Anonymous RSVPs (public_count)
  totalPlayers?: number; // Pre-computed total from capacity_used (preferred)
  availableSpots?: number; // Pre-computed available from capacity_available (preferred)
  showDetailed?: boolean; // Show breakdown of private/public
  className?: string;
  game?: any; // Optional: Pass game object to read capacity_used directly
}

/**
 * GameCapacity - Displays live game capacity with accurate counts
 * 
 * Counts are computed from:
 * - currentPlayers: COUNT(*) from game_participants WHERE status='joined'
 * - publicRsvpCount: COUNT(*) from public_rsvps WHERE attending=true
 * - totalPlayers: currentPlayers + publicRsvpCount
 * - availableSpots: maxPlayers - totalPlayers
 */
export function GameCapacity({
  currentPlayers,
  maxPlayers,
  publicRsvpCount = 0,
  totalPlayers,
  availableSpots,
  showDetailed = false,
  className = '',
  game
}: GameCapacityProps) {
  // IMPORTANT: Use capacity_used directly, DON'T recalculate (avoids doubling)
  const total = totalPlayers ?? 0; // totalPlayers should come from capacity_used
  const available = availableSpots ?? Math.max(0, maxPlayers - total);
  
  // Determine if game is full or nearly full
  const isFull = available === 0;
  const isNearlyFull = available <= 2 && available > 0;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>
          {total}/{maxPlayers}
        </span>
      </div>
      
      {showDetailed && publicRsvpCount > 0 && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          {currentPlayers} private, {publicRsvpCount} public
        </Badge>
      )}
      
      {publicRsvpCount > 0 && !showDetailed && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          +{publicRsvpCount} public
        </Badge>
      )}
      
      {isFull && (
        <Badge variant="destructive" className="text-xs px-2 py-0.5">
          Full
        </Badge>
      )}
      
      {isNearlyFull && !isFull && (
        <Badge variant="outline" className="text-xs px-2 py-0.5 border-orange-500 text-orange-600">
          {available} left
        </Badge>
      )}
    </div>
  );
}

/**
 * GameCapacityLine - Displays detailed capacity information as text
 * Format: "Capacity: X/Y (A private, B public) | Z available"
 */
export function GameCapacityLine({
  currentPlayers,
  maxPlayers,
  publicRsvpCount = 0,
  totalPlayers,
  availableSpots
}: Omit<GameCapacityProps, 'showDetailed' | 'className'>) {
  const total = totalPlayers ?? (currentPlayers + publicRsvpCount);
  const available = availableSpots ?? Math.max(0, maxPlayers - total);
  
  return (
    <span className="text-sm text-muted-foreground">
      Capacity: {total}/{maxPlayers} ({currentPlayers} private, {publicRsvpCount} public) | {available} available
    </span>
  );
}

