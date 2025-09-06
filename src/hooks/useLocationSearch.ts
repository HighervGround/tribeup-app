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

  // Simple geocoding using browser's built-in APIs or fallback
  const geocodeLocation = useCallback(async (address: string): Promise<Coordinates | null> => {
    try {
      // For now, we'll use a simple approach with OpenStreetMap Nominatim
      // In production, you'd want to use Google Places API or similar
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
  }, []);

  // Search for location suggestions with proximity bias
  const searchLocations = useCallback(async (query: string, userLat?: number, userLng?: number) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Use OpenStreetMap Nominatim for real location search
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
      // Add proximity bias if user location is available
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
  }, []);

  return {
    suggestions,
    loading,
    searchLocations,
    geocodeLocation
  };
}
