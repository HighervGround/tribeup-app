/**
 * Google Maps Routes API (v2) - Next generation routing with better optimization
 * Uses REST API for route calculation
 */

interface RouteWaypoint {
  location: {
    latLng: {
      latitude: number;
      longitude: number;
    };
  };
}

interface RoutesApiRequest {
  origin: {
    location: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  };
  destination: {
    location: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  };
  intermediates?: RouteWaypoint[];
  travelMode: 'DRIVE' | 'BICYCLE' | 'WALK' | 'TWO_WHEELER';
  routingPreference?: 'TRAFFIC_AWARE' | 'TRAFFIC_AWARE_OPTIMAL';
  computeAlternativeRoutes?: boolean;
  optimizeWaypointOrder?: 'WAYPOINT_ORDER_OPTIMIZATION';
  polylineEncoding?: 'ENCODED_POLYLINE' | 'GEO_JSON_LINESTRING';
}

interface RoutesApiResponse {
  routes: Array<{
    distanceMeters: number;
    duration: string;
    polyline: {
      encodedPolyline: string;
    };
    legs: Array<{
      distanceMeters: number;
      duration: string;
      startLocation: { latLng: { latitude: number; longitude: number } };
      endLocation: { latLng: { latitude: number; longitude: number } };
      steps: Array<{
        distanceMeters: number;
        duration: string;
        polyline: { encodedPolyline: string };
        startLocation: { latLng: { latitude: number; longitude: number } };
        endLocation: { latLng: { latitude: number; longitude: number } };
      }>;
    }>;
    routeLabels: string[];
  }>;
}

export async function computeRoute(
  apiKey: string,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints: Array<{ lat: number; lng: number }>,
  travelMode: 'cycling' | 'running' | 'walking' | 'driving' = 'walking',
  optimizeWaypoints: boolean = true
): Promise<RoutesApiResponse> {
  const routeModeMap: Record<string, 'DRIVE' | 'BICYCLE' | 'WALK' | 'TWO_WHEELER'> = {
    cycling: 'BICYCLE',
    running: 'WALK',
    walking: 'WALK',
    driving: 'DRIVE',
  };

  const request: RoutesApiRequest = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    travelMode: routeModeMap[travelMode.toLowerCase()] || 'WALK',
    routingPreference: 'TRAFFIC_AWARE',
    polylineEncoding: 'ENCODED_POLYLINE',
  };

  if (waypoints.length > 0) {
    request.intermediates = waypoints.map((wp) => ({
      location: {
        latLng: {
          latitude: wp.lat,
          longitude: wp.lng,
        },
      },
    }));

    if (optimizeWaypoints) {
      request.optimizeWaypointOrder = 'WAYPOINT_ORDER_OPTIMIZATION';
    }
  }

  const response = await fetch(
    `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.routeLabels',
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Routes API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

/**
 * Decode Google's encoded polyline to array of lat/lng points
 */
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const poly: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return poly;
}

