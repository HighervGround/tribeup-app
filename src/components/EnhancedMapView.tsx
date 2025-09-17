import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './ui/loading-spinner';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Plus, 
  Minus,
  RotateCcw,
  Users,
  Clock,
  DollarSign,
  Star,
  Cloud,
  Sun,
  CloudRain,
  Filter,
  Settings
} from 'lucide-react';
import { useLocation, LocationCoordinates, calculateDistance, formatDistance } from '../hooks/useLocation';
import { VenueService, Venue, VenueRecommendation, VenueFilter } from '../lib/venueService';
import { WeatherService, WeatherData } from '../lib/weatherService';
import { LocationNotificationService } from '../lib/locationNotificationService';
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
  venue_type?: 'indoor' | 'outdoor' | 'mixed';
}

interface EnhancedMapViewProps {
  games?: MapGame[];
  selectedGameId?: string;
  onGameSelect?: (gameId: string) => void;
  onLocationSelect?: (location: LocationCoordinates) => void;
  onVenueSelect?: (venue: Venue) => void;
  showCurrentLocation?: boolean;
  showGameMarkers?: boolean;
  showVenueMarkers?: boolean;
  allowLocationSelection?: boolean;
  center?: LocationCoordinates;
  zoom?: number;
  className?: string;
  sport?: string;
  gameDateTime?: Date;
}

interface MapFilters {
  venueType: 'all' | 'indoor' | 'outdoor' | 'mixed';
  weatherOptimized: boolean;
  minRating: number;
  maxDistance: number;
  showRecommendations: boolean;
}

