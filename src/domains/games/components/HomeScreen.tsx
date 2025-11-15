import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw, MapPin, Users as UsersIcon, Flame, Clock, Building2, UserPlus, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useGamesWithCreators } from '@/domains/games/hooks/useGamesWithCreators';
import { useLocation } from '@/domains/locations/hooks/useLocation';
import { useAllGamesRealtime } from '@/domains/games/hooks/useGameRealtime';
import { UnifiedGameCard } from './UnifiedGameCard';
import { GameCardSkeleton } from './GameCardSkeleton';
import { CacheClearButton } from '@/shared/components/common/CacheClearButton';
import { FeedbackButton } from '@/domains/users/components/FeedbackButton';
import { Badge } from '@/shared/components/ui/badge';
import { ufVenues } from '@/domains/locations/data/ufVenues';
import { CampusEmptyState } from './CampusEmptyState';
import { useUserFriends } from '@/domains/users/hooks/useFriends';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/database/supabase';




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
  
  // Fetch users you're following for filtering
  const { data: userFriends, isLoading: isLoadingFriends } = useUserFriends(user?.id);
  
  // Fetch follower counts for each game (social signals)
  const { data: gamesFriendCounts } = useQuery({
    queryKey: ['gamesFriendCounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      const { data, error } = await supabase
        .from('games_friend_counts')
        .select('game_id, friends_joined');
      
      if (error) {
        console.warn('Error fetching follower counts:', error);
        return {};
      }
      
      // Convert to map for O(1) lookup
      return (data || []).reduce((acc, row) => {
        acc[row.game_id] = row.friends_joined || 0;
        return acc;
      }, {} as Record<string, number>);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
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

  // Create a Set of following IDs for O(1) lookup
  const followingIds = useMemo(() => {
    if (!userFriends) return new Set<string>();
    return new Set(userFriends.map(f => f.id));
  }, [userFriends]);

  // Filter games by campus venues and following if enabled
  const filteredGames = (games || [])
    .filter(game => {
      // Campus venues filter
      if (showCampusVenuesOnly) {
        const isCampusVenue = ufVenues.some(venue =>
          game.location.toLowerCase().includes(venue.name.toLowerCase()) ||
          game.location.toLowerCase().includes(venue.shortName.toLowerCase())
        );
        if (!isCampusVenue) return false;
      }

      // Following filter - show games created by people you follow OR with following participants
      if (showFollowingOnly && user) {
        const createdByFollowing = followingIds.has(game.creatorId);
        const hasFollowingParticipants = (gamesFriendCounts?.[game.id] || 0) > 0;
        
        if (!createdByFollowing && !hasFollowingParticipants) {
          return false;
        }
      }

      return true;
    });

  // Sort games chronologically with smart grouping and add social signals
  const sortedGames = filteredGames
    .map(game => {
      // Parse game date properly - game.date is like "2025-10-15"
      const [year, month, day] = game.date.split('-').map(Number);
      const gameDate = new Date(year, month - 1, day); // month is 0-indexed
      
      // Get today's date in local timezone
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Determine game category for sorting and display
      let category = 'upcoming';
      let sortOrder = gameDate.getTime();
      
      if (gameDate.getTime() === today.getTime()) {
        category = 'today';
        sortOrder = 0;
      } else if (gameDate.getTime() === tomorrow.getTime()) {
        category = 'tomorrow';
        sortOrder = 1;
      } else if (gameDate.getTime() < nextWeek.getTime()) {
        category = 'thisWeek';
        sortOrder = 2;
      }
      
      // Calculate social signals
      const followerCount = gamesFriendCounts?.[game.id] || 0;
      const capacityRatio = game.totalPlayers / game.maxPlayers;
      const spotsLeft = game.availableSpots;
      
      // Determine badges
      const isHot = capacityRatio >= 0.7 && spotsLeft > 0;
      const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
      const isFull = spotsLeft === 0;
      
      // Check if game is happening soon (within 2 hours)
      const gameDateTime = new Date(`${game.date}T${game.time}`);
      const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isHappeningSoon = hoursUntilGame > 0 && hoursUntilGame <= 2;
      
      return {
        ...game,
        category,
        sortOrder,
        gameDate,
        // Social signals
        followerCount,
        isHot,
        isAlmostFull,
        isFull,
        isHappeningSoon
      };
    })
    .sort((a, b) => {
      // First sort by sortOrder (today = 0, tomorrow = 1, thisWeek = 2, upcoming = timestamp)
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      // Then sort by time chronologically
      return a.gameDate.getTime() - b.gameDate.getTime();
    });
  
  // Group games by section
  const gamesBySection = useMemo(() => {
    const sections = {
      today: [] as typeof sortedGames,
      tomorrow: [] as typeof sortedGames,
      thisWeek: [] as typeof sortedGames,
      upcoming: [] as typeof sortedGames
    };
    
    sortedGames.forEach(game => {
      sections[game.category as keyof typeof sections].push(game);
    });
    
    return sections;
  }, [sortedGames]);

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
              ? 'Activities are taking too long to load. This might be a network or server issue.'
              : error?.message || 'Unable to load activities. Please check your connection.'}
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
    gamesCount: games?.length || 0,
    gamesType: Array.isArray(games) ? 'array' : typeof games,
    errorMessage: error?.message,
    userId: user?.id || 'anonymous',
    gamesData: games?.slice(0, 2) // Log first 2 games for debugging
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

            {/* Activity Feed with Sections */}
            <div className="space-y-6">
              {isLoading ? (
                // Show skeleton loading
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <GameCardSkeleton key={index} />
                  ))}
                </div>
              ) : sortedGames.length > 0 ? (
                <>
                  {/* Today Section */}
                  {gamesBySection.today.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Flame className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="text-lg font-bold">Today</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                          {gamesBySection.today.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gamesBySection.today.map((game) => (
                          <div key={game.id} className="relative">
                            <UnifiedGameCard
                              game={game}
                              variant="simple"
                              onSelect={() => handleGameSelect(game.id)}
                              onJoinLeave={handleGameUpdate}
                            />
                            {/* Social Signal Badges */}
                            <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-10">
                              {game.isHappeningSoon && (
                                <Badge variant="destructive" className="text-xs flex items-center gap-1 shadow-md backdrop-blur-sm">
                                  <Clock className="w-3 h-3" />
                                  Starting Soon
                                </Badge>
                              )}
                              {game.isHot && !game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-orange-500 text-white border-none shadow-md backdrop-blur-sm">
                                  <Flame className="w-3 h-3" />
                                  Hot
                                </Badge>
                              )}
                              {game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-amber-500 text-white border-none shadow-md backdrop-blur-sm">
                                  Almost Full
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tomorrow Section */}
                  {gamesBySection.tomorrow.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                          </div>
                          <h3 className="text-lg font-bold">Tomorrow</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                          {gamesBySection.tomorrow.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gamesBySection.tomorrow.map((game) => (
                          <div key={game.id} className="relative">
                            <UnifiedGameCard
                              game={game}
                              variant="simple"
                              onSelect={() => handleGameSelect(game.id)}
                              onJoinLeave={handleGameUpdate}
                            />
                            {/* Social Signal Badges */}
                            <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-10">
                              {game.isHot && !game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-orange-500 text-white border-none shadow-md backdrop-blur-sm">
                                  <Flame className="w-3 h-3" />
                                  Hot
                                </Badge>
                              )}
                              {game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-amber-500 text-white border-none shadow-md backdrop-blur-sm">
                                  Almost Full
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* This Week Section */}
                  {gamesBySection.thisWeek.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-500/10 rounded-lg">
                            <CalendarIcon className="w-4 h-4 text-purple-500" />
                          </div>
                          <h3 className="text-lg font-bold">This Week</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                          {gamesBySection.thisWeek.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gamesBySection.thisWeek.map((game) => (
                          <div key={game.id} className="relative">
                            <UnifiedGameCard
                              game={game}
                              variant="simple"
                              onSelect={() => handleGameSelect(game.id)}
                              onJoinLeave={handleGameUpdate}
                            />
                            {/* Social Signal Badges */}
                            <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-10">
                              {game.isHot && !game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-orange-500 text-white border-none shadow-md backdrop-blur-sm">
                                  <Flame className="w-3 h-3" />
                                  Hot
                                </Badge>
                              )}
                              {game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-amber-500 text-white border-none shadow-md backdrop-blur-sm">
                                  Almost Full
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upcoming Section */}
                  {gamesBySection.upcoming.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-muted rounded-lg">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-bold">Upcoming</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                          {gamesBySection.upcoming.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gamesBySection.upcoming.map((game) => (
                          <div key={game.id} className="relative">
                            <UnifiedGameCard
                              game={game}
                              variant="simple"
                              onSelect={() => handleGameSelect(game.id)}
                              onJoinLeave={handleGameUpdate}
                            />
                            {/* Social Signal Badges */}
                            <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-10">
                              {game.isHot && !game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-orange-500 text-white border-none shadow-md backdrop-blur-sm">
                                  <Flame className="w-3 h-3" />
                                  Hot
                                </Badge>
                              )}
                              {game.isAlmostFull && (
                                <Badge className="text-xs flex items-center gap-1 bg-amber-500 text-white border-none shadow-md backdrop-blur-sm">
                                  Almost Full
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
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
                  onCreateGame={() => navigate('/create-game')}
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
                  <span className="text-muted-foreground">From Following</span>
                  <span className="font-semibold flex items-center gap-1">
                    <UsersIcon className="w-3 h-3 text-blue-600" />
                    {stats.gamesWithFriends}
                  </span>
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
                    onClick={() => navigate('/profile#following')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Following
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
