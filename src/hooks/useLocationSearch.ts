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

  // Search for location suggestions
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, we'll create mock suggestions
      // In production, integrate with Google Places API
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
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
