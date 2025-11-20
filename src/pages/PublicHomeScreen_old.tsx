import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Calendar, Users, LogIn, UserPlus } from 'lucide-react';
import { useGamesWithCreators } from '@/domains/games/hooks/useGamesWithCreators';
import { useLocation } from '@/domains/locations/hooks/useLocation';
import { UnifiedGameCard } from '@/domains/games/components/UnifiedGameCard';
import { GameCardSkeleton } from '@/domains/games/components/GameCardSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useActivityFilters } from '@/domains/games/hooks/useActivityFilters';

export default function PublicHomeScreen() {
  const navigate = useNavigate();
  const { games, loading: isLoading, error } = useGamesWithCreators();
  const { currentLocation, permission, requestLocation, getDistanceTo } = useLocation();
  
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');

  // Filter games
  const { filteredGames } = useActivityFilters({
    games,
    showFollowingOnly: false, // Public view doesn't filter by friends
  });

  // Filter by sport if selected
  const sportFilteredGames = useMemo(() => {
    if (selectedSport === 'all') return filteredGames;
    return filteredGames.filter(game => game.sport?.toLowerCase() === selectedSport.toLowerCase());
  }, [filteredGames, selectedSport]);

  // Sort games
  const sortedGames = useMemo(() => {
    const sorted = [...sportFilteredGames];
    
    if (sortBy === 'distance' && currentLocation) {
      sorted.sort((a, b) => {
        const distA = a.latitude && a.longitude 
          ? getDistanceTo({ latitude: a.latitude, longitude: a.longitude }, 'km') || 999
          : 999;
        const distB = b.latitude && b.longitude
          ? getDistanceTo({ latitude: b.latitude, longitude: b.longitude }, 'km') || 999
          : 999;
        return distA - distB;
      });
    } else {
      // Sort by date
      sorted.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    return sorted;
  }, [sportFilteredGames, sortBy, currentLocation, getDistanceTo]);

  // Get unique sports
  const availableSports = useMemo(() => {
    const sportsSet = new Set(games.map(g => g.sport).filter(Boolean));
    return Array.from(sportsSet).sort();
  }, [games]);

  // Stats for hero section
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const gamesToday = games.filter(game => {
      const [year, month, day] = game.date.split('-').map(Number);
      const gameDate = new Date(year, month - 1, day);
      return gameDate.getTime() === today.getTime();
    }).length;
    
    const gamesNearby = currentLocation ? games.filter(game => {
      if (!game.latitude || !game.longitude) return false;
      const distanceKm = getDistanceTo({ latitude: game.latitude, longitude: game.longitude }, 'km');
      return distanceKm !== null && distanceKm <= 10;
    }).length : 0;
    
    return {
      total: games.length,
      today: gamesToday,
      nearby: gamesNearby,
    };
  }, [games, currentLocation, getDistanceTo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 mb-4">
                🏆 Join 1000+ Active Players
              </Badge>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                Find Your Next
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-300">
                  Sports Adventure
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light">
                Discover pickup games, connect with local players, and stay active in your community
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.total}</div>
                <div className="text-sm text-blue-100 font-medium">Active Games</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-green-300" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.today}</div>
                <div className="text-sm text-blue-100 font-medium">Games Today</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 text-pink-300" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.nearby}</div>
                <div className="text-sm text-blue-100 font-medium">Nearby You</div>
              </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-10 py-6 rounded-xl shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 font-semibold text-lg px-10 py-6 rounded-xl shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Sport Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
              <Badge
                variant={selectedSport === 'all' ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                onClick={() => setSelectedSport('all')}
              >
                All Sports
              </Badge>
              {availableSports.map(sport => (
                <Badge
                  key={sport}
                  variant={selectedSport === sport ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </Badge>
              ))}
            </div>
            
            {/* Sort Options */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('date')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Date
              </Button>
              <Button
                variant={sortBy === 'distance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('distance')}
                disabled={!currentLocation}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Distance
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Location Permission Prompt */}
        {permission === 'prompt' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Enable Location</h3>
                <p className="text-sm text-blue-700 mb-3">
                  See games near you and sort by distance
                </p>
                <Button size="sm" onClick={requestLocation}>
                  Enable Location
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <GameCardSkeleton key={i} />
            ))}
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
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-12 max-w-md mx-auto border border-gray-200">
              <Users className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No games found
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {selectedSport !== 'all' 
                  ? `No ${selectedSport} games available right now` 
                  : 'No games available right now'}
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Sign in to create a game
              </Button>
            </div>
          </div>
        )}

        {/* Games Grid */}
        {!isLoading && sortedGames.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedSport !== 'all' ? `${selectedSport} Games` : 'Discover Games'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {sortedGames.length} {sortedGames.length === 1 ? 'game' : 'games'} available
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedGames.map(game => {
                const distance = currentLocation && game.latitude && game.longitude
                  ? getDistanceTo({ latitude: game.latitude, longitude: game.longitude })
                  : null;
                
                return (
                  <div key={game.id} className="group relative">
                    <div className="transition-all duration-300 hover:scale-[1.02]">
                      <UnifiedGameCard
                        game={game}
                        variant="simple"
                        showJoinButton={false}
                        onSelect={() => navigate(`/public/game/${game.id}`)}
                        distance={distance ? `${distance.toFixed(1)} mi` : null}
                      />
                    </div>
                    {/* Login overlay for actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 via-blue-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-end justify-center p-6 pointer-events-none">
                      <Button 
                        size="lg"
                        className="pointer-events-auto bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/login');
                        }}
                      >
                        <LogIn className="mr-2 h-5 w-5" />
                        Login to Join
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to join the action?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Create an account to join games, meet players, and organize your own activities
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/login')}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <UserPlus className="mr-2 h-6 w-6" />
            Get Started Free
          </Button>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-white">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">Join Anytime</h3>
              <p className="text-blue-100 text-sm">Browse and join games that fit your schedule</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">Meet Players</h3>
              <p className="text-blue-100 text-sm">Connect with active people in your community</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">Find Nearby</h3>
              <p className="text-blue-100 text-sm">Discover games happening close to you</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
