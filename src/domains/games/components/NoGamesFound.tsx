import React from 'react';
import { NoGamesFound as NoGamesFoundEnhanced } from '@/shared/components/ui/empty-state-enhanced';
import { Calendar, MapPin } from 'lucide-react';

interface NoGamesFoundProps {
  onCreateGame: () => void;
  onExplore?: () => void;
}

export function NoGamesFound({ onCreateGame, onExplore }: NoGamesFoundProps) {
  return (
    <NoGamesFoundEnhanced
      onCreateGame={onCreateGame}
      onExplore={onExplore}
    />
  );
}

