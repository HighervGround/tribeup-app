import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';

export function useGameActions() {
  const { joinGame, leaveGame, updateGame, setLoading, setError } = useAppStore();
  const games = useAppStore((state) => state.games);

  // Join a game
  const handleJoinGame = useCallback(async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) {
      toast.error('Game not found');
      return false;
    }

    if (game.isJoined) {
      toast('Already joined', { description: 'You are already part of this game' });
      return false;
    }

    if (game.currentPlayers >= game.maxPlayers) {
      toast.error('Game is full', { description: 'This game has reached maximum capacity' });
      return false;
    }

    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      joinGame(gameId);
      
      toast.success('Joined game!', {
        description: `You're now part of ${game.title}`,
      });
      
      return true;
    } catch (error) {
      setError('Failed to join game');
      toast.error('Failed to join game', {
        description: 'Please try again later',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [games, joinGame, setLoading, setError]);

  // Leave a game
  const handleLeaveGame = useCallback(async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) {
      toast.error('Game not found');
      return false;
    }

    if (!game.isJoined) {
      toast('Not joined', { description: 'You are not part of this game' });
      return false;
    }

    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      leaveGame(gameId);
      
      toast.success('Left game successfully', {
        description: `You've left ${game.title}`,
      });
      
      return true;
    } catch (error) {
      setError('Failed to leave game');
      toast.error('Failed to leave game', {
        description: 'Please try again later',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [games, leaveGame, setLoading, setError]);

  // Toggle game participation
  const toggleGameParticipation = useCallback(async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return false;

    if (game.isJoined) {
      return await handleLeaveGame(gameId);
    } else {
      return await handleJoinGame(gameId);
    }
  }, [games, handleJoinGame, handleLeaveGame]);

  // Cancel a game (for creators)
  const cancelGame = useCallback(async (gameId: string, reason?: string) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateGame(gameId, { 
        description: `${reason ? `CANCELLED: ${reason}` : 'CANCELLED'}` 
      });
      
      toast.success('Game cancelled', {
        description: reason || 'The game has been cancelled',
      });
      
      return true;
    } catch (error) {
      setError('Failed to cancel game');
      toast.error('Failed to cancel game', {
        description: 'Please try again later',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateGame, setLoading, setError]);

  return {
    joinGame: handleJoinGame,
    leaveGame: handleLeaveGame,
    toggleGameParticipation,
    cancelGame,
  };
}