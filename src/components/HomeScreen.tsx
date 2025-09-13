import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Plus, RefreshCw, MapPin, Clock, Users } from 'lucide-react';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';



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

  return (
    <div 
      className="bg-card rounded-lg p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-4">
          <h3 className="font-semibold text-lg">{game.title}</h3>
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
          <span>{game.date} at {game.time}</span>
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
  const [feedMode, setFeedMode] = useState<'all' | 'recommended'>('all');

  // Load games only once on mount, prevent multiple calls
  useEffect(() => {
    if (games.length === 0 && !isLoading) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle feed mode changes separately
  useEffect(() => {
    if (games.length > 0) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedMode]);

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
      const gamesData = feedMode === 'recommended'
        ? await SupabaseService.getRecommendedGames(userPreferredSports)
        : await SupabaseService.getGames();
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
    navigate('/create-game');
  };

  // Filter today's games
  const todaysGames = games.filter(game => {
    const gameDate = new Date(game.date);
    const today = new Date();
    return gameDate.toDateString() === today.toDateString();
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
                <div className="text-2xl font-bold text-primary">{games.length}</div>
                <div className="text-sm text-muted-foreground">Active Games</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Players Online</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </div>

          {/* Today's Games */}
          {todaysGames.length > 0 && (
            <div className="px-4">
              <h2 className="text-lg mb-4">Happening Soon</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {todaysGames.map((game) => (
                  <div key={game.id} className="flex-shrink-0 w-72">
                    <SimpleGameCard 
                      game={game} 
                      onSelect={() => handleGameSelect(game.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Games */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Games</h2>
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
              {games.map((game) => (
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
                <div className="flex items-center gap-2">
                  <div className="bg-muted rounded-md p-1 flex">
                    <button
                      className={`px-3 py-1 text-sm rounded ${feedMode === 'recommended' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
                      onClick={() => setFeedMode('recommended')}
                    >
                      Recommended
                    </button>
                    <button
                      className={`px-3 py-1 text-sm rounded ${feedMode === 'all' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
                      onClick={() => setFeedMode('all')}
                    >
                      All
                    </button>
                  </div>
                  <Button onClick={handleCreateGame}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Game
                  </Button>
                </div>
              </div>

              {/* Today's Games */}
              {todaysGames.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Happening Today</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todaysGames.map((game) => (
                      <SimpleGameCard
                        key={game.id}
                        game={game}
                        onSelect={() => handleGameSelect(game.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Feed Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{feedMode === 'recommended' ? 'Recommended For You' : 'All Games'}</h2>
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
                {games.map((game) => (
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
                    <span className="font-semibold">{games.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Players Online</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-semibold">0</span>
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
