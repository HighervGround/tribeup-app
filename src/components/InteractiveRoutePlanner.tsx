import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { X, Navigation } from 'lucide-react';
import { computeRoute, decodePolyline } from '../lib/routesApi';

interface Waypoint {
  lat: number;
  lng: number;
  address?: string;
  marker?: google.maps.Marker;
}

interface InteractiveRoutePlannerProps {
  centerLat: number;
  centerLng: number;
  onRouteSave: (route: {
    path: Array<{ lat: number; lng: number }>;
    distance: string;
    name: string;
    polyline?: string;
  }) => void;
  sport: string;
}

export function InteractiveRoutePlanner({ centerLat, centerLng, onRouteSave, sport }: InteractiveRoutePlannerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'] // Add geometry for distance calculations
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 18,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({ map, suppressMarkers: true });
      setMapLoaded(true);

      // Click handler to add waypoints - use refs to avoid stale closures
      let clickListener: google.maps.MapsEventListener | null = null;
      
      const setupClickHandler = () => {
        if (clickListener) {
          google.maps.event.removeListener(clickListener);
        }
        
        clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;

          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          // Geocode to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            const address = status === 'OK' && results && results[0]
              ? results[0].formatted_address
              : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            setWaypoints(prev => {
              const newIndex = prev.length;
              const newWaypoint: Waypoint = {
                lat,
                lng,
                address,
              };

              // Create marker
              const marker = new google.maps.Marker({
                position: { lat, lng },
                map,
                draggable: true,
                label: {
                  text: String(newIndex + 1),
                  color: 'white',
                  fontWeight: 'bold',
                },
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                },
              });

              // Update waypoint position when marker is dragged
              marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
                if (!e.latLng) return;
                const newLat = e.latLng.lat();
                const newLng = e.latLng.lng();
                
                // Geocode new position
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                  const newAddress = status === 'OK' && results && results[0]
                    ? results[0].formatted_address
                    : `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`;

                  setWaypoints(current => {
                    const updated = current.map((wp, idx) => 
                      idx === newIndex ? { ...wp, lat: newLat, lng: newLng, address: newAddress, marker } : wp
                    );
                    // Recalculate route after drag using refs
                    setTimeout(() => {
                      if (directionsServiceRef.current && directionsRendererRef.current) {
                        calculateRouteWithServices(updated, directionsServiceRef.current, directionsRendererRef.current);
                      }
                    }, 100);
                    return updated;
                  });
                });
              });

              const updated = [...prev, { ...newWaypoint, marker }];
              
              // Calculate and draw route using refs
              setTimeout(() => {
                if (directionsServiceRef.current && directionsRendererRef.current) {
                  calculateRouteWithServices(updated, directionsServiceRef.current, directionsRendererRef.current);
                }
              }, 100);
              
              toast.success(`Waypoint ${updated.length} added`);
              return updated;
            });
          });
        });
      };
      
      setupClickHandler();

    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
      toast.error('Failed to load map');
    });
  }, []);

  // Update route when waypoints change
  useEffect(() => {
    if (waypoints.length > 0 && directionsServiceRef.current && directionsRendererRef.current) {
      calculateRouteWithServices(waypoints, directionsServiceRef.current, directionsRendererRef.current);
    }
  }, [waypoints.length]);

  const calculateRouteWithServices = async (
    points: Waypoint[], 
    service: google.maps.DirectionsService, 
    renderer: google.maps.DirectionsRenderer
  ) => {
    if (!mapInstanceRef.current || points.length === 0) return;

    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      toast.error('Google Maps API key not found');
      return;
    }

    const origin = { lat: centerLat, lng: centerLng };
    const travelMode = sport.toLowerCase();

    try {
      // Use Routes API v2 for better optimization
      const waypoints = points.map(p => ({ lat: p.lat, lng: p.lng }));
      
      const routesResponse = await computeRoute(
        apiKey,
        origin,
        origin, // Loop back to start
        waypoints,
        travelMode as 'cycling' | 'running' | 'walking',
        true // optimize waypoints
      );

      if (routesResponse.routes && routesResponse.routes.length > 0) {
        const route = routesResponse.routes[0];
        const encodedPolyline = route.polyline.encodedPolyline;
        
        // Decode polyline to draw on map
        const path = decodePolyline(encodedPolyline);
        
        // Convert to Google Maps format for display
        const googlePath = path.map(p => new google.maps.LatLng(p.lat, p.lng));
        
        // Draw polyline on map
        if (!polylineRef.current) {
          polylineRef.current = new google.maps.Polyline({
            path: googlePath,
            geodesic: true,
            strokeColor: '#3b82f6',
            strokeOpacity: 1.0,
            strokeWeight: 5,
            map: mapInstanceRef.current,
          });
        } else {
          polylineRef.current.setPath(googlePath);
        }

        // Clear directions renderer since we're using custom polyline
        renderer.setDirections({ routes: [] });
      }
    } catch (error: any) {
      console.error('❌ Routes API error:', error);
      
      // Fallback to Directions API if Routes API fails
      console.log('⚠️ Falling back to Directions API...');
      const waypoints_gm = points.map(p => ({
        location: { lat: p.lat, lng: p.lng },
        stopover: true
      }));

      const mode = sport.toLowerCase() === 'cycling' ? google.maps.TravelMode.BICYCLING : google.maps.TravelMode.WALKING;

      service.route({
        origin,
        destination: origin,
        waypoints: waypoints_gm,
        optimizeWaypoints: true,
        travelMode: mode,
      }, (result, status) => {
        if (status === 'OK' && result) {
          renderer.setDirections(result);
        } else {
          console.error('❌ Directions request failed:', status);
          if (status === 'REQUEST_DENIED') {
            toast.error('Routes API or Directions API not enabled. Enable "Routes API" in Google Cloud Console.');
          } else {
            toast.error(`Route calculation failed: ${status}`);
          }
        }
      });
    }
  };

  const removeWaypoint = (index: number) => {
    const waypoint = waypoints[index];
    if (waypoint.marker) {
      waypoint.marker.setMap(null);
    }
    const updated = waypoints.filter((_, i) => i !== index);
    setWaypoints(updated);
    
    // Update marker labels
    updated.forEach((wp, idx) => {
      if (wp.marker && wp.marker.getLabel()) {
        wp.marker.setLabel({
          text: String(idx + 1),
          color: 'white',
          fontWeight: 'bold',
        });
      }
    });
    
    if (updated.length === 0) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }
      // Clear custom polyline when no waypoints
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    } else if (directionsServiceRef.current && directionsRendererRef.current) {
      calculateRouteWithServices(updated, directionsServiceRef.current, directionsRendererRef.current);
    }
  };

  const handleSave = async () => {
    if (waypoints.length === 0) {
      toast.error('Add at least one waypoint to create a route');
      return;
    }

    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      toast.error('Google Maps API key not found');
      return;
    }

    console.log('💾 Saving route with waypoints:', waypoints.length, waypoints);

    const origin = { lat: centerLat, lng: centerLng };
    const travelMode = sport.toLowerCase();
    const waypointsList = waypoints.map(p => ({ lat: p.lat, lng: p.lng }));

    try {
      // Use Routes API v2 for better route optimization
      const routesResponse = await computeRoute(
        apiKey,
        origin,
        origin, // Loop back to start
        waypointsList,
        travelMode as 'cycling' | 'running' | 'walking',
        true // optimize waypoints
      );

      if (routesResponse.routes && routesResponse.routes.length > 0) {
        const route = routesResponse.routes[0];
        const totalDistanceMeters = route.distanceMeters;
        const encodedPolyline = route.polyline.encodedPolyline;
        
        // Decode polyline to get path
        const path = decodePolyline(encodedPolyline);

        const routeData = {
          path: path,
          distance: `${(totalDistanceMeters / 1000).toFixed(2)} km`,
          name: `${sport} loop`,
          polyline: encodedPolyline,
        };

        console.log('💾 Saving route:', routeData);
        onRouteSave(routeData);

        toast.success(`Route saved! Distance: ${(totalDistanceMeters / 1000).toFixed(2)} km`);
      } else {
        throw new Error('No routes returned');
      }
    } catch (error: any) {
      console.error('❌ Routes API error, falling back to Directions API:', error);
      
      // Fallback to Directions API
      if (!directionsServiceRef.current) {
        toast.error('Route calculation services not available');
        return;
      }

      const mode = sport.toLowerCase() === 'cycling' ? google.maps.TravelMode.BICYCLING : google.maps.TravelMode.WALKING;
      const waypoints_gm = waypointsList.map(p => ({
        location: { lat: p.lat, lng: p.lng },
        stopover: true
      }));

      directionsServiceRef.current.route({
        origin,
        destination: origin,
        waypoints: waypoints_gm,
        optimizeWaypoints: true,
        travelMode: mode,
      }, (result, status) => {
        if (status === 'OK' && result) {
          let totalDistance = 0;
          const path: Array<{ lat: number; lng: number }> = [];
          
          result.routes[0].legs.forEach(leg => {
            totalDistance += leg.distance.value;
            leg.steps.forEach(step => {
              if (step.start_location) {
                path.push({ lat: step.start_location.lat(), lng: step.start_location.lng() });
              }
              if (step.end_location) {
                path.push({ lat: step.end_location.lat(), lng: step.end_location.lng() });
              }
            });
          });

          // Remove duplicates
          const uniquePath: Array<{ lat: number; lng: number }> = [];
          const seen = new Set<string>();
          path.forEach((p, i) => {
            const key = `${p.lat.toFixed(6)}_${p.lng.toFixed(6)}`;
            if (i === 0 || i === path.length - 1 || !seen.has(key)) {
              if (!seen.has(key)) {
                seen.add(key);
                uniquePath.push(p);
              }
            }
          });

          const routeData = {
            path: uniquePath,
            distance: `${(totalDistance / 1000).toFixed(2)} km`,
            name: `${sport} loop`,
            polyline: result.routes[0].overview_polyline?.points,
          };

          console.log('💾 Saving route (fallback):', routeData);
          onRouteSave(routeData);
          toast.success(`Route saved! Distance: ${(totalDistance / 1000).toFixed(2)} km`);
        } else {
          console.error('❌ Route calculation failed:', status);
          if (status === 'REQUEST_DENIED') {
            toast.error('Routes API or Directions API not enabled. Enable "Routes API" in Google Cloud Console.');
          } else {
            toast.error(`Could not calculate route: ${status}`);
          }
        }
      });
    }
  };

  const clearAll = () => {
    waypoints.forEach(wp => {
      if (wp.marker) {
        wp.marker.setMap(null);
      }
    });
    setWaypoints([]);
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    // Clear custom polyline too
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Click on the map to add waypoints. Drag waypoints to adjust the route. The route will loop back to the start.
      </p>
      
      <div className="border rounded-lg overflow-hidden">
        <div ref={mapRef} className="aspect-video w-full" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        )}
      </div>

      {waypoints.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Waypoints ({waypoints.length}):</div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-7"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {waypoints.map((wp, index) => (
              <div key={index} className="flex gap-2 items-center text-xs bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground w-6">{index + 1}.</span>
                <span className="flex-1 truncate">{wp.address || `${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWaypoint(index)}
                  className="text-xs h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleSave}
        disabled={waypoints.length === 0 || !mapLoaded}
        className="w-full"
      >
        <Navigation className="w-4 h-4 mr-2" />
        Save Route {waypoints.length > 0 && `(${waypoints.length} waypoints)`}
      </Button>
    </div>
  );
}

