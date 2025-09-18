import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Plus, RefreshCw, MapPin, Clock, Users } from 'lucide-react';
import { formatEventHeader, formatCalendarInfo, formatTimeString } from '../lib/dateUtils';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { useGames } from '../hooks/useGames';
import { UnifiedGameCard } from './UnifiedGameCard';
import { GameCardSkeleton } from './GameCardSkeleton';
import { OnlinePlayersWidget } from './OnlinePlayersWidget';



// Using UnifiedGameCard component for consistency

function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { data: games = [], isLoading, error, refetch } = useGames();
  const [refreshing, setRefreshing] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const userPreferredSports = useMemo(() => user?.preferences?.sports ?? [], [user]);
  
  
  // Game selection handler
  const handleGameSelect = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };
  

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
      thisWeekGames
    };
  }, [games]);

  // No need for manual loading with React Query


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

  // No need for manual loading state cleanup with React Query


  // loadGames function removed - using React Query instead

  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple concurrent refreshes
    
    setTimedOut(false);
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
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
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">TribeUp</h1>
                <p className="text-muted-foreground">Find your next game</p>
              </div>
              {/* Create Game button only for mobile - desktop uses sidebar button */}
              <Button 
                onClick={handleCreateGame}
                size="icon"
                className="md:hidden"
                aria-label="Create new game"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick Stats - Mobile */}
            <div className="grid grid-cols-2 gap-4 mb-6 lg:hidden">
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalGames}</div>
                <div className="text-sm text-muted-foreground">Active Games</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.thisWeekGames}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>

            {/* Games List */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Upcoming Games</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="hidden md:flex"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="md:hidden"
                aria-label="Refresh games"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // Show skeleton loading
                Array.from({ length: 6 }).map((_, index) => (
                  <GameCardSkeleton key={index} />
                ))
              ) : (
                sortedGames.map((game) => (
                  <div key={game.id}>
                    <UnifiedGameCard
                      game={game}
                      variant="simple"
                      onSelect={() => handleGameSelect(game.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="space-y-4 sticky top-6">
              {/* Online Players Widget */}
              <OnlinePlayersWidget />
              
              {/* Quick Stats */}
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Games</span>
                    <span className="font-semibold">{stats.totalGames}</span>
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

export default HomeScreen;
