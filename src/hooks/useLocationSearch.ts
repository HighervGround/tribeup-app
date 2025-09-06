import { useState, useCallback } from 'react';

interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface Coordinates {
  lat: number;
  lng: number;
}

export function useLocationSearch() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const GOOGLE_API_KEY = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY || 'AIzaSyATPbnuTvpYDDY0vLrKy0IoS80A27rpq-4';

  // Simple geocoding using Google Places API or fallback
  const geocodeLocation = useCallback(async (address: string): Promise<Coordinates | null> => {
    try {
      // Try Google Geocoding API first
      if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'demo_key') {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
              lat: location.lat,
              lng: location.lng
            };
          }
        }
      }
      
      // Fallback to OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }, [GOOGLE_API_KEY]);

  // Search for location suggestions with proximity bias
  const searchLocations = useCallback(async (query: string, userLat?: number, userLng?: number) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Try Google Places API (New) first
      if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'demo_key') {
        let placesUrl = `https://places.googleapis.com/v1/places:autocomplete`;
        
        const requestBody = {
          input: query,
          ...(userLat && userLng && {
            locationBias: {
              circle: {
                center: { latitude: userLat, longitude: userLng },
                radius: 50000 // 50km radius
              }
            }
          })
        };

        const response = await fetch(placesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && data.suggestions.length > 0) {
            const suggestions: LocationSuggestion[] = data.suggestions.map((place: any, index: number) => ({
              place_id: place.placePrediction?.placeId || `google-${index}`,
              description: place.placePrediction?.text?.text || '',
              structured_formatting: {
                main_text: place.placePrediction?.structuredFormat?.mainText?.text || '',
                secondary_text: place.placePrediction?.structuredFormat?.secondaryText?.text || ''
              }
            }));
            setSuggestions(suggestions);
            setLoading(false);
            return;
          }
        }
      }
      
      // Fallback to OpenStreetMap
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
      if (userLat && userLng) {
        searchUrl += `&lat=${userLat}&lon=${userLng}&bounded=1&viewbox=${userLng-0.1},${userLat+0.1},${userLng+0.1},${userLat-0.1}`;
      }
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      const suggestions: LocationSuggestion[] = data.map((place: any, index: number) => ({
        place_id: place.place_id || `osm-${index}`,
        description: place.display_name,
        structured_formatting: {
          main_text: place.name || place.display_name.split(',')[0],
          secondary_text: place.display_name.split(',').slice(1, 3).join(',').trim()
        }
      }));

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Location search error:', error);
      // Fallback to mock suggestions
      const mockSuggestions: LocationSuggestion[] = [
        {
          place_id: '1',
          description: `${query} Community Center`,
          structured_formatting: {
            main_text: `${query} Community Center`,
            secondary_text: 'Recreation Center'
          }
        },
        {
          place_id: '2', 
          description: `${query} Park`,
          structured_formatting: {
            main_text: `${query} Park`,
            secondary_text: 'Public Park'
          }
        },
        {
          place_id: '3',
          description: `${query} Sports Complex`,
          structured_formatting: {
            main_text: `${query} Sports Complex`,
            secondary_text: 'Athletic Facility'
          }
        }
      ];
      setSuggestions(mockSuggestions);
    } finally {
      setLoading(false);
    }
  }, [GOOGLE_API_KEY]);

  return {
    suggestions,
    loading,
    searchLocations,
    geocodeLocation
  };
}
