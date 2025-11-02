import { useCallback } from 'react';
import { toast } from 'sonner';
import { useJoinGame, useLeaveGame } from './useGames';
import { useAppStore } from '../store/appStore';

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
  const { user } = useAppStore();
  
  /**
   * Check if the current user is the creator of the game
   */
  const isGameCreator = useCallback((game: Game) => {
    if (!user?.id) return false;
    
    // Check multiple possible creator ID fields
    return game.creatorId === user.id || 
           game.creator_id === user.id || 
           game.createdBy === user.id ||
           game.creatorData?.id === user.id;
  }, [user?.id]);
  
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
      // Prevent creators from leaving their own activities
      if (isGameCreator(game)) {
        toast.error('Cannot leave your own activity', {
          description: 'Use the menu options to delete the activity instead.'
        });
        return;
      }
      
      console.log('🔄 Attempting to leave game:', game.id);
      leaveGameMutation.mutate(game.id, {
        onSuccess: () => {
          console.log('✅ Leave activity success callback');
          toast.success('Left activity successfully');
        },
        onError: (error) => {
          console.error('❌ Leave game error callback:', error);
        }
      });
    } else {
      console.log('🔄 Attempting to join game:', game.id);
      joinGameMutation.mutate(game.id, {
        onSuccess: () => {
          console.log('✅ Join activity success callback');
          toast.success('Joined activity successfully!');
        },
        onError: (error) => {
          console.error('❌ Join game error callback:', error);
        }
      });
    }
  }, [joinGameMutation, leaveGameMutation, isGameCreator]);
  
  /**
   * Check if join/leave operations are currently loading
   */
  const isLoading = joinGameMutation.isPending || leaveGameMutation.isPending;
  
  /**
   * Get the appropriate button text based on game state and loading
   * @param game - Game object with isJoined status
   * @returns Button text string
   */
  const getButtonText = useCallback((game: Game) => {
    if (isLoading) return '...';
    
    if (game.isJoined) {
      // Creators shouldn't see a leave button since they can't leave
      return isGameCreator(game) ? 'Joined' : 'Leave';
    }
    
    return 'Join';
  }, [isLoading, isGameCreator]);
  
  /**
   * Get appropriate button variant based on game state
   * @param game - Game object with isJoined status
   * @returns Button variant string
   */
  const getButtonVariant = useCallback((game: Game) => {
    if (game.isJoined) {
      // Creators get secondary variant (disabled-like), participants get outline
      return isGameCreator(game) ? 'secondary' : 'outline';
    }
    return 'default';
  }, [isGameCreator]);
  
  return {
    toggleJoin,
    isLoading,
    getButtonText,
    getButtonVariant,
    isGameCreator,
    // Individual mutation states for advanced use cases
    isJoining: joinGameMutation.isPending,
    isLeaving: leaveGameMutation.isPending,
  };
}
