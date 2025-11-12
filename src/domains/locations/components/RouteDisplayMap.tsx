import React, { useEffect, useRef } from 'react';
import { loadGoogleMapsApi } from '@/domains/locations/services/googleMapsLoader';
import { Card, CardContent } from '@/shared/components/ui/card';

interface RouteDisplayMapProps {
  waypoints: Array<{ lat: number; lng: number }>;
  sport: string;
  analysis?: {
    distance: string;
    duration: string;
    elevationGain: number;
    difficulty: string;
  };
}

export const RouteDisplayMap: React.FC<RouteDisplayMapProps> = ({ 
  waypoints, 
  sport, 
  analysis 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Sport-specific colors
  const getSportColor = (sportType: string): string => {
    const colors = {
      'cycling': '#3b82f6',
      'running': '#ef4444', 
      'hiking': '#10b981',
      'walking': '#6b7280'
    };
    return colors[sportType.toLowerCase() as keyof typeof colors] || '#6b7280';
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || waypoints.length === 0) return;

      try {
        const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error('Google Maps API key not found');
          return;
        }

        await loadGoogleMapsApi(apiKey);

        // Calculate center and bounds
        const bounds = new google.maps.LatLngBounds();
        waypoints.forEach(point => {
          bounds.extend(new google.maps.LatLng(point.lat, point.lng));
        });

        const center = bounds.getCenter();

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: center.lat(), lng: center.lng() },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        // Fit map to show all waypoints
        map.fitBounds(bounds);

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add waypoint markers
        waypoints.forEach((point, index) => {
          const marker = new google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map: map,
            title: `Waypoint ${index + 1}`,
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: getSportColor(sport),
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            },
          });

          markersRef.current.push(marker);
        });

        // Calculate and draw route using Google Directions API to follow roads
        if (waypoints.length > 1) {
          const directionsService = new google.maps.DirectionsService();
          
          // Determine travel mode based on sport
          const getTravelMode = (sportType: string): google.maps.TravelMode => {
            switch (sportType.toLowerCase()) {
              case 'cycling':
              case 'bike':
                return google.maps.TravelMode.BICYCLING;
              case 'running':
              case 'hiking':
              case 'walking':
                return google.maps.TravelMode.WALKING;
              default:
                return google.maps.TravelMode.WALKING;
            }
          };

          // Create waypoints for directions (first is origin, last is destination, rest are waypoints)
          const origin = waypoints[0];
          const destination = waypoints[waypoints.length - 1];
          const waypointsForDirections = waypoints.slice(1, -1).map(point => ({
            location: new google.maps.LatLng(point.lat, point.lng),
            stopover: true
          }));

          directionsService.route({
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            waypoints: waypointsForDirections,
            optimizeWaypoints: false, // Keep original order
            travelMode: getTravelMode(sport),
          }, (result, status) => {
            if (status === 'OK' && result) {
              // Clear existing polyline
              if (polylineRef.current) {
                polylineRef.current.setMap(null);
              }

              // Extract the route path
              const routePath: google.maps.LatLng[] = [];
              result.routes[0].legs.forEach(leg => {
                leg.steps.forEach(step => {
                  step.path?.forEach(point => routePath.push(point));
                });
              });

              // Draw the route polyline following roads
              polylineRef.current = new google.maps.Polyline({
                path: routePath,
                geodesic: true,
                strokeColor: getSportColor(sport),
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map,
              });
            } else {
              console.warn('Directions request failed:', status);
              // Fallback to straight lines if directions fail
              const routePath = waypoints.map(point => 
                new google.maps.LatLng(point.lat, point.lng)
              );

              if (polylineRef.current) {
                polylineRef.current.setMap(null);
              }

              polylineRef.current = new google.maps.Polyline({
                path: routePath,
                geodesic: true,
                strokeColor: getSportColor(sport),
                strokeOpacity: 0.7,
                strokeWeight: 3,
                map: map,
              });
            }
          });
        }

      } catch (error) {
        console.error('Error loading route map:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [waypoints, sport]);

  if (waypoints.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground text-center">
            No route waypoints available to display.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-64 md:h-80 rounded-lg"
            style={{ minHeight: '300px' }}
          />
          
          {/* Route info overlay */}
          {analysis && (
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <div className="text-xs space-y-1">
                <div className="font-medium">{analysis.distance}</div>
                <div className="text-muted-foreground">{analysis.duration}</div>
                <div className="text-muted-foreground">+{analysis.elevationGain}m</div>
              </div>
            </div>
          )}
          
          {/* Waypoint count */}
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
            <div className="text-xs font-medium">
              {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
