import { useNavigate } from 'react-router-dom';
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
  totalPlayers: number; // From capacity_used
  availableSpots: number; // From capacity_available
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
 */
export function useGameCard(game: Game, options: UseGameCardOptions = {}) {
  const navigate = useNavigate();
  const joinToggle = useGameJoinToggle();
  
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
      // Use the centralized toggle logic
      joinToggle.toggleJoin(game, e);
    }
  };
  
  /**
   * Get category badge for time-based categorization
   */
  const getCategoryBadge = () => {
    if (game.category === 'today') {
      return {
        text: 'Today',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      };
    } else if (game.category === 'tomorrow') {
      return {
        text: 'Tomorrow', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      };
    }
    return null;
  };
  
  /**
   * SINGLE SOURCE OF TRUTH: Only use pre-computed view fields
   */
  const totalPlayers = Number((game as any).capacity_used ?? game.totalPlayers ?? 0);
  const maxPlayers = Number((game as any).max_players ?? game.maxPlayers ?? 0);
  const availableSpots = Number((game as any).capacity_available ?? game.availableSpots ?? 0);
  const isFull = totalPlayers >= maxPlayers;
  
  // Debug logging
  console.log('useGameCard data:', {
    game_id: game.id,
    capacity_used: (game as any).capacity_used,
    capacity_available: (game as any).capacity_available,
    max_players: (game as any).max_players,
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
   */
  const getJoinStatus = () => {
    if (!game.isJoined) return null;
    
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
    ...joinToggle,
    
    // Computed values
    getCategoryBadge,
    isFull,
    getPlayerCount,
    getJoinStatus,
    
    // Game data
    game,
  };
}
