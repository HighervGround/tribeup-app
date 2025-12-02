import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationState {
  currentLocation: LocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  lastUpdated: Date | null;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  autoRequest?: boolean;
}

// Utility functions for location calculations
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function formatDistance(distance: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    distance = distance * 0.621371; // Convert km to miles
  }
  
  if (distance < 1) {
    return unit === 'km' 
      ? `${Math.round(distance * 1000)}m`
      : `${Math.round(distance * 5280)}ft`;
  }
  
  return `${distance.toFixed(1)}${unit}`;
}

export function isWithinBounds(
  location: LocationCoordinates,
  bounds: MapBounds
): boolean {
  return (
    location.latitude >= bounds.south &&
    location.latitude <= bounds.north &&
    location.longitude >= bounds.west &&
    location.longitude <= bounds.east
  );
}

export function getBoundsFromCenter(
  center: LocationCoordinates,
  radiusKm: number
): MapBounds {
  const latOffset = radiusKm / 111; // Approximate: 1 degree lat = 111 km
  const lonOffset = radiusKm / (111 * Math.cos(toRadians(center.latitude)));
  
  return {
    north: center.latitude + latOffset,
    south: center.latitude - latOffset,
    east: center.longitude + lonOffset,
    west: center.longitude - lonOffset
  };
}

export function useLocation(options: UseLocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchPosition = false,
    autoRequest = true
  } = options;

  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    isLoading: false,
    error: null,
    permission: 'unknown',
    lastUpdated: null
  });

  const watchIdRef = useRef<number | null>(null);
  const requestInProgressRef = useRef(false);
  const permissionCheckInProgressRef = useRef(false);

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  // Check current permission status
  const checkPermission = useCallback(async () => {
    if (!isSupported) {
      setState(prev => ({ ...prev, permission: 'denied', error: 'Geolocation not supported' }));
      return 'denied';
    }

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permission: permission.state as any }));
        return permission.state;
      }
    } catch (error) {
      console.warn('Permission API not supported');
    }

    return 'unknown';
  }, [isSupported]);

  // Request location permission and get current position
  const requestLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    if (!isSupported) {
      toast.error('Location services are not supported by your browser');
      return null;
    }

    if (requestInProgressRef.current) {
      return null;
    }

    requestInProgressRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise((resolve) => {
      const geoOptions: PositionOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge
      };

      const successCallback = (position: GeolocationPosition) => {
        const location: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        };

        setState(prev => ({
          ...prev,
          currentLocation: location,
          isLoading: false,
          error: null,
          permission: 'granted',
          lastUpdated: new Date()
        }));

        requestInProgressRef.current = false;
        resolve(location);
      };

      const errorCallback = (error: GeolocationPositionError) => {
        let errorMessage = 'Failed to get location';
        let permission: LocationState['permission'] = 'unknown';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            permission = 'denied';
            toast.error('Please enable location access to find nearby activities');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          permission
        }));

        requestInProgressRef.current = false;
        resolve(null);
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        geoOptions
      );
    });
  }, [isSupported, enableHighAccuracy, timeout, maximumAge]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!isSupported || watchIdRef.current !== null) {
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    const successCallback = (position: GeolocationPosition) => {
      const location: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined
      };

      setState(prev => ({
        ...prev,
        currentLocation: location,
        lastUpdated: new Date()
      }));
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error('Location watch error:', error);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      geoOptions
    );
  }, [isSupported, enableHighAccuracy, timeout, maximumAge]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Clear location data
  const clearLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentLocation: null,
      error: null,
      lastUpdated: null
    }));
  }, []);

  // Get distance to a location
  const getDistanceTo = useCallback((
    target: LocationCoordinates,
    unit: 'km' | 'mi' = 'km'
  ): number | null => {
    if (!state.currentLocation) return null;
    
    const distance = calculateDistance(
      state.currentLocation.latitude,
      state.currentLocation.longitude,
      target.latitude,
      target.longitude
    );
    
    return unit === 'mi' ? distance * 0.621371 : distance;
  }, [state.currentLocation]);

  // Get formatted distance to a location
  const getFormattedDistanceTo = useCallback((
    target: LocationCoordinates,
    unit: 'km' | 'mi' = 'km'
  ): string | null => {
    const distance = getDistanceTo(target, unit);
    return distance ? formatDistance(distance, unit) : null;
  }, [getDistanceTo]);

  // Check if a location is nearby
  const isNearby = useCallback((
    target: LocationCoordinates,
    radiusKm: number = 5
  ): boolean => {
    const distance = getDistanceTo(target, 'km');
    return distance !== null && distance <= radiusKm;
  }, [getDistanceTo]);

  // Helper function to check if location is fresh
  const isLocationFresh = useCallback((): boolean => {
    if (!state.currentLocation || !state.lastUpdated) {
      return false;
    }
    const age = Date.now() - state.lastUpdated.getTime();
    return age < maximumAge;
  }, [state.currentLocation, state.lastUpdated, maximumAge]);

  // Initialize
  useEffect(() => {
    let isMounted = true;

    const initializeLocation = async () => {
      // Prevent multiple simultaneous permission checks
      if (permissionCheckInProgressRef.current) {
        return;
      }

      permissionCheckInProgressRef.current = true;

      try {
        // First, check permission status
        const permissionStatus = await checkPermission();

        if (!isMounted) {
          return;
        }

        // Only request location if:
        // 1. autoRequest is enabled
        // 2. Permission is 'granted' or 'prompt' (not 'denied')
        // 3. We don't have a fresh location already
        if (autoRequest && (permissionStatus === 'granted' || permissionStatus === 'prompt')) {
          // Check if we already have a fresh location
          if (!isLocationFresh()) {
            await requestLocation();
          }
        }

        // Start watching if requested
        if (watchPosition && permissionStatus === 'granted') {
          startWatching();
        }
      } catch (error) {
        console.error('Error initializing location:', error);
      } finally {
        permissionCheckInProgressRef.current = false;
      }
    };

    initializeLocation();

    return () => {
      isMounted = false;
      stopWatching();
    };
  }, [checkPermission, requestLocation, startWatching, stopWatching, autoRequest, watchPosition, isLocationFresh]);

  return {
    // State
    ...state,
    isSupported,
    
    // Actions
    requestLocation,
    clearLocation,
    startWatching,
    stopWatching,
    
    // Utilities
    getDistanceTo,
    getFormattedDistanceTo,
    isNearby,
    calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => 
      calculateDistance(lat1, lon1, lat2, lon2),
    formatDistance,
    getBoundsFromCenter: (radiusKm: number) => 
      state.currentLocation ? getBoundsFromCenter(state.currentLocation, radiusKm) : null
  };
}

// Hook for managing map state
export function useMapState() {
  const [mapCenter, setMapCenter] = useState<LocationCoordinates | null>(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const centerOnLocation = useCallback((location: LocationCoordinates, zoom?: number) => {
    setMapCenter(location);
    if (zoom !== undefined) {
      setMapZoom(zoom);
    }
  }, []);

  const selectLocation = useCallback((location: LocationCoordinates) => {
    setSelectedLocation(location);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  return {
    mapCenter,
    mapZoom,
    selectedLocation,
    isMapLoaded,
    setMapCenter,
    setMapZoom,
    setSelectedLocation,
    setIsMapLoaded,
    centerOnLocation,
    selectLocation,
    clearSelection
  };
}