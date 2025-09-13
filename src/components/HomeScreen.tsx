import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Plus, RefreshCw, MapPin, Clock, Users } from 'lucide-react';
import { formatEventHeader, formatCalendarInfo, formatTimeString } from '../lib/dateUtils';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { useUserPresence } from '../hooks/useUserPresence';



// Simple GameCard component
function SimpleGameCard({ game, onSelect }: { game: any; onSelect: () => void }) {
  const { joinGame, leaveGame } = useAppStore();

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (game.isJoined) {
      leaveGame(game.id);
    } else {
      joinGame(game.id);
    }
  };

  const handleCardClick = () => {
    onSelect();
  };

  // Get category badge
  const getCategoryBadge = () => {
    if (game.category === 'today') {
      return <span className="inline-block bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-xs px-2 py-1 rounded-full font-medium">Today</span>;
    } else if (game.category === 'tomorrow') {
      return <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-1 rounded-full font-medium">Tomorrow</span>;
    }
    return null;
  };

  return (
    <div 
      className="bg-card rounded-lg p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{game.title}</h3>
            {getCategoryBadge()}
          </div>
          <p className="text-sm text-muted-foreground">{game.sport}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium">{game.cost}</div>
          <div className="text-xs text-muted-foreground">
            {game.currentPlayers}/{game.maxPlayers} players
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{game.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{game.currentPlayers}/{game.maxPlayers} players</span>
        </div>
        {game.distance && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">📏</span>
            <span>{game.distance}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{game.date} at {formatTimeString(game.time)}</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-3">{game.description}</p>
      
      <div className="flex items-center justify-between mt-3">
        {game.isJoined ? (
          <span className="inline-block bg-success/20 text-success dark:bg-success/30 dark:text-success text-xs px-2 py-1 rounded">
            Joined ✓
          </span>
        ) : (
          <div></div>
        )}
        
        <button
          onClick={handleJoinClick}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            game.isJoined 
              ? 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive hover:bg-destructive/30 dark:hover:bg-destructive/40' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {game.isJoined ? 'Leave' : 'Join'}
        </button>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { games, setGames, isLoading, setLoading, user } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const userPreferredSports = useMemo(() => user?.preferences?.sports ?? [], [user]);
  const { onlineCount, isLoading: presenceLoading } = useUserPresence();

  // Calculate real stats
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Count games this week
    const thisWeekGames = games.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate >= startOfWeek && gameDate <= endOfWeek;
    }).length;

    return {
      totalGames: games.length,
      thisWeekGames,
      onlinePlayers: onlineCount
    };
  }, [games, onlineCount]);

  // Load games only once on mount, prevent multiple calls
  useEffect(() => {
    if (games.length === 0 && !isLoading) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Disabled realtime to prevent WebSocket connection issues
  // useEffect(() => {
  //   let timeoutId: NodeJS.Timeout;
  //   
  //   const sub = SupabaseService.subscribeToAllGames((payload) => {
  //     console.log('[Realtime] games INSERT received', payload?.new?.id || '');
  //     
  //     // Debounce realtime updates to avoid excessive API calls
  //     clearTimeout(timeoutId);
  //     timeoutId = setTimeout(async () => {
  //       try {
  //         const data = feedMode === 'recommended'
  //           ? await SupabaseService.getRecommendedGames(userPreferredSports)
  //           : await SupabaseService.getGames();
  //         setGames(data);
  //       } catch (error) {
  //         console.error('[Realtime] Failed to refresh games:', error);
  //       }
  //     }, 1000);
  //   });
  //   
  //   return () => {
  //     clearTimeout(timeoutId);
  //     try { sub.unsubscribe(); } catch {}
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [feedMode, userPreferredSports.join?.('|') ?? '']);

  // Safety: clear global loading if this screen unmounts mid-request
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, [setLoading]);

  const loadGames = async () => {
    if (isLoading) {
      console.log('Already loading games, skipping duplicate call');
      return;
    }
    
    setTimedOut(false);
    setLoading(true);
    
    try {
      const gamesData = await SupabaseService.getGames();
      setGames(gamesData);
    } catch (error) {
      console.error('Error loading games:', error);
      setTimedOut(true);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple concurrent refreshes
    
    setTimedOut(false);
    setRefreshing(true);
    try {
      await loadGames();
    } finally {
      setRefreshing(false);
    }
  };

  const handleGameSelect = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  const handleCreateGame = () => {
    navigate('/create');
  };

  // Sort games chronologically with smart grouping
  const sortedGames = games
    .map(game => {
      const gameDate = new Date(game.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Determine game category for sorting and display
      let category = 'future';
      let sortOrder = gameDate.getTime();
      
      if (gameDate.toDateString() === today.toDateString()) {
        category = 'today';
        sortOrder = 0; // Today's games first
      } else if (gameDate.toDateString() === tomorrow.toDateString()) {
        category = 'tomorrow';
        sortOrder = 1; // Tomorrow's games second
      }
      
      return {
        ...game,
        category,
        sortOrder,
        gameDate
      };
    })
    .sort((a, b) => {
      // First sort by category (today, tomorrow, future)
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      // Then sort by time within each category
      return a.gameDate.getTime() - b.gameDate.getTime();
    });

  // Show loading state
  if (isLoading && games.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      </div>
    );
  }

  // Timed-out empty state with retry - only show if no games at all
  if (timedOut && games.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Connection issues detected. Showing sample games.</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="space-y-6">
          {/* Header */}
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">TribeUp</h1>
                <p className="text-muted-foreground">Find your next game</p>
              </div>
              <Button 
                onClick={handleCreateGame}
                size="icon"
                aria-label="Create new game"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalGames}</div>
                <div className="text-sm text-muted-foreground">Active Games</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {presenceLoading ? '...' : stats.onlinePlayers}
                </div>
                <div className="text-sm text-muted-foreground">Players Online</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.thisWeekGames}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </div>

          {/* Single Games List */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upcoming Games</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh games"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-4">
              {sortedGames.map((game) => (
                <div key={game.id}>
                  <SimpleGameCard
                    game={game}
                    onSelect={() => handleGameSelect(game.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold">TribeUp</h1>
                  <p className="text-muted-foreground">Find your next game</p>
                </div>
                <Button onClick={handleCreateGame}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Game
                </Button>
              </div>

              {/* Single Games List */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upcoming Games</h2>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedGames.map((game) => (
                  <div key={game.id}>
                    <SimpleGameCard
                      game={game}
                      onSelect={() => handleGameSelect(game.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-4">
              <div className="bg-card rounded-lg p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Games</span>
                    <span className="font-semibold">{stats.totalGames}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Players Online</span>
                    <span className="font-semibold">
                      {presenceLoading ? '...' : stats.onlinePlayers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-semibold">{stats.thisWeekGames}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
