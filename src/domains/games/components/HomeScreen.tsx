import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useGamesWithCreators } from '@/domains/games/hooks/useGamesWithCreators';
import { useLocation } from '@/domains/locations/hooks/useLocation';
import { useAllGamesRealtime } from '@/domains/games/hooks/useGameRealtime';
import { UnifiedGameCard } from '@/domains/games/components/UnifiedGameCard';
import { GameCardSkeleton } from '@/domains/games/components/GameCardSkeleton';
import { CacheClearButton } from '@/shared/components/common/CacheClearButton';
import { FeedbackButton } from '@/domains/users/components/FeedbackButton';




function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { games, userById, usersLoaded, loading: isLoading, error, refetch } = useGamesWithCreators();
  const [refreshing, setRefreshing] = useState(false);
  const [forceTimeout, setForceTimeout] = useState(false);
  
  // Location services for distance calculations
  const { currentLocation, permission, requestLocation, getFormattedDistanceTo, getDistanceTo } = useLocation();
  // Real-time updates for all games
  useAllGamesRealtime();
  
  // Force timeout if loading takes too long
  useEffect(() => {
    if (isLoading) {
      console.log('🕰️ [HomeScreen] Starting loading timeout timer');
      const timeout = setTimeout(() => {
        console.warn('⚠️ [HomeScreen] Force timeout after 20 seconds');
        setForceTimeout(true);
      }, 20000);
      
      return () => {
        clearTimeout(timeout);
        setForceTimeout(false);
      };
    }
  }, [isLoading]);
  
  // Game selection handler
  const handleGameSelect = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };
  

  // Calculate basic stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Games available today
    const gamesToday = games.filter(game => {
      // Parse YYYY-MM-DD in local timezone consistently
      const [year, month, day] = game.date.split('-').map(Number);
      const gameDate = new Date(year, month - 1, day);
      return gameDate.getTime() === today.getTime();
    }).length;
    
    // Games nearby (within 10km)
    const gamesNearby = currentLocation ? games.filter(game => {
      if (!game.latitude || !game.longitude) return false;
      const distanceKm = getDistanceTo({ latitude: game.latitude, longitude: game.longitude }, 'km');
      return distanceKm !== null && distanceKm <= 10; // Within 10km
    }).length : 0;
    
    // Games user has created
    const gamesCreated = games.filter(game => game.creatorId === user?.id).length;

    return {
      totalGames: games.length,
      gamesToday,
      gamesNearby,
      gamesCreated
    };
  }, [games, user, currentLocation, getFormattedDistanceTo]);

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
    
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Sort games chronologically with smart grouping
  const sortedGames = games
    .map(game => {
      // Parse game date properly - game.date is like "2025-10-15"
      const [year, month, day] = game.date.split('-').map(Number);
      const gameDate = new Date(year, month - 1, day); // month is 0-indexed
      
      // Get today's date in local timezone
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log(`🎯 Game "${game.title}": game.date="${game.date}", gameDate="${gameDate.toDateString()}", today="${today.toDateString()}", tomorrow="${tomorrow.toDateString()}"`);
      
      // Determine game category for sorting and display
      let category = 'future';
      let sortOrder = gameDate.getTime();
      
      if (gameDate.getTime() === today.getTime()) {
        category = 'today';
        sortOrder = 0; // Today's games first
        console.log(`✅ "${game.title}" is TODAY`);
      } else if (gameDate.getTime() === tomorrow.getTime()) {
        category = 'tomorrow';
        sortOrder = 1; // Tomorrow's games second
        console.log(`✅ "${game.title}" is TOMORROW`);
      } else {
        console.log(`📅 "${game.title}" is FUTURE (${gameDate.toDateString()})`);
      }
      
      return {
        ...game,
        category,
        sortOrder,
        gameDate
      };
    })
    .sort((a, b) => {
      // First sort by category (today first, then chronological)
      if (a.sortOrder !== b.sortOrder && (a.category === 'today' || b.category === 'today')) {
        return a.sortOrder - b.sortOrder;
      }
      // Then sort by time chronologically
      return a.gameDate.getTime() - b.gameDate.getTime();
    });

  // Show loading state with timeout handling
  if ((isLoading || isLoading) && games.length === 0 && !forceTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading games...</p>
          <p className="text-xs text-muted-foreground/70">
            {refreshing ? 'Refreshing...' : 'This should only take a moment'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('🔄 [HomeScreen] Manual refresh triggered');
              setForceTimeout(false);
              refetch();
            }}
          >
            Refresh Now
          </Button>
        </div>
      </div>
    );
  }
  
  // Show error state
  if ((!!error || error || forceTimeout) && games.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">
            {forceTimeout ? 'Loading Timeout' : 'Connection Error'}
          </div>
          <p className="text-muted-foreground max-w-md">
            {forceTimeout 
              ? 'Games are taking too long to load. This might be a network or server issue.'
              : error?.message || 'Unable to load games. Please check your connection.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => {
                console.log('🔄 [HomeScreen] Error state refresh');
                setForceTimeout(false);
                refetch();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                console.log('🧹 [HomeScreen] Clearing cache and refreshing');
                localStorage.removeItem('supabase.auth.token');
                window.location.reload();
              }}
            >
              Clear Cache & Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Log current state for debugging
  console.log('📊 [HomeScreen] Current state:', {
    isLoading,
    hasError: !!error,
    refreshing,
    forceTimeout,
    gamesCount: games.length,
    errorMessage: error?.message,
    userId: user?.id || 'anonymous'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Cache Clear Button - only show in development (never in production) */}
      {typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost')) && (
        <CacheClearButton />
      )}
      
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">TribeUp</h1>
                <p className="text-muted-foreground">Find your next activity</p>
              </div>
              <div className="flex gap-2">
                <FeedbackButton variant="outline" size="default" />
              </div>
            </div>

            {/* Activities List */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Upcoming Activities</h2>
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
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Activities Today</span>
                  <span className="font-semibold">{stats.gamesToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Activities Nearby</span>
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
                  <span className="text-muted-foreground">Activities Created</span>
                  <span className="font-semibold">{stats.gamesCreated}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    onClick={() => navigate('/create')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Create New Activity
                  </Button>
                  <Button 
                    onClick={() => navigate('/search')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Search Activities
                  </Button>
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
