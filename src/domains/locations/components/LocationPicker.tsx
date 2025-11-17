import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import GoogleMapView from './GoogleMapView';
import { MapPin, Search, Clock, Star, Navigation } from 'lucide-react';

export interface Location {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  isFavorite?: boolean;
  isRecent?: boolean;
}

export interface LocationPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedLocation?: Location;
  onLocationSelect: (location: Location) => void;
  showMap?: boolean;
  showSearch?: boolean;
  showRecent?: boolean;
  showFavorites?: boolean;
  recentLocations?: Location[];
  favoriteLocations?: Location[];
  onToggleFavorite?: (location: Location) => void;
  currentLocation?: { latitude: number; longitude: number };
  className?: string;
}

/**
 * Location Picker Component
 * 
 * Enhanced location picker with map, search, recent locations, and favorites.
 * Based on Strava's location picker patterns.
 * 
 * @example
 * ```tsx
 * <LocationPicker
 *   selectedLocation={location}
 *   onLocationSelect={(loc) => setLocation(loc)}
 *   showMap
 *   showSearch
 *   recentLocations={recent}
 *   onToggleFavorite={(loc) => toggleFavorite(loc)}
 * />
 * ```
 */
export function LocationPicker({
  selectedLocation,
  onLocationSelect,
  showMap = true,
  showSearch = true,
  showRecent = true,
  showFavorites = true,
  recentLocations = [],
  favoriteLocations = [],
  onToggleFavorite,
  currentLocation,
  className,
  ...props
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Location[]>([]);

  // Filter locations based on search
  const filteredRecent = React.useMemo(() => {
    if (!searchQuery.trim()) return recentLocations;
    const query = searchQuery.toLowerCase();
    return recentLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.address.toLowerCase().includes(query)
    );
  }, [recentLocations, searchQuery]);

  const filteredFavorites = React.useMemo(() => {
    if (!searchQuery.trim()) return favoriteLocations;
    const query = searchQuery.toLowerCase();
    return favoriteLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.address.toLowerCase().includes(query)
    );
  }, [favoriteLocations, searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    // TODO: Implement actual location search API call
    // For now, just filter existing locations
    setTimeout(() => {
      setSearchResults([]);
      setIsSearching(false);
    }, 500);
  };

  const handleLocationClick = (location: Location) => {
    onLocationSelect(location);
  };

  const handleToggleFavorite = (e: React.MouseEvent, location: Location) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(location);
    }
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const renderLocationItem = (location: Location, showDistance = true) => (
    <div
      key={location.id || location.name}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer',
        'hover:bg-muted/50 hover:border-primary/50 transition-all',
        selectedLocation?.id === location.id && 'border-primary bg-primary/5'
      )}
      onClick={() => handleLocationClick(location)}
    >
      <div className="flex-shrink-0">
        <MapPin className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{location.name}</span>
          {location.isFavorite && (
            <Star className="size-3 fill-warning text-warning" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {location.address}
        </p>
        {showDistance && location.distance && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistance(location.distance)} away
          </p>
        )}
      </div>
      {onToggleFavorite && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={(e) => handleToggleFavorite(e, location)}
        >
          <Star
            className={cn(
              'size-4',
              location.isFavorite && 'fill-warning text-warning'
            )}
          />
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Map */}
        {showMap && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Map</h3>
            <Card>
              <CardContent className="p-0">
                <div className="h-[400px] rounded-lg overflow-hidden">
                  <GoogleMapView
                    center={
                      selectedLocation
                        ? {
                            latitude: selectedLocation.latitude,
                            longitude: selectedLocation.longitude,
                          }
                        : currentLocation
                        ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
                        : undefined
                    }
                    allowLocationSelection
                    onLocationSelect={(location) => {
                      onLocationSelect({
                        name: 'Selected Location',
                        address: `${location.latitude}, ${location.longitude}`,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Location List */}
        <div className="space-y-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pr-4">
              {/* Search Results */}
              {isSearching && (
                <div className="text-center text-muted-foreground py-8">
                  Searching...
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center text-muted-foreground py-8">
                  No locations found
                </div>
              )}

              {searchQuery &&
                searchResults.length > 0 &&
                searchResults.map((location) => renderLocationItem(location))}

              {/* Favorites */}
              {!searchQuery && showFavorites && filteredFavorites.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="size-4 text-warning fill-current" />
                    <h3 className="text-sm font-semibold">Favorites</h3>
                  </div>
                  <div className="space-y-2">
                    {filteredFavorites.map((location) =>
                      renderLocationItem(location)
                    )}
                  </div>
                </div>
              )}

              {/* Recent */}
              {!searchQuery && showRecent && filteredRecent.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Recent</h3>
                  </div>
                  <div className="space-y-2">
                    {filteredRecent.map((location) =>
                      renderLocationItem(location)
                    )}
                  </div>
                </div>
              )}

              {/* Current Location */}
              {!searchQuery && currentLocation && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold">Current Location</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      if (currentLocation) {
                        onLocationSelect({
                          name: 'Current Location',
                          address: 'Using your current location',
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                        });
                      }
                    }}
                  >
                    <Navigation className="size-4 mr-2" />
                    Use Current Location
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

