import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Calendar, Users, LogIn, UserPlus, Shield } from 'lucide-react';
import { useGamesWithCreators } from '@/domains/games/hooks/useGamesWithCreators';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';
import { useLocationWithPermissionModal } from '@/domains/locations/hooks/useLocationWithPermissionModal';
import { LocationPermissionModal } from '@/domains/locations/components/LocationPermissionModal';
import { UnifiedGameCard } from '@/domains/games/components/UnifiedGameCard';
import { GameCardSkeleton } from '@/domains/games/components/GameCardSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { useActivityFilters } from '@/domains/games/hooks/useActivityFilters';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';

export default function PublicHomeScreen() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSimpleAuth();
  const { games, loading: isLoading, error } = useGamesWithCreators();
  const { 
    currentLocation, 
    permission, 
    getDistanceTo,
    showPermissionModal,
    setShowPermissionModal,
    requestLocationWithExplanation,
    handlePermissionAllow,
    handlePermissionDeny 
  } = useLocationWithPermissionModal();

  const [selectedSport, setSelectedSport] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect authenticated users to /app
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/app', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load persisted filters
  useEffect(() => {
    try {
      const raw = localStorage.getItem('publicFilters');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.selectedSport) setSelectedSport(parsed.selectedSport);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
      }
    } catch {}
  }, []);

  // Persist filters
  useEffect(() => {
    const payload = { selectedSport, sortBy, searchQuery };
    try { localStorage.setItem('publicFilters', JSON.stringify(payload)); } catch {}
  }, [selectedSport, sortBy, searchQuery]);

  // Filter games
  const { filteredGames } = useActivityFilters({
    games,
    showFollowingOnly: false,
  });

  // Filter by sport + search
  const sportFilteredGames = useMemo(() => {
    const list = selectedSport === 'all'
      ? filteredGames
      : filteredGames.filter(game => game.sport === selectedSport);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(game => (
      game.title?.toLowerCase().includes(q) ||
      game.location?.toLowerCase().includes(q) ||
      game.sport?.toLowerCase().includes(q)
    ));
  }, [filteredGames, selectedSport, searchQuery]);

  // Get available sports
  const availableSports = useMemo(() => {
    const sports = new Set(games.map(game => game.sport));
    return Array.from(sports).sort();
  }, [games]);

  // Sort games (simple)
  const sortedGames = useMemo(() => {
    const list = [...sportFilteredGames];
    if (sortBy === 'date') {
      list.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
    } else if (sortBy === 'distance' && currentLocation) {
      list.sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const da = getDistanceTo({ latitude: a.latitude, longitude: a.longitude }) ?? Infinity;
        const db = getDistanceTo({ latitude: b.latitude, longitude: b.longitude }) ?? Infinity;
        return da - db;
      });
    }
    return list;
  }, [sportFilteredGames, sortBy, currentLocation, getDistanceTo]);

  // Lightweight stats (only counts) for compact header
  const stats = useMemo(() => ({
    total: games.length,
    today: games.filter(g => g.date === new Date().toISOString().slice(0,10)).length,
  }), [games]);

  // (Second redirect effect removed - redundant)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Compact header */}
      <header className="border-b bg-background/90 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-lg">TribeUp</div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> <span>{stats.total} active</span>
              <Users className="h-3.5 w-3.5" /> <span>{stats.today} today</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            {!user && (
              <>
                <Button size="sm" variant="outline" onClick={() => navigate('/auth')} className="gap-1">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
                <Button size="sm" onClick={() => navigate('/auth')} className="gap-1">
                  <UserPlus className="h-4 w-4" /> Create Account
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Sport Filter */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
              <Badge
                variant={selectedSport === 'all' ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-medium"
                onClick={() => setSelectedSport('all')}
              >
                All Sports
              </Badge>
              {availableSports.map(sport => (
                <Badge
                  key={sport}
                  variant={selectedSport === sport ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-medium"
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <div className="flex-1 md:flex-initial min-w-[160px]">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search games..."
                  className="h-8 text-xs"
                />
              </div>
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('date')}
              >
                <Calendar className="mr-1 h-3.5 w-3.5" />
                Date
              </Button>
              <Button
                variant={sortBy === 'distance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('distance')}
                disabled={!currentLocation}
              >
                <MapPin className="mr-1 h-3.5 w-3.5" />
                Distance
              </Button>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs"
                >Clear</Button>
              )}
            </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Location Permission Prompt */}
        {permission === 'prompt' && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Find games near you</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Enable location to discover nearby activities and sort by distance.
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Your exact location is never shared with other users</span>
                </div>
                <Button size="sm" onClick={requestLocationWithExplanation} className="mt-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  Enable Location
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <GameCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load games. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedGames.length === 0 && (
          <div className="py-16 text-center">
            <Users className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No games found</h3>
            <p className="text-sm text-gray-600 mb-4">{selectedSport !== 'all' ? `No ${selectedSport} games right now` : 'No games available right now'}</p>
            {!user && (
              <Button size="sm" onClick={() => navigate('/auth')} className="gap-1">
                <UserPlus className="h-4 w-4" /> Sign in to create a game
              </Button>
            )}
          </div>
        )}

        {/* Games Grid */}
        {!isLoading && sortedGames.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">
                {selectedSport !== 'all' ? `${selectedSport} games` : 'All games'}
                {searchQuery && <span className="text-xs font-normal text-muted-foreground ml-2">filtered</span>}
              </h2>
              <span className="text-xs text-gray-600">{sortedGames.length} total</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedGames.map(game => {
                const distance = currentLocation && game.latitude && game.longitude
                  ? getDistanceTo({ latitude: game.latitude, longitude: game.longitude })
                  : null;
                return (
                  <UnifiedGameCard
                    key={game.id}
                    game={game}
                    variant="simple"
                    showJoinButton={false}
                    onSelect={() => navigate(`/public/game/${game.id}`)}
                    distance={distance ? `${distance.toFixed(1)} mi` : null}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>
      <footer className="px-4 py-8 text-center text-xs text-gray-500 border-t mt-8">
        <div className="max-w-7xl mx-auto">
          Browse games publicly. Sign in when you're ready to join or create.
        </div>
      </footer>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        open={showPermissionModal}
        onOpenChange={setShowPermissionModal}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />
    </div>
  );
}
