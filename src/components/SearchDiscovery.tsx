import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService } from '../lib/supabaseService';
import { useLocation } from '../hooks/useLocation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { MapView } from './MapView';
import { calculateDistance, formatDistance } from '../hooks/useLocation';



const sportFilters = [
  { name: 'All Sports', value: 'all' },
  { name: 'Basketball', value: 'basketball' },
  { name: 'Soccer', value: 'soccer' },
  { name: 'Tennis', value: 'tennis' },
  { name: 'Pickleball', value: 'pickleball' },
  { name: 'Volleyball', value: 'volleyball' },
  { name: 'Football', value: 'football' },
  { name: 'Baseball', value: 'baseball' },
];

// Simple GameCard component
function SimpleGameCard({ game, onSelect }: { game: any; onSelect: () => void }) {
  return (
    <div 
      className="bg-card rounded-lg p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{game.title}</h3>
          <p className="text-sm text-muted-foreground">{game.sport}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">{game.cost}</div>
          <div className="text-xs text-muted-foreground">
            {game.currentPlayers}/{game.maxPlayers} players
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">📍</span>
          <span>{game.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">🕒</span>
          <span>{game.date} at {game.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">📏</span>
          <span>{game.distance}</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-3">{game.description}</p>
      
      {game.isJoined && (
        <div className="mt-3">
          <span className="inline-block bg-success/20 text-success dark:bg-success/30 dark:text-success text-xs px-2 py-1 rounded">
            Joined ✓
          </span>
        </div>
      )}
    </div>
  );
}

export function SearchDiscovery() {
  const navigate = useNavigate();
  const { currentLocation, isLoading: locationLoading, requestLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedView, setSelectedView] = useState<'list' | 'map'>('list');
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load games from Supabase
  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      try {
        const gamesData = await SupabaseService.getGames();
        setGames(gamesData);
      } catch (error) {
        console.error('Error loading games:', error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  const handleGameSelect = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Calculate distances and filter games
  const filteredResults = games
    .map(game => {
      // Calculate distance if we have location data
      let distance = 'Unknown distance';
      if (currentLocation && game.latitude && game.longitude) {
        const distanceKm = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          game.latitude,
          game.longitude
        );
        distance = formatDistance(distanceKm);
      }
      
      return {
        ...game,
        distance
      };
    })
    .filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           game.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           game.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSport = selectedSport === 'all' || game.sport.toLowerCase() === selectedSport.toLowerCase();
      return matchesSearch && matchesSport;
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search-games"
              name="search-games"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games, sports, locations..."
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <select className="w-full p-2 border rounded-md">
                  <option value="distance">Distance</option>
                  <option value="time">Time</option>
                  <option value="players">Players Needed</option>
                  <option value="cost">Cost</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <select className="w-full p-2 border rounded-md">
                  <option value="">Any time</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Sport Filter Chips */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sportFilters.map((sport) => (
              <Badge
                key={sport.value}
                variant={selectedSport === sport.value ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedSport(sport.value)}
              >
                {sport.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('list')}
          >
            List View
          </Button>
          <Button
            variant={selectedView === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('map')}
          >
            Map View
          </Button>
        </div>

        {selectedView === 'list' ? (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {filteredResults.length} games found
                </h2>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground">
                    Results for "{searchQuery}"
                  </p>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-4">
              {filteredResults.map((game) => (
                <div key={game.id} className="relative">
                  <SimpleGameCard 
                    game={game} 
                    onSelect={() => handleGameSelect(game.id)}
                  />
                  <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded px-2 py-1">
                    <span className="text-xs text-muted-foreground">{game.distance}</span>
                  </div>
                </div>
              ))}
            </div>

            {filteredResults.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No games found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedSport('all');
                }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map View Content */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Games Near You</h3>
              {currentLocation ? (
                <div className="relative">
                  <MapView
                    games={filteredResults.map(game => ({
                      id: game.id,
                      title: game.title,
                      sport: game.sport,
                      location: {
                        latitude: game.latitude || currentLocation.latitude + (Math.random() - 0.5) * 0.01,
                        longitude: game.longitude || currentLocation.longitude + (Math.random() - 0.5) * 0.01
                      },
                      locationName: game.location,
                      date: game.date,
                      time: game.time,
                      players: game.currentPlayers || game.players,
                      maxPlayers: game.maxPlayers,
                      cost: game.cost,
                      difficulty: game.difficulty
                    }))}
                    center={currentLocation}
                    zoom={13}
                    className="h-64 md:h-80"
                    showCurrentLocation={true}
                    showGameMarkers={true}
                    onGameSelect={handleGameSelect}
                  />
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs">
                    📍 You • 🎮 {filteredResults.length} Games
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 md:h-80 bg-muted rounded-lg flex flex-col items-center justify-center border">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-muted-foreground text-center">
                    Allow location access to see games on map
                  </p>
                  <Button 
                    onClick={requestLocation}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={locationLoading}
                  >
                    {locationLoading ? 'Requesting...' : 'Enable Location'}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Game List Below Map */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {filteredResults.length} games in map area
                </h3>
              </div>
              {filteredResults.map((game) => (
                <SimpleGameCard
                  key={game.id}
                  game={game}
                  onSelect={() => handleGameSelect(game.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}