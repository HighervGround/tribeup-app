import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useJoinGame, useLeaveGame } from './useGames';
import { toast } from 'sonner';

export function useGameActions() {
  const { updateGame, setLoading, setError } = useAppStore();
  const joinGameMutation = useJoinGame();
  const leaveGameMutation = useLeaveGame();

  // Join a game
  const handleJoinGame = useCallback(async (gameId: string) => {
    try {
      joinGameMutation.mutate(gameId);
      return true;
    } catch (error) {
      return false;
    }
  }, [joinGameMutation]);

  // Leave a game
  const handleLeaveGame = useCallback(async (gameId: string) => {
    try {
      leaveGameMutation.mutate(gameId);
      return true;
    } catch (error) {
      return false;
    }
  }, [leaveGameMutation]);

  // Toggle game participation
  const toggleGameParticipation = useCallback(async (gameId: string) => {
    // This will be handled by the individual components using the mutations directly
    // This function is kept for backward compatibility
    return await handleJoinGame(gameId);
  }, [handleJoinGame]);

  // Cancel a game (for creators)
  const cancelGame = useCallback(async (gameId: string, reason?: string) => {
    try {
      updateGame(gameId, { 
        description: `${reason ? `CANCELLED: ${reason}` : 'CANCELLED'}` 
      });
      
      toast.success('Game cancelled', {
        description: reason || 'The game has been cancelled',
      });
      
      return true;
    } catch (error) {
      toast.error('Failed to cancel game', {
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