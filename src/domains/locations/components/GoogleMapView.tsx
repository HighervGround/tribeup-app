import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsApi } from '@/domains/locations/services/googleMapsLoader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Plus, 
  Minus,
  RotateCcw,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import { useLocation, LocationCoordinates, calculateDistance, formatDistance } from '@/domains/locations/hooks/useLocation';
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

interface GoogleMapViewProps {
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

function GoogleMapView({
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
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
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
        console.log('Initializing Google Maps...');
        const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
        console.log('Using API key:', apiKey ? 'API key present' : 'No API key found');
        
        if (!apiKey) {
          throw new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
        }
        
        await loadGoogleMapsApi(apiKey);
        console.log('Google Maps API loaded successfully');
        
        if (!mapRef.current) {
          console.error('Map container ref not available');
          return;
        }

        console.log('Creating Google Map instance...');
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: mapCenter.latitude, lng: mapCenter.longitude },
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: false, // We'll use custom controls
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        googleMapRef.current = map;
        setIsMapLoaded(true);
        console.log('Google Map initialized successfully');

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
        console.error('Error loading Google Maps:', error);
        setMapError(`Failed to load Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initMap();
  }, [mapCenter.latitude, mapCenter.longitude, zoom, allowLocationSelection, onLocationSelect]);

  // Update current location marker
  useEffect(() => {
    if (!googleMapRef.current || !showCurrentLocation || !currentLocation) return;

    // Remove existing current location marker
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }

    // Add new current location marker
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

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create info window
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // Add game markers
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

      // Add click listener
      marker.addListener('click', () => {
        if (onGameSelect) {
          onGameSelect(game.id);
        }

        // Show info window
        const distance = currentLocation ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          game.location.latitude,
          game.location.longitude
        ) : null;

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
                <span>{game.players}/{game.maxPlayers} players</span>
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
            </div>
          </div>
        `;

        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [games, showGameMarkers, currentLocation, onGameSelect]);

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
        aria-label="Interactive Google Map showing games and locations"
      />

      {/* Loading State */}
      {(!isMapLoaded || locationLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
          <LoadingSpinner size="lg" text="Loading map..." />
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-1 md:gap-2 z-30">
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

      {/* Game Count Badge */}
      {showGameMarkers && games.length > 0 && (
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-30">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm text-xs">
            {games.length} game{games.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
}

export default GoogleMapView;
