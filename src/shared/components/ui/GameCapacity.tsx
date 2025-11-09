import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

interface GameCapacityProps {
  totalPlayers: number; // Pre-computed from games_with_counts.total_players (DO NOT recalculate)
  maxPlayers: number; // From games_with_counts.max_players
  availableSpots: number; // Pre-computed from games_with_counts.available_spots (DO NOT recalculate)
  className?: string;
}

/**
 * GameCapacity - Displays game capacity from pre-computed view fields ONLY
 * 
 * SINGLE SOURCE OF TRUTH:
 * - totalPlayers: from games_with_counts.total_players
 * - maxPlayers: from games_with_counts.max_players
 * - availableSpots: from games_with_counts.available_spots
 * 
 * DO NOT pass private_count/public_count or recalculate anything
 */
export function GameCapacity({
  totalPlayers,
  maxPlayers,
  availableSpots,
  className = ''
}: GameCapacityProps) {
  const total = Number(totalPlayers ?? 0);
  const max = Number(maxPlayers ?? 0);
  const available = Math.max(0, Number(availableSpots ?? 0));
  
  // Determine if game is full or nearly full
  const isFull = available === 0;
  const isNearlyFull = available <= 2 && available > 0;
  
  // Debug logging
  console.log('GameCapacity render:', {
    totalPlayers: total,
    maxPlayers: max,
    availableSpots: available
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>
          {total}/{max}
        </span>
      </div>
      
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
 * GameCapacityLine - Displays capacity as text
 * Format: "Capacity: X/Y | Z available"
 */
export function GameCapacityLine({
  totalPlayers,
  maxPlayers,
  availableSpots
}: GameCapacityProps) {
  const total = Number(totalPlayers ?? 0);
  const max = Number(maxPlayers ?? 0);
  const available = Math.max(0, Number(availableSpots ?? 0));
  
  return (
    <span className="text-sm text-muted-foreground">
      Capacity: {total}/{max} | {available} available
    </span>
  );
}

