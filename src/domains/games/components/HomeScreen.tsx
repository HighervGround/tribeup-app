import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw, MapPin, Users as UsersIcon, Flame, Clock, Building2, UserPlus, Calendar as CalendarIcon, Plus, Bell } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useGamesWithCreators } from '@/domains/games/hooks/useGamesWithCreators';
import { useLocation } from '@/domains/locations/hooks/useLocation';
import { useAllGamesRealtime } from '@/domains/games/hooks/useGameRealtime';
import { UnifiedGameCard } from './UnifiedGameCard';
import { GameCardSkeleton } from './GameCardSkeleton';
import { FeedbackButton } from '@/domains/users/components/FeedbackButton';
import { Badge } from '@/shared/components/ui/badge';
import { CampusEmptyState } from './CampusEmptyState';
import { useActivityFilters } from '@/domains/games/hooks/useActivityFilters';
import { useNotifications } from '@/domains/users/hooks/useNotifications';
import { brandColors } from '@/shared/config/theme';
import { useActivityGrouping } from '@/domains/games/hooks/useActivityGrouping';




function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { games, userById, usersLoaded, loading: isLoading, error, refetch } = useGamesWithCreators();
  const [refreshing, setRefreshing] = useState(false);
  const [forceTimeout, setForceTimeout] = useState(false);
  const [showCampusVenuesOnly, setShowCampusVenuesOnly] = useState(false);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  
  // Location services for distance calculations
  const { currentLocation, permission, requestLocation, getFormattedDistanceTo, getDistanceTo } = useLocation();
  // Real-time updates for all games
  useAllGamesRealtime();
  
  // Notifications for badge
  const notifications = useNotifications();
  const unreadCount = notifications?.unreadCount || 0;
  
  // Filter activities
  const { filteredGames, gamesFriendCounts } = useActivityFilters({
    games,
    showCampusVenuesOnly,
    showFollowingOnly,
  });
  
  // Group and sort activities
  const { sortedGames, gamesBySection } = useActivityGrouping({
    games: filteredGames,
    gamesFriendCounts,
  });
  
  // Force timeout if loading takes too long
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
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
  
  // Refetch handler to pass to game cards
  const handleGameUpdate = async () => {
    // Refetch games after join/leave mutation completes
    await refetch();
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
    
    // Games with people you follow
    const gamesWithFollowing = games.filter(game => {
      const followerCount = gamesFriendCounts?.[game.id] || 0;
      return followerCount > 0;
    }).length;

    return {
      totalGames: games.length,
      gamesToday,
      gamesNearby,
      gamesCreated,
      gamesWithFriends: gamesWithFollowing // Keep key name for backward compatibility
    };
  }, [games, user, currentLocation, getDistanceTo, gamesFriendCounts]);

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
      await refetch(); // React Query's refetch
    } finally {
      setRefreshing(false);
    }
  };


  // Show loading state with timeout handling
  if (isLoading && games.length === 0 && !forceTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading activities...</p>
          <p className="text-xs text-muted-foreground/70">
            {refreshing ? 'Refreshing...' : 'This should only take a moment'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
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
              ? 'Activities are taking too long to load. This might be a network or server issue.'
              : error?.message || 'Unable to load activities. Please check your connection.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => {
                setForceTimeout(false);
                refetch();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="w-full">
          {/* Main Content - Single Column Feed */}
          <div className="w-full">
            {/* Header */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl -z-10" />
              <div className="flex items-center justify-between p-4 md:p-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    TribeUp
                  </h1>
                  <p className="text-muted-foreground text-sm">Find your next activity</p>
                </div>
                <div className="flex gap-2">
                  {/* Quick Create Button */}
                  <Button
                    onClick={() => navigate('/create')}
                    size="sm"
                    className="gap-2"
                    style={{
                      backgroundColor: brandColors.primary,
                      borderColor: brandColors.primary,
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                  
                  {/* Notifications Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/notifications')}
                    className="relative"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center min-w-[16px] rounded-full"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                    <span className="hidden sm:inline ml-2">Notifications</span>
                  </Button>
                  
                  <FeedbackButton variant="outline" size="default" />
                </div>
              </div>
            </div>

            {/* Activities List Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold">Upcoming Activities</h2>
                <p className="text-xs text-muted-foreground">
                  {sortedGames.length} {sortedGames.length === 1 ? 'activity' : 'activities'} available
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="hidden md:flex shadow-sm hover:shadow-md transition-shadow"
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

            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={showCampusVenuesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCampusVenuesOnly(!showCampusVenuesOnly)}
                className="gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <Building2 className="w-4 h-4" />
                UF Campus Venues
              </Button>
              <Button
                variant={showFollowingOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFollowingOnly(!showFollowingOnly)}
                className="gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Following
              </Button>
              {(showCampusVenuesOnly || showFollowingOnly) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowCampusVenuesOnly(false);
                    setShowFollowingOnly(false);
                  }}
                  className="gap-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Activity Feed - Single Column Strava-Style */}
            <div className="space-y-6">
              {isLoading ? (
                // Show skeleton loading
                <div className="space-y-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <GameCardSkeleton key={index} />
                  ))}
                </div>
              ) : sortedGames.length > 0 ? (
                <div className="space-y-6">
                  {sortedGames.map((game, index) => {
                    // Add subtle date divider for first game in each time period
                    const prevGame = index > 0 ? sortedGames[index - 1] : null;
                    const showDateDivider = !prevGame || prevGame.category !== game.category;
                    
                    return (
                      <div key={game.id}>
                        {/* Subtle Date Divider */}
                        {showDateDivider && (
                          <div className="flex items-center gap-3 mb-4 mt-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {game.category === 'today' ? 'Today' : 
                               game.category === 'tomorrow' ? 'Tomorrow' : 
                               game.category === 'thisWeek' ? 'This Week' : 
                               'Upcoming'}
                            </span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        )}
                        
                        <UnifiedGameCard
                          game={game}
                          variant="strava"
                          onSelect={() => handleGameSelect(game.id)}
                          onJoinLeave={handleGameUpdate}
                          distance={
                            currentLocation && game.latitude && game.longitude
                              ? getFormattedDistanceTo(
                                  { latitude: game.latitude, longitude: game.longitude },
                                  'mi'
                                )
                              : null
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : showFollowingOnly ? (
                // Special empty state for following filter
                <div className="col-span-full">
                  <div className="text-center py-12 px-4 space-y-6 bg-card rounded-lg shadow-sm border border-border">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                      <UsersIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Not Following Anyone Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Follow other players to see their activities here.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <Button onClick={() => navigate('/profile#following')} className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" /> Find People to Follow
                      </Button>
                      <Button variant="outline" onClick={() => setShowFollowingOnly(false)} className="flex items-center gap-2">
                        View All Activities
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-6">
                      💡 Tip: Join activities to meet people, then follow them to see their future activities!
                    </p>
                  </div>
                </div>
              ) : (
                <CampusEmptyState
                  onCreateGame={() => navigate('/create')}
                  onExploreVenues={() => {
                    // Toggle campus venues filter and scroll to top
                    setShowCampusVenuesOnly(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title={showCampusVenuesOnly ? "No campus activities found" : "No activities yet"}
                  description={
                    showCampusVenuesOnly
                      ? "No activities at UF venues right now. Be the first to create one!"
                      : "Be the first to create an activity at your favorite UF spot!"
                  }
                />
              )}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}

export default HomeScreen;
