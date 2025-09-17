import { useCallback } from 'react';
import { toast } from 'sonner';
import { useJoinGame, useLeaveGame } from './useGames';

interface Game {
  id: string;
  isJoined: boolean;
  [key: string]: any;
}

/**
 * Custom hook to handle game join/leave toggle functionality
 * Eliminates duplication of join/leave logic across components
 */
export function useGameJoinToggle() {
  const joinGameMutation = useJoinGame();
  const leaveGameMutation = useLeaveGame();
  
  /**
   * Toggle join/leave status for a game
   * @param game - Game object with id and isJoined status
   * @param e - Optional React MouseEvent to prevent propagation
   */
  const toggleJoin = useCallback((game: Game, e?: React.MouseEvent) => {
    // Prevent event bubbling if provided (useful for cards)
    e?.stopPropagation();
    
    console.log('🎯 toggleJoin called with game:', game.id, 'isJoined:', game.isJoined);
    
    if (game.isJoined) {
      console.log('🔄 Attempting to leave game:', game.id);
      leaveGameMutation.mutate(game.id, {
        onSuccess: () => {
          console.log('✅ Leave game success callback');
          toast.success('Left game successfully');
        },
        onError: (error) => {
          console.error('❌ Leave game error callback:', error);
        }
      });
    } else {
      console.log('🔄 Attempting to join game:', game.id);
      joinGameMutation.mutate(game.id, {
        onSuccess: () => {
          console.log('✅ Join game success callback');
          toast.success('Joined game successfully!');
        },
        onError: (error) => {
          console.error('❌ Join game error callback:', error);
        }
      });
    }
  }, [joinGameMutation, leaveGameMutation]);
  
  /**
   * Get the appropriate button text based on game state and loading
   * @param game - Game object with isJoined status
   * @returns Button text string
   */
  const getButtonText = useCallback((game: Game) => {
    if (isLoading) return '...';
    return game.isJoined ? 'Leave' : 'Join';
  }, [joinGameMutation.isPending, leaveGameMutation.isPending]);
  
  /**
   * Check if join/leave operations are currently loading
   */
  const isLoading = joinGameMutation.isPending || leaveGameMutation.isPending;
  
  /**
   * Get appropriate button variant based on game state
   * @param game - Game object with isJoined status
   * @returns Button variant string
   */
  const getButtonVariant = useCallback((game: Game) => {
    return game.isJoined ? 'outline' : 'default';
  }, []);
  
  return {
    toggleJoin,
    isLoading,
    getButtonText,
    getButtonVariant,
    // Individual mutation states for advanced use cases
    isJoining: joinGameMutation.isPending,
    isLeaving: leaveGameMutation.isPending,
  };
}
