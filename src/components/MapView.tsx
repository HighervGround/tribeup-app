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
import { useGames } from '../hooks/useGames';
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
function MapView({
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

  // Convert games to map games - prioritize passed games, fallback to store games
  const sourceGames = games.length > 0 ? games : allGames;
  console.log('MapView: Source games count:', sourceGames.length);
  
  const mapGames: MapGame[] = sourceGames
    .filter((game: any) => {
      // Only include games that have valid coordinates
      const hasCoords = game.latitude && game.longitude;
      if (!hasCoords) {
        console.log(`MapView: Game "${game.title}" missing coordinates:`, {
          latitude: game.latitude,
          longitude: game.longitude,
          location: game.location
        });
      }
      return hasCoords;
    })
    .map((game: any) => ({
      id: game.id,
      title: game.title,
      sport: game.sport,
      location: {
        latitude: game.latitude,
        longitude: game.longitude
      },
      locationName: typeof game.location === 'string' ? game.location : 'Unknown Location',
      date: game.date,
      time: game.time,
      players: game.totalPlayers || 0, // Use totalPlayers from games_with_counts
      maxPlayers: game.maxPlayers || 0,
      cost: game.cost || 'Free',
      difficulty: game.difficulty || 'Beginner'
    }));
    
  console.log('MapView: Games with coordinates:', mapGames.length);

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
    const scaleFactor = Math.pow(2, mapZoom - 10) * 1000;
    const lat = mapCenter.latitude + (y - rect.height / 2) * -0.001 / scaleFactor;
    const lng = mapCenter.longitude + (x - rect.width / 2) * 0.001 / scaleFactor;

    const location = { latitude: lat, longitude: lng };
    setSelectedLocation(location);

    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [allowLocationSelection, mapCenter, mapZoom, onLocationSelect]);

  const handleMapTouch = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!allowLocationSelection || event.touches.length !== 1) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Convert pixel coordinates to lat/lng (simplified)
    const scaleFactor = Math.pow(2, mapZoom - 10) * 1000;
    const lat = mapCenter.latitude + (y - rect.height / 2) * -0.001 / scaleFactor;
    const lng = mapCenter.longitude + (x - rect.width / 2) * 0.001 / scaleFactor;

    const location = { latitude: lat, longitude: lng };
    setSelectedLocation(location);

    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [allowLocationSelection, mapCenter, mapZoom, onLocationSelect]);

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
        className={`relative w-full h-full min-h-[300px] md:min-h-[400px] cursor-crosshair transition-all duration-300 ${
          showSatellite ? 'bg-gray-800' : 'bg-green-100'
        }`}
        onClick={handleMapClick}
        onTouchEnd={handleMapTouch}
        role="application"
        aria-label="Interactive map showing games and locations"
      >
        {/* Loading State */}
        {(!isMapLoaded || locationLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
            <LoadingSpinner size="lg" text="Loading map..." />
          </div>
        )}

        {/* Interactive Map Implementation */}
        <div className="absolute inset-0">
          {/* OpenStreetMap Tile Layer */}
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: showSatellite 
                ? `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${mapZoom}/${Math.floor((90 - mapCenter.latitude) * Math.pow(2, mapZoom) / 360)}/${Math.floor((mapCenter.longitude + 180) * Math.pow(2, mapZoom) / 360)}')`
                : `url('https://tile.openstreetmap.org/${mapZoom}/${Math.floor((mapCenter.longitude + 180) * Math.pow(2, mapZoom) / 360)}/${Math.floor((90 - mapCenter.latitude) * Math.pow(2, mapZoom) / 360)}.png')`
            }}
          />
          
          {/* Map Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Street Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: showSatellite 
                ? 'none'
                : `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M20 20h20v20H20z'/%3E%3Cpath d='M0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>

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
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500/20 rounded-full animate-pulse" />
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

          // Calculate marker position based on actual coordinates
          const latDiff = game.location.latitude - mapCenter.latitude;
          const lngDiff = game.location.longitude - mapCenter.longitude;
          
          // Convert lat/lng differences to pixel positions using Web Mercator projection
          const scaleFactor = Math.pow(2, mapZoom) / 360;
          const pixelX = 50 + (lngDiff * scaleFactor * 100);
          const pixelY = 50 - (latDiff * scaleFactor * 100);
          
          // Clamp to map bounds with padding
          const clampedX = Math.max(5, Math.min(95, pixelX));
          const clampedY = Math.max(5, Math.min(95, pixelY));
          
          // Only show markers that are within reasonable bounds
          const isVisible = pixelX >= -10 && pixelX <= 110 && pixelY >= -10 && pixelY <= 110;

          return (
            <div
              key={game.id}
              className="absolute z-10 cursor-pointer"
              style={{
                left: `${clampedX}%`,
                top: `${clampedY}%`
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
                    className={`absolute z-40 ${
                      clampedY > 70 ? 'bottom-full mb-2' : 'top-full mt-2'
                    } left-1/2 transform -translate-x-1/2`}
                  >
                    <Card className="w-64 max-w-[calc(100vw-2rem)] shadow-lg border-2 bg-background/95 backdrop-blur-sm">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{game.title}</h4>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {game.sport}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="truncate">{game.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{game.players}/{game.maxPlayers} players</span>
                            </div>
                            {game.cost !== 'Free' && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span className="truncate">{game.cost}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="truncate mr-2">
                              {game.locationName}
                            </span>
                            {distance && (
                              <span className="flex-shrink-0">
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
      <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-1 md:gap-2 z-30">
        {/* Layer Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="bg-background/95 backdrop-blur-sm h-8 w-8 md:h-10 md:w-10"
          onClick={() => setShowSatellite(!showSatellite)}
          aria-label={showSatellite ? "Switch to map view" : "Switch to satellite view"}
        >
          <Layers className="w-3 h-3 md:w-4 md:h-4" />
        </Button>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm h-8 w-8 md:h-10 md:w-10"
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm h-8 w-8 md:h-10 md:w-10"
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            <Minus className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>

        {/* Current Location */}
        <Button
          variant="outline"
          size="icon"
          className="bg-background/95 backdrop-blur-sm h-8 w-8 md:h-10 md:w-10"
          onClick={centerOnCurrentLocation}
          disabled={locationLoading}
          aria-label="Center on current location"
        >
          {locationLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Crosshair className="w-3 h-3 md:w-4 md:h-4" />
          )}
        </Button>

        {/* Reset View */}
        <Button
          variant="outline"
          size="icon"
          className="bg-background/95 backdrop-blur-sm h-8 w-8 md:h-10 md:w-10"
          onClick={resetView}
          aria-label="Reset map view"
        >
          <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-30">
        <Card className="bg-background/95 backdrop-blur-sm">
          <CardContent className="p-2 md:p-3">
            <div className="text-xs space-y-1">
              <div className="font-medium mb-1 md:mb-2 text-xs md:text-sm">Legend</div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full" />
                <span className="text-xs">You</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-primary rounded-full" />
                <span className="text-xs">Games</span>
              </div>
              {selectedLocation && (
                <div className="flex items-center gap-1 md:gap-2">
                  <MapPin className="w-2 h-2 md:w-3 md:h-3 text-destructive" />
                  <span className="text-xs">Selected</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Count Badge */}
      {showGameMarkers && mapGames.length > 0 && (
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-30">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm text-xs">
            {mapGames.length} game{mapGames.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
}

export default MapView;