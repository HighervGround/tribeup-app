import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Search, X, Clock, Star } from 'lucide-react';
import { getSportColor } from '@/shared/config/designTokens';

export interface Sport {
  value: string;
  label: string;
  icon: string;
  color?: string;
}

export const DEFAULT_SPORTS: Sport[] = [
  { value: 'basketball', label: 'Basketball', icon: '🏀', color: '#FA4616' },
  { value: 'soccer', label: 'Soccer', icon: '⚽', color: '#22884C' },
  { value: 'tennis', label: 'Tennis', icon: '🎾', color: '#0021A5' },
  { value: 'pickleball', label: 'Pickleball', icon: '🥒', color: '#22884C' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐', color: '#F2A900' },
  { value: 'football', label: 'Football', icon: '🏈', color: '#6A2A60' },
  { value: 'baseball', label: 'Baseball', icon: '⚾', color: '#D32737' },
  { value: 'running', label: 'Running', icon: '🏃', color: '#FA4616' },
  { value: 'cycling', label: 'Cycling', icon: '🚴', color: '#22884C' },
  { value: 'swimming', label: 'Swimming', icon: '🏊', color: '#0021A5' },
  { value: 'hiking', label: 'Hiking', icon: '🥾', color: '#22884C' },
  { value: 'rock_climbing', label: 'Rock Climbing', icon: '🧗', color: '#FA4616' },
];

export interface SportPickerProps {
  sports?: Sport[];
  selectedSport?: string;
  onSportSelect: (sport: Sport) => void;
  showSearch?: boolean;
  showRecent?: boolean;
  showFavorites?: boolean;
  recentSports?: string[];
  favoriteSports?: string[];
  onToggleFavorite?: (sport: string) => void;
  className?: string;
  maxRecent?: number;
  gridCols?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Sport Picker Component - Strava-inspired sport selection
 * 
 * Displays sports in a grid layout with search, recent selections, and favorites support.
 * 
 * @example
 * ```tsx
 * <SportPicker
 *   selectedSport="basketball"
 *   onSportSelect={(sport) => setSelectedSport(sport.value)}
 *   showSearch
 *   showRecent
 *   recentSports={['basketball', 'soccer']}
 * />
 * ```
 */
export function SportPicker({
  sports = DEFAULT_SPORTS,
  selectedSport,
  onSportSelect,
  showSearch = true,
  showRecent = true,
  showFavorites = false,
  recentSports = [],
  favoriteSports = [],
  onToggleFavorite,
  className,
  maxRecent = 5,
  gridCols = 3,
  size = 'md',
}: SportPickerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);

  // Filter sports based on search query
  const filteredSports = React.useMemo(() => {
    if (!searchQuery.trim()) return sports;
    const query = searchQuery.toLowerCase();
    return sports.filter(
      (sport) =>
        sport.label.toLowerCase().includes(query) ||
        sport.value.toLowerCase().includes(query)
    );
  }, [sports, searchQuery]);

  // Get recent sports (limited to maxRecent)
  const recentSportsList = React.useMemo(() => {
    if (!showRecent || !recentSports.length) return [];
    return recentSports
      .slice(0, maxRecent)
      .map((value) => sports.find((s) => s.value === value))
      .filter((sport): sport is Sport => sport !== undefined);
  }, [recentSports, sports, maxRecent, showRecent]);

  // Get favorite sports
  const favoriteSportsList = React.useMemo(() => {
    if (!showFavorites || !favoriteSports.length) return [];
    return favoriteSports
      .map((value) => sports.find((s) => s.value === value))
      .filter((sport): sport is Sport => sport !== undefined);
  }, [favoriteSports, sports, showFavorites]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const allItems = [...(favoriteSportsList || []), ...(recentSportsList || []), ...filteredSports];
      if (allItems.length === 0) return;

      let newIndex = focusedIndex ?? -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        newIndex = newIndex < allItems.length - 1 ? newIndex + 1 : 0;
      } else {
        newIndex = newIndex > 0 ? newIndex - 1 : allItems.length - 1;
      }
      setFocusedIndex(newIndex);
    } else if (e.key === 'Enter' && focusedIndex !== null) {
      const allItems = [...(favoriteSportsList || []), ...(recentSportsList || []), ...filteredSports];
      if (allItems[focusedIndex]) {
        onSportSelect(allItems[focusedIndex]);
        setFocusedIndex(null);
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setFocusedIndex(null);
      searchInputRef.current?.blur();
    }
  };

  const handleSportClick = (sport: Sport) => {
    onSportSelect(sport);
    setFocusedIndex(null);
  };

  const handleToggleFavorite = (e: React.MouseEvent, sport: Sport) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(sport.value);
    }
  };

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[gridCols];

  const sizeClasses = {
    sm: {
      card: 'p-2',
      icon: 'text-xl',
      label: 'text-xs',
    },
    md: {
      card: 'p-3',
      icon: 'text-2xl',
      label: 'text-sm',
    },
    lg: {
      card: 'p-4',
      icon: 'text-3xl',
      label: 'text-base',
    },
  }[size];

  const renderSportCard = (sport: Sport, index: number, isFavorite = false) => {
    const isSelected = selectedSport === sport.value;
    const isFocused = focusedIndex === index;
    const isInFavorites = favoriteSports.includes(sport.value);

    return (
      <button
        key={sport.value}
        type="button"
        onClick={() => handleSportClick(sport)}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 transition-all duration-200',
          sizeClasses.card,
          isSelected
            ? 'border-primary bg-primary/10 shadow-medium'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50 hover:shadow-subtle',
          isFocused && 'ring-2 ring-primary ring-offset-2',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
        aria-label={`Select ${sport.label}`}
        aria-pressed={isSelected}
        tabIndex={0}
      >
        {/* Sport Icon */}
        <div className={cn(sizeClasses.icon)} role="img" aria-label={sport.label}>
          {sport.icon}
        </div>

        {/* Sport Label */}
        <span className={cn('font-medium', sizeClasses.label)}>{sport.label}</span>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
        )}

        {/* Favorite Toggle */}
        {showFavorites && onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => handleToggleFavorite(e, sport)}
            className={cn(
              'absolute top-1 left-1 p-1 rounded-full transition-colors',
              'hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary',
              isInFavorites ? 'text-warning' : 'text-muted-foreground'
            )}
            aria-label={isInFavorites ? `Remove ${sport.label} from favorites` : `Add ${sport.label} to favorites`}
            tabIndex={-1}
          >
            <Star className={cn('size-3', isInFavorites && 'fill-current')} />
          </button>
        )}
      </button>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search sports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFocusedIndex(null);
            }}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-9"
            aria-label="Search sports"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      )}

      <ScrollArea className="h-[400px]">
        <div className="space-y-6 pr-4">
          {/* Favorites Section */}
          {showFavorites && favoriteSportsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-warning fill-current" />
                <h3 className="text-sm font-semibold">Favorites</h3>
              </div>
              <div className={cn('grid gap-3', gridColsClass)}>
                {favoriteSportsList.map((sport, index) =>
                  renderSportCard(sport, index, true)
                )}
              </div>
            </div>
          )}

          {/* Recent Section */}
          {showRecent && recentSportsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent</h3>
              </div>
              <div className={cn('grid gap-3', gridColsClass)}>
                {recentSportsList.map((sport, index) =>
                  renderSportCard(
                    sport,
                    (favoriteSportsList?.length || 0) + index,
                    false
                  )
                )}
              </div>
            </div>
          )}

          {/* All Sports Section */}
          <div className="space-y-3">
            {(!showFavorites || favoriteSportsList.length === 0) &&
              (!showRecent || recentSportsList.length === 0) && (
                <h3 className="text-sm font-semibold">Select a Sport</h3>
              )}
            {filteredSports.length > 0 ? (
              <div className={cn('grid gap-3', gridColsClass)}>
                {filteredSports.map((sport, index) =>
                  renderSportCard(
                    sport,
                    (favoriteSportsList?.length || 0) +
                      (recentSportsList?.length || 0) +
                      index,
                    false
                  )
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No sports found matching "{searchQuery}"</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Simple Sport Picker - No search, recent, or favorites
 */
export function SimpleSportPicker({
  sports = DEFAULT_SPORTS,
  selectedSport,
  onSportSelect,
  className,
  gridCols = 3,
  size = 'md',
}: Omit<SportPickerProps, 'showSearch' | 'showRecent' | 'showFavorites'>) {
  return (
    <SportPicker
      sports={sports}
      selectedSport={selectedSport}
      onSportSelect={onSportSelect}
      showSearch={false}
      showRecent={false}
      showFavorites={false}
      className={className}
      gridCols={gridCols}
      size={size}
    />
  );
}

