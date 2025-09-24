import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Plus, RefreshCw, MapPin, Clock, Users } from 'lucide-react';
import { formatEventHeader, formatCalendarInfo, formatTimeString } from '../lib/dateUtils';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { useUserPresence } from '../hooks/useUserPresence';
import { useGames } from '../hooks/useGames';
import { useLocation } from '../hooks/useLocation';
import { useAllGamesRealtime } from '../hooks/useGameRealtime';
import { UnifiedGameCard } from './UnifiedGameCard';
import { GameCardSkeleton } from './GameCardSkeleton';



// Using UnifiedGameCard component for consistency

function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { data: games = [], isLoading, error, refetch } = useGames();
  const [refreshing, setRefreshing] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const userPreferredSports = useMemo(() => user?.preferences?.sports ?? [], [user]);
  // Real-time presence tracking (no polling)
  const { onlineCount, isLoading: presenceLoading } = useUserPresence();
  // Location services for distance calculations
  const { currentLocation, isLoading: locationLoading, permission, requestLocation, getFormattedDistanceTo } = useLocation();
  // Real-time updates for all games
  const { isConnected: realtimeConnected } = useAllGamesRealtime();
  
  // Game selection handler
  const handleGameSelect = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };
  

  // Calculate test-focused stats with feature tracking
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Games available today
    const gamesToday = games.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate.toDateString() === today.toDateString();
    }).length;
    
    // Games nearby (within 5 miles)
    const gamesNearby = currentLocation ? games.filter(game => {
      if (!game.latitude || !game.longitude) return false;
      const distance = getFormattedDistanceTo({ latitude: game.latitude, longitude: game.longitude }, 'mi');
      return distance && parseFloat(distance) <= 5; // Within 5 miles
    }).length : 0;
    
    // Games user has joined
    const gamesJoined = games.filter(game => game.isJoined).length;
    
    // Games user has created (assuming creatorId matches user id)
    const gamesCreated = games.filter(game => game.creatorId === user?.id).length;
    
    // Feature testing progress - ONLY trackable features
    const featuresTestable = [
      { name: 'Profile Setup', tested: !!(user?.name && user?.email) },
      { name: 'Avatar Upload', tested: !!user?.avatar },
      { name: 'Sport Preferences', tested: !!(user?.preferences?.sports && user.preferences.sports.length > 0) },
      { name: 'Location Access', tested: permission === 'granted' },
      { name: 'Join Game', tested: gamesJoined > 0 },
      { name: 'Create Game', tested: gamesCreated > 0 },
      { name: 'Game Discovery', tested: true } // Always true if they're on home screen
    ];
    
    const featuresTested = featuresTestable.filter(f => f.tested).length;
    const totalFeatures = featuresTestable.length;
    
    // Calculate test streak (simplified - could be enhanced with actual dates)
    const testStreak = gamesJoined > 0 ? Math.min(gamesJoined + gamesCreated, 7) : 0;
    
    // Next specific actions based on what they haven't done
    const nextActions: string[] = [];
    if (permission !== 'granted') nextActions.push('Enable Location Access');
    if (!user?.avatar) nextActions.push('Upload Profile Photo');
    if (gamesCreated === 0) nextActions.push('Create Your First Game');
    if (gamesJoined === 0 && gamesToday > 0) nextActions.push(`Join a Game (${gamesToday} today)`);
    if (!user?.preferences?.sports || user.preferences.sports.length === 0) {
      nextActions.push('Set Sport Preferences');
    }
    if (nextActions.length === 0) {
      nextActions.push('Explore Game Details', 'Try Search/Filter', 'Check Settings');
    }

    return {
      totalGames: games.length,
      gamesToday,
      gamesNearby,
      gamesJoined,
      gamesCreated,
      featuresTested,
      totalFeatures,
      testStreak,
      completionRate: Math.round((featuresTested / totalFeatures) * 100),
      nextActions: nextActions.slice(0, 4) // Limit to 4 actions
    };
  }, [games, user, currentLocation, permission, getFormattedDistanceTo]);

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
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate('/create-game')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Game
                </Button>
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
            <div className="bg-card rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Test Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Features Tested</span>
                  <span className="font-semibold">{stats.featuresTested}/{stats.totalFeatures}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">{stats.completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Games Today</span>
                  <span className="font-semibold">{stats.gamesToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Games Nearby</span>
                  <span className="font-semibold">
                    {currentLocation ? stats.gamesNearby : '?'}
                    {!currentLocation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={requestLocation}
                        className="ml-2 h-6 px-2 text-xs"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Enable
                      </Button>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Games Created</span>
                  <span className="font-semibold">{stats.gamesCreated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Test Streak</span>
                  <span className="font-semibold">{stats.testStreak} days</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Next Actions</h4>
                <div className="space-y-2">
                  {stats.nextActions.map((action, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-center">
                      <span className="mr-2">→</span>
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Features Tested</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.testStreak}</div>
                <div className="text-sm text-muted-foreground">Test Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
