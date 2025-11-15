import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGameJoinToggle } from './useGameJoinToggle';

interface Game {
  id: string;
  title: string;
  sport: string;
  location: string;
  date: string;
  time: string;
  description: string;
  maxPlayers: number;
  totalPlayers: number; // From games_with_counts.total_players
  availableSpots: number; // From games_with_counts.available_spots
  isJoined: boolean;
  cost?: string;
  category?: string;
  [key: string]: any;
}

interface UseGameCardOptions {
  onSelect?: (gameId: string) => void;
  onJoinLeave?: (gameId: string) => void;
}

/**
 * Custom hook for common game card functionality
 * Centralizes navigation, join/leave logic, and event handling
 * Reads latest game data from React Query cache for real-time updates
 */
export function useGameCard(game: Game, options: UseGameCardOptions = {}) {
  const navigate = useNavigate();
  const joinToggle = useGameJoinToggle();
  
  // Optimistic local state - updates immediately on button click
  // Props will override this when parent re-renders with fresh data
  const [optimisticIsJoined, setOptimisticIsJoined] = useState(game.isJoined ?? false);
  const [optimisticTotalPlayers, setOptimisticTotalPlayers] = useState(game.totalPlayers ?? 0);
  
  // Sync optimistic state with props when they change (parent refetched after mutation success)
  useEffect(() => {
    // Only sync if not currently mutating (avoid race conditions)
    if (!joinToggle.isLoading) {
      // When mutation completes and parent refetches, props will have new values
      // Sync optimistic state to match props (this happens after successful mutation)
      setOptimisticIsJoined(game.isJoined ?? false);
      setOptimisticTotalPlayers(game.totalPlayers ?? 0);
    }
  }, [game.isJoined, game.totalPlayers, joinToggle.isLoading]);
  
  // Use optimistic values if mutation is pending, otherwise use props
  // This gives immediate UI feedback while mutation runs
  const isJoined = joinToggle.isLoading ? optimisticIsJoined : (game.isJoined ?? false);
  const totalPlayers = joinToggle.isLoading ? optimisticTotalPlayers : (game.totalPlayers ?? 0);
  
  // Merge game with optimistic values for display
  const currentGame = {
    ...game,
    isJoined,
    totalPlayers,
  };
  
  const handleCardClick = () => {
    const gameId = currentGame.id || game.id;
    if (!gameId) {
      console.error('❌ [useGameCard] No game ID found for card click', { currentGame, game });
      return;
    }
    
    if (options.onSelect) {
      options.onSelect(gameId);
    } else {
      navigate(`/game/${gameId}`);
    }
  };
  
  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Update optimistic state immediately for instant UI feedback
    const willBeJoined = !isJoined;
    const newTotalPlayers = willBeJoined 
      ? totalPlayers + 1 
      : Math.max(0, totalPlayers - 1);
    
    setOptimisticIsJoined(willBeJoined);
    setOptimisticTotalPlayers(newTotalPlayers);
    
    if (options.onJoinLeave) {
      // Use custom join/leave handler if provided (legacy support)
      // For custom handlers, we still need to call mutation but pass refetch callback
      joinToggle.toggleJoin(
        { ...game, isJoined },
        e,
        () => {
          // Rollback optimistic state on error
          setOptimisticIsJoined(game.isJoined ?? false);
          setOptimisticTotalPlayers(game.totalPlayers ?? 0);
        },
        () => {
          // Trigger parent refetch on success
          options.onJoinLeave?.(game.id);
        }
      );
    } else {
      // Use the centralized toggle logic
      // Optimistic state already updated above, mutation runs in background
      // Pass error callback to rollback optimistic state on mutation error
      joinToggle.toggleJoin(
        { ...game, isJoined }, 
        e,
        () => {
          // Rollback optimistic state on error
          setOptimisticIsJoined(game.isJoined ?? false);
          setOptimisticTotalPlayers(game.totalPlayers ?? 0);
        }
      );
    }
  };
  
  /**
   * Get category badge for time-based categorization
   * Uses currentGame to reflect real-time cache updates
   */
  const getCategoryBadge = () => {
    if (currentGame.category === 'today') {
      return {
        text: 'Today',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      };
    } else if (currentGame.category === 'tomorrow') {
      return {
        text: 'Tomorrow', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      };
    }
    return null;
  };
  
  /**
   * SINGLE SOURCE OF TRUTH: Use optimistic values during mutations, props otherwise
   * Compute availableSpots from maxPlayers - totalPlayers to ensure accuracy
   */
  const maxPlayers = currentGame.maxPlayers ?? 0;
  // Compute availableSpots from current values to ensure accuracy when cache updates
  const availableSpots = Math.max(0, maxPlayers - totalPlayers);
  const isFull = totalPlayers >= maxPlayers;
  
  /**
   * Get formatted player count string
   */
  const getPlayerCount = () => `${totalPlayers}/${maxPlayers} players`;
  
  /**
   * Get join status indicator props
   * Uses currentGame to reflect optimistic updates
   */
  const getJoinStatus = () => {
    if (!currentGame.isJoined) return null;
    
    return {
      text: 'Joined ✓',
      className: 'bg-success/20 text-success dark:bg-success/30 dark:text-success text-xs px-2 py-1 rounded'
    };
  };
  
  return {
    // Event handlers
    handleCardClick,
    handleJoinClick,
    
    // Join/leave functionality
    // Pass currentGame instead of game prop to ensure button text reflects cache updates
    ...joinToggle,
    
    // Computed values
    getCategoryBadge,
    isFull,
    getPlayerCount,
    getJoinStatus,
    
    // Game data - return currentGame which includes cache updates
    game: currentGame,
  };
}
