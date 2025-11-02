import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { useJoinGame, useLeaveGame } from './useGames';
import { toast } from 'sonner';

export function useGameActions() {
  const { updateGame, setLoading, setError } = useAppStore();
  const joinGameMutation = useJoinGame();
  const leaveGameMutation = useLeaveGame();

  // Join a game - DEPRECATED: Use useJoinGame() hook directly
  const handleJoinGame = useCallback(async (gameId: string) => {
    console.warn('🚫 useGameActions.handleJoinGame is deprecated - use useJoinGame() hook directly');
    joinGameMutation.mutate(gameId);
    return true;
  }, [joinGameMutation]);

  // Leave a game - DEPRECATED: Use useLeaveGame() hook directly
  const handleLeaveGame = useCallback(async (gameId: string) => {
    console.warn('🚫 useGameActions.handleLeaveGame is deprecated - use useLeaveGame() hook directly');
    leaveGameMutation.mutate(gameId);
    return true;
  }, [leaveGameMutation]);

  // Toggle game participation
  const toggleGameParticipation = useCallback(async (gameId: string) => {
    try {
      // Get current game state to determine if user is joined
      const { games } = useAppStore.getState();
      const game = games.find(g => g.id === gameId);
      
      if (game?.isJoined) {
        return await handleLeaveGame(gameId);
      } else {
        return await handleJoinGame(gameId);
      }
    } catch (error) {
      console.error('Error toggling game participation:', error);
      return false;
    }
  }, [handleJoinGame, handleLeaveGame]);

  // Cancel a game (for creators)
  const cancelGame = useCallback(async (gameId: string, reason?: string) => {
    try {
      updateGame(gameId, { 
        description: `${reason ? `CANCELLED: ${reason}` : 'CANCELLED'}` 
      });
      
      toast.success('Activity cancelled', {
        description: reason || 'The activity has been cancelled',
      });
      
      return true;
    } catch (error) {
      toast.error('Failed to cancel activity', {
        description: 'Please try again later',
      });
      return false;
    }
  }, [updateGame]);

  return {
    joinGame: handleJoinGame,
    leaveGame: handleLeaveGame,
    toggleGameParticipation,
    cancelGame,
  };
}