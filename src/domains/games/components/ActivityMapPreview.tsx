import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsApi } from '@/domains/locations/services/googleMapsLoader';

interface ActivityMapPreviewProps {
  latitude: number;
  longitude: number;
  location?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Small map preview thumbnail for activity cards
 * Only shows if activity has specific coordinates
 * Safe pattern: map initialized once, cleaned up properly
 */
export function ActivityMapPreview({
  latitude,
  longitude,
  location,
  className = '',
  onClick,
}: ActivityMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize map only once when container is ready
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialized

    const initMap = async () => {
      try {
        const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setLoadError('Map unavailable');
          setIsLoading(false);
          return;
        }

        await loadGoogleMapsApi(apiKey);
        
        if (!containerRef.current || !window.google) return;

        // Initialize map
        const map = new google.maps.Map(containerRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        // Add marker
        const marker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FA4616',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        mapRef.current = map;
        markerRef.current = marker;
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading map preview:', error);
        setLoadError('Map unavailable');
        setIsLoading(false);
      }
    };

    initMap();
  }, []); // Only run once on mount

  // Update marker position when coordinates change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const newPosition = { lat: latitude, lng: longitude };
    mapRef.current.setCenter(newPosition);
    markerRef.current.setPosition(newPosition);
  }, [latitude, longitude]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up marker safely
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch (e) {
          // Ignore errors - marker may already be cleaned up
        }
        markerRef.current = null;
      }
      
      // Clear map reference (Google Maps will handle DOM cleanup)
      mapRef.current = null;
    };
  }, []);

  if (loadError) {
    return (
      <div
        onClick={onClick}
        className={`w-full h-24 rounded-lg border border-border bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        role="button"
        tabIndex={0}
        aria-label={`Location: ${location || 'activity location'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <div className="text-center">
          <MapPin className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">{location?.split(',')[0] || 'Location'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`w-full h-24 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity bg-muted relative ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Map preview for ${location || 'activity location'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Map container - stable ref, never re-parented */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '96px' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
          <div className="text-xs text-muted-foreground">Loading map...</div>
        </div>
      )}
    </div>
  );
}

