import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { X, Navigation, Mountain, Clock, Route, TrendingUp } from 'lucide-react';
import { computeRoute, decodePolyline } from '@/domains/locations/services/routesApi';
import { loadGoogleMapsApi } from '@/domains/locations/services/googleMapsLoader';

interface Waypoint {
  lat: number;
  lng: number;
  address?: string;
  marker?: google.maps.Marker;
  elevation?: number;
}

interface RouteAnalysis {
  distance: string;
  duration: string;
  elevationGain: number;
  elevationLoss: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert';
  maxElevation: number;
  minElevation: number;
  avgGradient: number;
}

interface InteractiveRoutePlannerProps {
  centerLat: number;
  centerLng: number;
  onRouteSave: (route: {
    path: Array<{ lat: number; lng: number }>;
    distance: string;
    name: string;
    polyline?: string;
    analysis?: RouteAnalysis;
  }) => void;
  sport: string;
}

export function InteractiveRoutePlanner({ centerLat, centerLng, onRouteSave, sport }: InteractiveRoutePlannerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const elevationServiceRef = useRef<google.maps.ElevationService | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [elevationProfile, setElevationProfile] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Sport-specific travel mode mapping
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

  // Calculate difficulty based on distance, elevation gain, and sport
  const calculateDifficulty = (distanceKm: number, elevationGain: number, sportType: string): 'Easy' | 'Moderate' | 'Hard' | 'Expert' => {
    const sportLower = sportType.toLowerCase();
    
    if (sportLower === 'cycling') {
      if (distanceKm < 10 && elevationGain < 100) return 'Easy';
      if (distanceKm < 25 && elevationGain < 300) return 'Moderate';
      if (distanceKm < 50 && elevationGain < 800) return 'Hard';
      return 'Expert';
    } else {
      // Running/hiking
      if (distanceKm < 3 && elevationGain < 50) return 'Easy';
      if (distanceKm < 8 && elevationGain < 200) return 'Moderate';
      if (distanceKm < 15 && elevationGain < 500) return 'Hard';
      return 'Expert';
    }
  };

  // Estimate duration based on sport and terrain
  const estimateDuration = (distanceKm: number, elevationGain: number, sportType: string): string => {
    const sportLower = sportType.toLowerCase();
    let baseSpeed: number; // km/h
    
    if (sportLower === 'cycling') {
      baseSpeed = 20; // Base cycling speed (12.4 mph)
      const elevationPenalty = elevationGain * 0.01; // 1% slower per 100m elevation
      baseSpeed *= (1 - elevationPenalty);
    } else if (sportLower === 'running') {
      baseSpeed = 9.66; // Base running speed (6 mph)
      const elevationPenalty = elevationGain * 0.02; // 2% slower per 100m elevation
      baseSpeed *= (1 - elevationPenalty);
    } else {
      // Walking/hiking
      baseSpeed = 4.83; // Base walking speed (3 mph)
      const elevationPenalty = elevationGain * 0.025; // 2.5% slower per 100m elevation for hiking
      baseSpeed *= (1 - elevationPenalty);
    }
    
    const hours = distanceKm / Math.max(baseSpeed, 3); // Minimum 3 km/h
    const minutes = Math.round(hours * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
  };

  const getSportColor = (sportType: string): string => {
    const colors = {
      'cycling': '#3b82f6',
      'running': '#ef4444', 
      'hiking': '#10b981',
      'walking': '#6b7280'
    };
    return colors[sportType.toLowerCase() as keyof typeof colors] || '#6b7280';
  };

  const calculateElevationGain = (elevations: number[]): number => {
    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1];
      if (diff > 0) gain += diff;
    }
    return gain;
  };

  const calculateElevationLoss = (elevations: number[]): number => {
    let loss = 0;
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i - 1] - elevations[i];
      if (diff > 0) loss += diff;
    }
    return loss;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;

    loadGoogleMapsApi(apiKey).then(() => {
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
      elevationServiceRef.current = new google.maps.ElevationService();
      // Suppress default markers and info windows to avoid car icon and route info box
      directionsRendererRef.current = new google.maps.DirectionsRenderer({ 
        map, 
        suppressMarkers: true,
        suppressInfoWindows: true, // This hides the route info box with car icon
        preserveViewport: true
      });
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

          // Get elevation data first
          let elevation = 0;
          if (elevationServiceRef.current) {
            try {
              const elevationResult = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
                elevationServiceRef.current!.getElevationForLocations({
                  locations: [{ lat, lng }]
                }, (results, status) => {
                  if (status === 'OK' && results) {
                    resolve(results);
                  } else {
                    reject(new Error(`Elevation request failed: ${status}`));
                  }
                });
              });
              elevation = elevationResult[0]?.elevation || 0;
            } catch (error) {
              console.warn('Failed to get elevation data:', error);
            }
          }

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
                elevation,
              };

              // Create enhanced marker with sport-specific color
              const marker = new google.maps.Marker({
                position: { lat, lng },
                map,
                draggable: true,
                label: {
                  text: String(newIndex + 1),
                  color: 'white',
                  fontWeight: 'bold',
                },
                title: `Waypoint ${newIndex + 1}\nElevation: ${Math.round(elevation)}m`,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: getSportColor(sport),
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
              
              // Calculate and analyze route
              setTimeout(() => {
                if (updated.length >= 2) {
                  analyzeRoute(updated);
                } else if (directionsServiceRef.current && directionsRendererRef.current) {
                  calculateRouteWithServices(updated, directionsServiceRef.current, directionsRendererRef.current);
                }
              }, 100);
              
              toast.success(`Waypoint ${updated.length} added (${Math.round(elevation)}m elevation)`);
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

  // Analyze route with elevation data
  const analyzeRoute = async (points: Waypoint[]) => {
    if (points.length < 2 || !elevationServiceRef.current || !directionsServiceRef.current) return;
    
    setIsAnalyzing(true);
    
    try {
      // Calculate route using Google Directions
      const origin = { lat: centerLat, lng: centerLng };
      const waypoints_gm = points.map(p => ({
        location: { lat: p.lat, lng: p.lng },
        stopover: true
      }));

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsServiceRef.current!.route({
          origin,
          destination: origin,
          waypoints: waypoints_gm,
          optimizeWaypoints: true,
          travelMode: getTravelMode(sport),
        }, (result, status) => {
          if (status === 'OK' && result) {
            resolve(result);
          } else {
            reject(new Error(`Route calculation failed: ${status}`));
          }
        });
      });

      // Extract route path for elevation analysis
      const routePath: google.maps.LatLng[] = [];
      result.routes[0].legs.forEach(leg => {
        leg.steps.forEach(step => {
          step.path?.forEach(point => routePath.push(point));
        });
      });

      // Get elevation profile along the route
      const elevationResult = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
        elevationServiceRef.current!.getElevationAlongPath({
          path: routePath,
          samples: 50
        }, (results, status) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`Elevation request failed: ${status}`));
          }
        });
      });

      const elevations = elevationResult.map(point => point.elevation);
      setElevationProfile(elevations);

      // Calculate route analysis
      const totalDistance = result.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
      const distanceKm = totalDistance / 1000;
      const distanceMiles = totalDistance / 1609.34;
      
      const maxElevation = Math.max(...elevations);
      const minElevation = Math.min(...elevations);
      const elevationGain = calculateElevationGain(elevations);
      const elevationLoss = calculateElevationLoss(elevations);
      const avgGradient = (elevationGain / (distanceKm * 1000)) * 100;
      
      const difficulty = calculateDifficulty(distanceKm, elevationGain, sport);
      const duration = estimateDuration(distanceKm, elevationGain, sport);
      
      const analysis: RouteAnalysis = {
        distance: `${distanceMiles.toFixed(2)} mi (${distanceKm.toFixed(2)} km)`,
        duration,
        elevationGain: Math.round(elevationGain),
        elevationLoss: Math.round(elevationLoss),
        difficulty,
        maxElevation: Math.round(maxElevation),
        minElevation: Math.round(minElevation),
        avgGradient: Number(avgGradient.toFixed(1))
      };
      
      setRouteAnalysis(analysis);
      
      // Draw route on map
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      
      polylineRef.current = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: getSportColor(sport),
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: mapInstanceRef.current,
      });
      
    } catch (error) {
      console.error('Route analysis failed:', error);
      toast.error('Failed to analyze route');
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      // Ensure we use the correct travel mode - not DRIVING
      let mode: google.maps.TravelMode;
      const sportLower = sport.toLowerCase();
      if (sportLower === 'cycling') {
        mode = google.maps.TravelMode.BICYCLING;
      } else if (sportLower === 'running' || sportLower === 'hiking' || sportLower === 'walking') {
        mode = google.maps.TravelMode.WALKING;
      } else {
        // Default to WALKING, never DRIVING
        mode = google.maps.TravelMode.WALKING;
        console.warn(`⚠️ Unknown sport "${sport}", defaulting to WALKING mode`);
      }

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

    if (!routeAnalysis) {
      toast.error('Route analysis not complete. Please wait for analysis to finish.');
      return;
    }

    console.log('💾 Saving enhanced route with analysis:', { waypoints: waypoints.length, analysis: routeAnalysis });

    const routeData = {
      path: waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
      distance: routeAnalysis.distance,
      name: `${sport} route`,
      analysis: routeAnalysis
    };

    onRouteSave(routeData);
    toast.success('Enhanced route saved with elevation analysis!');
  };

  const clearAll = () => {
    waypoints.forEach(wp => {
      if (wp.marker) {
        wp.marker.setMap(null);
      }
    });
    setWaypoints([]);
    setRouteAnalysis(null);
    setElevationProfile([]);
    if (directionsRendererRef.current) {
      try {
        directionsRendererRef.current.setDirections({ routes: [] } as any);
      } catch (error) {
        console.warn('Error clearing directions:', error);
      }
    }
    // Clear custom polyline too
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click on the map to add waypoints for your {sport} route. Advanced elevation analysis included.
      </p>
      
      <div className="border rounded-lg overflow-hidden">
        <div ref={mapRef} className="aspect-video w-full" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-sm text-muted-foreground">Loading enhanced map...</div>
          </div>
        )}
      </div>

      {/* Route Analysis */}
      {routeAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Route Analysis
              {isAnalyzing && <div className="text-sm text-muted-foreground">Analyzing...</div>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <Route className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-semibold">{routeAnalysis.distance}</p>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">Est. Time</p>
                <p className="font-semibold">{routeAnalysis.duration}</p>
              </div>
              <div className="text-center">
                <Mountain className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground">Elevation Gain</p>
                <p className="font-semibold">{routeAnalysis.elevationGain}m</p>
              </div>
              <div className="text-center">
                <Badge className={getDifficultyColor(routeAnalysis.difficulty)}>
                  {routeAnalysis.difficulty}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Difficulty</p>
              </div>
            </div>
            
            {/* Elevation Profile */}
            {elevationProfile.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Elevation Profile</h4>
                <div className="h-20 w-full bg-gradient-to-r from-green-100 to-red-100 rounded-lg p-2 relative">
                  <svg className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke={getSportColor(sport)}
                      strokeWidth="2"
                      points={elevationProfile.map((elevation, index) => {
                        const x = (index / (elevationProfile.length - 1)) * 100;
                        const normalizedElevation = ((elevation - routeAnalysis.minElevation) / 
                          (routeAnalysis.maxElevation - routeAnalysis.minElevation)) * 80 + 10;
                        return `${x},${100 - normalizedElevation}`;
                      }).join(' ')}
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Start</span>
                  <span>Avg Gradient: {routeAnalysis.avgGradient}%</span>
                  <span>End</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                {wp.elevation && (
                  <span className="text-muted-foreground">{Math.round(wp.elevation)}m</span>
                )}
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

