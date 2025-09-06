import React, { useState, useEffect, useRef, useCallback } from 'react';

import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './ui/loading-spinner';
import { EmptyState } from './ui/empty-state';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Layers, 
  Plus, 
  Minus,
  RotateCcw,
  Filter,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import { useLocation, LocationCoordinates, calculateDistance, formatDistance } from '../hooks/useLocation';
import { useGames } from '../store/appStore';
import { toast } from 'sonner';

export interface MapGame {
  id: string;
  title: string;
  sport: string;
  location: LocationCoordinates;
  locationName: string;
  date: string;
  time: string;
  players: number;
  maxPlayers: number;
  cost: string;
  difficulty: string;
}

interface MapViewProps {
  games?: MapGame[];
  selectedGameId?: string;
  onGameSelect?: (gameId: string) => void;
  onLocationSelect?: (location: LocationCoordinates) => void;
  showCurrentLocation?: boolean;
  showGameMarkers?: boolean;
  allowLocationSelection?: boolean;
  center?: LocationCoordinates;
  zoom?: number;
  className?: string;
}

// Simple map implementation (in a real app, you'd use Google Maps, Mapbox, etc.)
export function MapView({
  games = [],
  selectedGameId,
  onGameSelect,
  onLocationSelect,
  showCurrentLocation = true,
  showGameMarkers = true,
  allowLocationSelection = false,
  center,
  zoom = 13,
  className = ''
}: MapViewProps) {
  const allGames = useGames();
  const {
    currentLocation,
    isLoading: locationLoading,
    error: locationError,
    requestLocation,
    getFormattedDistanceTo
  } = useLocation();

  const [mapCenter, setMapCenter] = useState<LocationCoordinates>(
    center || currentLocation || { latitude: 29.6516, longitude: -82.3248 } // Gainesville, FL
  );
  const [mapZoom, setMapZoom] = useState(zoom);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [showSatellite, setShowSatellite] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);

  // Convert store games to map games
  const mapGames: MapGame[] = games.length > 0 ? games : allGames.map(game => ({
    id: game.id,
    title: game.title,
    sport: game.sport,
    location: {
      latitude: 29.6516 + (Math.random() - 0.5) * 0.1, // Random locations around Gainesville
      longitude: -82.3248 + (Math.random() - 0.5) * 0.1
    },
    locationName: game.location,
    date: game.date,
    time: game.time,
    players: game.players,
    maxPlayers: game.maxPlayers,
    cost: game.cost,
    difficulty: game.difficulty
  }));

  // Update map center when current location changes
  useEffect(() => {
    if (currentLocation && !center) {
      setMapCenter(currentLocation);
    }
  }, [currentLocation, center]);

  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const centerOnCurrentLocation = useCallback(() => {
    if (currentLocation) {
      setMapCenter(currentLocation);
      setMapZoom(15);
      toast.success('Centered on your location');
    } else {
      requestLocation();
    }
  }, [currentLocation, requestLocation]);

  const centerOnGame = useCallback((game: MapGame) => {
    setMapCenter(game.location);
    setMapZoom(16);
    if (onGameSelect) {
      onGameSelect(game.id);
    }
  }, [onGameSelect]);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!allowLocationSelection) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert pixel coordinates to lat/lng (simplified)
    const lat = mapCenter.latitude + (y - rect.height / 2) * -0.001;
    const lng = mapCenter.longitude + (x - rect.width / 2) * 0.001;

    const location = { latitude: lat, longitude: lng };
    setSelectedLocation(location);

    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [allowLocationSelection, mapCenter, onLocationSelect]);

  const zoomIn = useCallback(() => {
    setMapZoom(prev => Math.min(prev + 1, 18));
  }, []);

  const zoomOut = useCallback(() => {
    setMapZoom(prev => Math.max(prev - 1, 1));
  }, []);

  const resetView = useCallback(() => {
    if (currentLocation) {
      setMapCenter(currentLocation);
    }
    setMapZoom(13);
    setSelectedLocation(null);
  }, [currentLocation]);

  const getSportColor = (sport: string): string => {
    const colors = {
      'Basketball': 'bg-sport-basketball',
      'Soccer': 'bg-sport-soccer', 
      'Tennis': 'bg-sport-tennis',
      'Volleyball': 'bg-sport-volleyball',
      'Football': 'bg-sport-football',
      'Baseball': 'bg-sport-baseball'
    };
    return colors[sport as keyof typeof colors] || 'bg-primary';
  };

  if (locationError) {
    return (
      <div className={`relative ${className}`}>
        <EmptyState
          icon={<MapPin className="w-16 h-16" />}
          title="Location Access Required"
          description="Please enable location access to view the map and find nearby games."
          action={{
            label: "Enable Location",
            onClick: requestLocation
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className={`relative w-full h-full min-h-[400px] cursor-crosshair transition-all duration-300 ${
          showSatellite ? 'bg-gray-800' : 'bg-green-100'
        }`}
        onClick={handleMapClick}
        role="application"
        aria-label="Interactive map showing games and locations"
      >
        {/* Loading State */}
        {(!isMapLoaded || locationLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
            <LoadingSpinner size="lg" text="Loading map..." />
          </div>
        )}

        {/* Map Background Pattern */}
        <div 
          className={`absolute inset-0 opacity-30 ${
            showSatellite 
              ? 'bg-gradient-to-br from-gray-900 via-gray-700 to-gray-800' 
              : 'bg-gradient-to-br from-green-200 via-blue-100 to-green-300'
          }`}
          style={{
            backgroundImage: showSatellite 
              ? 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)'
              : 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}
        />

        {/* Current Location Marker */}
        {showCurrentLocation && currentLocation && (
          <div
            className="absolute z-20"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
              <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-30" />
            </div>
          </div>
        )}

        {/* Game Markers */}
        {showGameMarkers && mapGames.map((game, index) => {
          const isSelected = selectedGameId === game.id;
          const isHovered = hoveredGameId === game.id;
          const distance = currentLocation ? calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            game.location.latitude,
            game.location.longitude
          ) : null;

          return (
            <div
              key={game.id}
              className="absolute z-10 cursor-pointer"
              style={{
                left: `${45 + index * 8}%`, // Spread markers across map
                top: `${40 + index * 6}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                centerOnGame(game);
              }}
              onMouseEnter={() => setHoveredGameId(game.id)}
              onMouseLeave={() => setHoveredGameId(null)}
            >
              <div className={`relative ${isSelected || isHovered ? 'z-30' : 'z-10'}`}>
                {/* Marker */}
                <div className={`
                  w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center
                  ${getSportColor(game.sport)} ${isSelected ? 'ring-2 ring-primary' : ''}
                  transition-all duration-200
                `}>
                  <Users className="w-4 h-4 text-white" />
                </div>

                {/* Game Info Popup */}
                {(isSelected || isHovered) && (
                  <div
                    className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2"
                  >
                    <Card className="w-64 shadow-lg border-2">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{game.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {game.sport}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {game.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {game.players}/{game.maxPlayers}
                            </div>
                            {game.cost !== 'Free' && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {game.cost}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {game.locationName}
                            </span>
                            {distance && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistance(distance)} away
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Selected Location Marker */}
        {selectedLocation && allowLocationSelection && (
          <div
            className="absolute z-20"
            style={{
              left: '60%',
              top: '45%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex flex-col items-center">
              <MapPin className="w-8 h-8 text-destructive drop-shadow-lg" />
              <div className="mt-1 px-2 py-1 bg-white rounded shadow text-xs">
                Selected Location
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
        {/* Layer Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="bg-background/95 backdrop-blur-sm"
          onClick={() => setShowSatellite(!showSatellite)}
          aria-label={showSatellite ? "Switch to map view" : "Switch to satellite view"}
        >
          <Layers className="w-4 h-4" />
        </Button>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm"
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm"
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Location */}
        <Button
          variant="outline"
          size="icon"
          className="bg-background/95 backdrop-blur-sm"
          onClick={centerOnCurrentLocation}
          disabled={locationLoading}
          aria-label="Center on current location"
        >
          {locationLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
        </Button>

        {/* Reset View */}
        <Button
          variant="outline"
          size="icon"
          className="bg-background/95 backdrop-blur-sm"
          onClick={resetView}
          aria-label="Reset map view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-30">
        <Card className="bg-background/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-xs space-y-1">
              <div className="font-medium mb-2">Legend</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span>Games</span>
              </div>
              {selectedLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-destructive" />
                  <span>Selected</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Count Badge */}
      {showGameMarkers && mapGames.length > 0 && (
        <div className="absolute top-4 left-4 z-30">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm">
            {mapGames.length} game{mapGames.length !== 1 ? 's' : ''} shown
          </Badge>
        </div>
      )}
    </div>
  );
}

export default MapView;