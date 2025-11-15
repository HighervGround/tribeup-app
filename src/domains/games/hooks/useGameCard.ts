import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useGameJoinToggle } from './useGameJoinToggle';
import { gameKeys } from './useGames';

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
  const queryClient = useQueryClient();
  const joinToggle = useGameJoinToggle();
  
  // Subscribe to cache updates using useSyncExternalStore (what React Query uses internally)
  // This ensures we react to optimistic updates immediately
  const gamesList = useSyncExternalStore(
    (onStoreChange) => {
      // Subscribe to cache changes for games list
      const unsubscribeList = queryClient.getQueryCache().subscribe((event) => {
        if (event?.query?.queryKey && 
            JSON.stringify(event.query.queryKey) === JSON.stringify(gameKeys.lists())) {
          onStoreChange();
        }
      });
      
      // Subscribe to cache changes for game detail
      const unsubscribeDetail = queryClient.getQueryCache().subscribe((event) => {
        if (event?.query?.queryKey && 
            JSON.stringify(event.query.queryKey) === JSON.stringify(gameKeys.detail(game.id))) {
          onStoreChange();
        }
      });
      
      return () => {
        unsubscribeList();
        unsubscribeDetail();
      };
    },
    () => {
      // Get latest data from cache
      return queryClient.getQueryData<Game[]>(gameKeys.lists()) || [];
    },
    () => queryClient.getQueryData<Game[]>(gameKeys.lists()) || [] // Server snapshot
  );
  
  // Subscribe to game detail cache as well
  const gameDetail = useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (event?.query?.queryKey && 
            JSON.stringify(event.query.queryKey) === JSON.stringify(gameKeys.detail(game.id))) {
          onStoreChange();
        }
      });
      return unsubscribe;
    },
    () => queryClient.getQueryData<Game>(gameKeys.detail(game.id)),
    () => queryClient.getQueryData<Game>(gameKeys.detail(game.id))
  );
  
  // Get the latest game data from React Query cache
  // This ensures we use optimistic updates immediately
  const currentGame: Game = (() => {
    // First, try to get the game from the games list cache
    const cachedGame = gamesList?.find(g => g.id === game.id);
    
    // If not found in list, try the detail cache
    if (!cachedGame && gameDetail) {
      // Merge detail data with prop to preserve all fields
      return { ...game, ...gameDetail };
    }
    
    // Return cached game if found (with updated isJoined), otherwise use prop
    // Merge to preserve all fields from prop while updating with cache values
    return cachedGame ? { ...game, ...cachedGame } : game;
  })();
  
  const handleCardClick = () => {
    if (options.onSelect) {
      options.onSelect(game.id);
    } else {
      navigate(`/game/${game.id}`);
    }
  };
  
  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (options.onJoinLeave) {
      // Use custom join/leave handler if provided (legacy support)
      options.onJoinLeave(game.id);
    } else {
      // Use the centralized toggle logic with current game state
      joinToggle.toggleJoin(currentGame, e);
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
   * SINGLE SOURCE OF TRUTH: Only use pre-computed view fields
   * Use currentGame (from cache) instead of game prop for real-time updates
   */
  const totalPlayers = currentGame.totalPlayers ?? 0;
  const maxPlayers = currentGame.maxPlayers ?? 0;
  const availableSpots = currentGame.availableSpots ?? 0;
  const isFull = totalPlayers >= maxPlayers;
  
  // Debug logging
  console.log('useGameCard data:', {
    game_id: currentGame.id,
    total_players: currentGame.totalPlayers,
    available_spots: currentGame.availableSpots,
    max_players: currentGame.maxPlayers,
    isJoined: currentGame.isJoined,
    totalPlayers,
    maxPlayers,
    availableSpots,
    isFull
  });
  
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