function EnhancedMapView({
  games = [],
  selectedGameId,
  onGameSelect,
  onLocationSelect,
  onVenueSelect,
  showCurrentLocation = true,
  showGameMarkers = true,
  showVenueMarkers = true,
  allowLocationSelection = false,
  center,
  zoom = 13,
  className = '',
  sport,
  gameDateTime
}: EnhancedMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const gameMarkersRef = useRef<google.maps.Marker[]>([]);
  const venueMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueRecommendations, setVenueRecommendations] = useState<VenueRecommendation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    venueType: 'all',
    weatherOptimized: true,
    minRating: 0,
    maxDistance: 25,
    showRecommendations: true
  });
  
  const {
    currentLocation,
    isLoading: locationLoading,
    error: locationError,
    requestLocation
  } = useLocation();

  const mapCenter = center || currentLocation || { latitude: 29.6516, longitude: -82.3248 };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('Initializing Enhanced Google Maps...');
        const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
        
        if (!apiKey) {
          throw new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
        }
        
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();
        
        if (!mapRef.current) {
          console.error('Map container ref not available');
          return;
        }

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: mapCenter.latitude, lng: mapCenter.longitude },
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: false,
          styles: [
            {
              featureType: 'poi.sports_complex',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'poi.park',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        googleMapRef.current = map;
        setIsMapLoaded(true);
        console.log('Enhanced Google Map initialized successfully');

        // Add click listener for location selection
        if (allowLocationSelection) {
          map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && onLocationSelect) {
              const location = {
                latitude: event.latLng.lat(),
                longitude: event.latLng.lng()
              };
              onLocationSelect(location);
            }
          });
        }

      } catch (error) {
        console.error('Error loading Enhanced Google Maps:', error);
        setMapError(`Failed to load Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initMap();
  }, [mapCenter.latitude, mapCenter.longitude, zoom, allowLocationSelection, onLocationSelect]);

  // Load venues and recommendations when location changes
  useEffect(() => {
    if (currentLocation && showVenueMarkers) {
      loadVenuesAndRecommendations();
    }
  }, [currentLocation, sport, gameDateTime, filters, showVenueMarkers]);

  // Load weather data
  useEffect(() => {
    if (currentLocation && gameDateTime) {
      loadWeatherData();
    }
  }, [currentLocation, gameDateTime]);

  const loadVenuesAndRecommendations = async () => {
    if (!currentLocation) return;

    try {
      // Load nearby venues
      const nearbyVenues = await VenueService.getVenuesNearLocation(
        currentLocation,
        filters.maxDistance
      );

      // Apply filters
      let filteredVenues = nearbyVenues;
      
      if (filters.venueType !== 'all') {
        filteredVenues = filteredVenues.filter(v => v.venue_type === filters.venueType);
      }
      
      if (filters.minRating > 0) {
        filteredVenues = filteredVenues.filter(v => v.average_rating >= filters.minRating);
      }

      setVenues(filteredVenues);

      // Load sport-specific recommendations if sport is provided
      if (sport && gameDateTime && filters.showRecommendations) {
        const recommendations = await VenueService.getVenueRecommendations(
          currentLocation,
          sport,
          gameDateTime,
          {
            venue_type: filters.venueType !== 'all' ? filters.venueType : undefined,
            max_distance_km: filters.maxDistance,
            min_rating: filters.minRating
          }
        );
        setVenueRecommendations(recommendations);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
      toast.error('Failed to load venue data');
    }
  };

  const loadWeatherData = async () => {
    if (!currentLocation || !gameDateTime) return;

    try {
      const weatherData = await WeatherService.getGameWeather(
        currentLocation.latitude,
        currentLocation.longitude,
        gameDateTime
      );
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading weather:', error);
    }
  };

  // Update current location marker
  useEffect(() => {
    if (!googleMapRef.current || !showCurrentLocation || !currentLocation) return;

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
      map: googleMapRef.current,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    currentLocationMarkerRef.current = marker;
  }, [currentLocation, showCurrentLocation]);

  // Update game markers
  useEffect(() => {
    if (!googleMapRef.current || !showGameMarkers) return;

    gameMarkersRef.current.forEach(marker => marker.setMap(null));
    gameMarkersRef.current = [];

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    games.forEach(game => {
      const marker = new google.maps.Marker({
        position: { lat: game.location.latitude, lng: game.location.longitude },
        map: googleMapRef.current,
        title: game.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: getSportColor(game.sport),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        if (onGameSelect) {
          onGameSelect(game.id);
        }
        showGameInfoWindow(game, marker);
      });

      gameMarkersRef.current.push(marker);
    });
  }, [games, showGameMarkers, currentLocation, onGameSelect]);

  // Update venue markers
  useEffect(() => {
    if (!googleMapRef.current || !showVenueMarkers) return;

    venueMarkersRef.current.forEach(marker => marker.setMap(null));
    venueMarkersRef.current = [];

    const venuesToShow = filters.showRecommendations && venueRecommendations.length > 0 
      ? venueRecommendations.map(r => r.venue)
      : venues;

    venuesToShow.forEach((venue, index) => {
      const isRecommended = filters.showRecommendations && 
        venueRecommendations.some(r => r.venue.id === venue.id);
      
      const marker = new google.maps.Marker({
        position: { lat: venue.latitude, lng: venue.longitude },
        map: googleMapRef.current,
        title: venue.name,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: isRecommended ? 8 : 6,
          fillColor: getVenueColor(venue.venue_type, isRecommended),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          rotation: 0
        }
      });

      marker.addListener('click', () => {
        if (onVenueSelect) {
          onVenueSelect(venue);
        }
        showVenueInfoWindow(venue, marker, isRecommended);
      });

      venueMarkersRef.current.push(marker);
    });
  }, [venues, venueRecommendations, filters, showVenueMarkers, onVenueSelect]);

  const showGameInfoWindow = (game: MapGame, marker: google.maps.Marker) => {
    const distance = currentLocation ? calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      game.location.latitude,
      game.location.longitude
    ) : null;

    const weatherIcon = weather ? getWeatherIcon(weather.condition) : '';
    const weatherSuitability = weather && game.venue_type === 'outdoor' 
      ? (weather.isOutdoorFriendly ? '✅ Good weather' : '⚠️ Check weather')
      : '';

    const content = `
      <div class="p-3 max-w-xs">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-sm">${game.title}</h4>
          <span class="text-xs bg-gray-100 px-2 py-1 rounded">${game.sport}</span>
        </div>
        <div class="space-y-1 text-xs text-gray-600">
          <div class="flex items-center gap-1">
            <span>🕒</span>
            <span>${game.time}</span>
          </div>
          <div class="flex items-center gap-1">
            <span>👥</span>
            <span>${game.players}/${game.maxPlayers} players</span>
          </div>
          ${game.cost !== 'Free' ? `
            <div class="flex items-center gap-1">
              <span>💰</span>
              <span>${game.cost}</span>
            </div>
          ` : ''}
          <div class="flex items-center gap-1">
            <span>📍</span>
            <span>${game.locationName}</span>
          </div>
          ${distance ? `
            <div class="flex items-center gap-1">
              <span>📏</span>
              <span>${formatDistance(distance)} away</span>
            </div>
          ` : ''}
          ${weatherSuitability ? `
            <div class="flex items-center gap-1">
              <span>${weatherIcon}</span>
              <span>${weatherSuitability}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    infoWindowRef.current?.setContent(content);
    infoWindowRef.current?.open(googleMapRef.current, marker);
  };

  const showVenueInfoWindow = (venue: Venue, marker: google.maps.Marker, isRecommended: boolean) => {
    const distance = currentLocation ? calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      venue.latitude,
      venue.longitude
    ) : null;

    const recommendation = venueRecommendations.find(r => r.venue.id === venue.id);
    const stars = '⭐'.repeat(Math.floor(venue.average_rating));

    const content = `
      <div class="p-3 max-w-sm">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-sm">${venue.name}</h4>
          ${isRecommended ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Recommended</span>' : ''}
        </div>
        <div class="space-y-1 text-xs text-gray-600">
          <div class="flex items-center gap-1">
            <span>🏟️</span>
            <span class="capitalize">${venue.venue_type} venue</span>
          </div>
          <div class="flex items-center gap-1">
            <span>${stars}</span>
            <span>${venue.average_rating.toFixed(1)} (${venue.total_ratings} reviews)</span>
          </div>
          <div class="flex items-center gap-1">
            <span>🏃</span>
            <span>${venue.supported_sports.slice(0, 3).join(', ')}</span>
          </div>
          ${distance ? `
            <div class="flex items-center gap-1">
              <span>📏</span>
              <span>${formatDistance(distance)} away</span>
            </div>
          ` : ''}
          ${recommendation ? `
            <div class="mt-2 p-2 bg-blue-50 rounded text-xs">
              <div class="font-medium text-blue-800">Why recommended:</div>
              <div class="text-blue-600">${recommendation.reasons.slice(0, 2).join(', ')}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    infoWindowRef.current?.setContent(content);
    infoWindowRef.current?.open(googleMapRef.current, marker);
  };

  const getSportColor = (sport: string): string => {
    const colors = {
      'Basketball': '#FF6B35',
      'Soccer': '#4CAF50', 
      'Tennis': '#FFC107',
      'Volleyball': '#2196F3',
      'Football': '#9C27B0',
      'Baseball': '#FF5722',
      'Pickleball': '#E91E63',
      'Golf': '#4CAF50',
      'Hockey': '#607D8B',
      'Rugby': '#795548'
    };
    return colors[sport as keyof typeof colors] || '#6B7280';
  };

  const getVenueColor = (venueType: string, isRecommended: boolean): string => {
    const baseColors = {
      'indoor': '#3B82F6',
      'outdoor': '#10B981',
      'mixed': '#8B5CF6'
    };
    
    const color = baseColors[venueType as keyof typeof baseColors] || '#6B7280';
    return isRecommended ? '#F59E0B' : color; // Gold for recommended venues
  };

  const getWeatherIcon = (condition: string): string => {
    const iconMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    return iconMap[condition] || '🌤️';
  };

  const centerOnCurrentLocation = useCallback(() => {
    if (currentLocation && googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      googleMapRef.current.setZoom(15);
      toast.success('Centered on your location');
    } else {
      requestLocation();
    }
  }, [currentLocation, requestLocation]);

  const zoomIn = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 13;
      googleMapRef.current.setZoom(Math.min(currentZoom + 1, 20));
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 13;
      googleMapRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  }, []);

  const resetView = useCallback(() => {
    if (googleMapRef.current) {
      const center = currentLocation || { latitude: 29.6516, longitude: -82.3248 };
      googleMapRef.current.setCenter({ lat: center.latitude, lng: center.longitude });
      googleMapRef.current.setZoom(13);
    }
  }, [currentLocation]);

  const handleFilterChange = (newFilters: Partial<MapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (mapError) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <div className="text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Map Unavailable</h3>
            <p className="text-sm text-muted-foreground">{mapError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative w-full h-full min-h-[300px] md:min-h-[400px]"
        role="application"
        aria-label="Enhanced Interactive Google Map showing games, venues, and recommendations"
      />

      {/* Loading State */}
      {(!isMapLoaded || locationLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
          <LoadingSpinner size="lg" text="Loading enhanced map..." />
        </div>
      )}

      {/* Weather Info */}
      {weather && (
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-30">
          <Card className="bg-background/95 backdrop-blur-sm">
            <CardContent className="p-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-lg">{getWeatherIcon(weather.condition)}</span>
                <div>
                  <div className="font-medium">{weather.temperature}°F</div>
                  <div className="text-muted-foreground">{weather.condition}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-1 md:gap-2 z-30">
        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="bg-background/95 backdrop-blur-sm h-8 w-8 md:h-10 md:w-10"
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <Filter className="w-3 h-3 md:w-4 md:h-4" />
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-16 right-2 md:top-20 md:right-4 z-30">
          <Card className="bg-background/95 backdrop-blur-sm w-64">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Map Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium">Venue Type</label>
                <select
                  value={filters.venueType}
                  onChange={(e) => handleFilterChange({ venueType: e.target.value as any })}
                  className="w-full mt-1 text-xs border rounded px-2 py-1"
                >
                  <option value="all">All Venues</option>
                  <option value="indoor">Indoor Only</option>
                  <option value="outdoor">Outdoor Only</option>
                  <option value="mixed">Mixed Venues</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange({ minRating: Number(e.target.value) })}
                  className="w-full mt-1 text-xs border rounded px-2 py-1"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium">Max Distance: {filters.maxDistance}km</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={filters.maxDistance}
                  onChange={(e) => handleFilterChange({ maxDistance: Number(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="weatherOptimized"
                  checked={filters.weatherOptimized}
                  onChange={(e) => handleFilterChange({ weatherOptimized: e.target.checked })}
                />
                <label htmlFor="weatherOptimized" className="text-xs">Weather Optimized</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showRecommendations"
                  checked={filters.showRecommendations}
                  onChange={(e) => handleFilterChange({ showRecommendations: e.target.checked })}
                />
                <label htmlFor="showRecommendations" className="text-xs">Show Recommendations</label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Badges */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 flex gap-2 z-30">
        {showGameMarkers && games.length > 0 && (
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm text-xs">
            🎮 {games.length} game{games.length !== 1 ? 's' : ''}
          </Badge>
        )}
        {showVenueMarkers && venues.length > 0 && (
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm text-xs">
            🏟️ {venues.length} venue{venues.length !== 1 ? 's' : ''}
          </Badge>
        )}
        {venueRecommendations.length > 0 && filters.showRecommendations && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
            ⭐ {venueRecommendations.length} recommended
          </Badge>
        )}
      </div>
    </div>
  );
}

export default EnhancedMapView;
