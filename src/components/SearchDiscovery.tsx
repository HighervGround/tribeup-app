import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService } from '../lib/supabaseService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, Search, SlidersHorizontal, Clock, Users } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useGames } from '../hooks/useGames';
import { UnifiedGameCard } from './UnifiedGameCard';
import { formatTimeString } from '../lib/dateUtils';



const sportFilters = [
  { name: 'All Sports', value: 'all' },
  { name: 'Basketball', value: 'basketball' },
  { name: 'Soccer', value: 'soccer' },
  { name: 'Tennis', value: 'tennis' },
  { name: 'Pickleball', value: 'pickleball' },
  { name: 'Volleyball', value: 'volleyball' },
  { name: 'Flag Football', value: 'flag football' },
  { name: 'Baseball', value: 'baseball' },
  { name: 'Golf', value: 'golf' },
  { name: 'Hockey', value: 'hockey' },
  { name: 'Rugby', value: 'rugby' },
];

// Using UnifiedGameCard component for consistency

function SearchDiscovery() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  // Use React Query for consistent data loading
  const { data: games = [], isLoading: loading, error } = useGames();

  const handleGameSelect = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Get sport color helper
  const getSportColor = (sport: string) => {
    const colors = {
      'Basketball': 'bg-orange-500',
      'Soccer': 'bg-green-500',
      'Tennis': 'bg-yellow-500',
      'Pickleball': 'bg-purple-500',
      'Volleyball': 'bg-blue-500',
      'Flag Football': 'bg-red-500',
      'Baseball': 'bg-amber-600',
      'Golf': 'bg-emerald-600',
      'Hockey': 'bg-slate-600',
      'Rugby': 'bg-indigo-600'
    };
    return colors[sport as keyof typeof colors] || 'bg-gray-500';
  };

  // Filter games
  const filteredResults = games
    .map(game => ({
      ...game,
      sportColor: getSportColor(game.sport),
      imageUrl: game.imageUrl || '',
      currentPlayers: game.currentPlayers || game.participants || 0,
      maxPlayers: game.maxPlayers || game.maxParticipants || 0
    }))
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
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
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
            <UnifiedGameCard
              key={game.id}
              game={game}
              variant="simple"
              onSelect={() => handleGameSelect(game.id)}
            />
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
    </div>
  );
}

export default SearchDiscovery;