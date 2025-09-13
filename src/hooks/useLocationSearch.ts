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

    console.log('🔍 Starting location search for:', query);
    setLoading(true);
    
    try {
      // Try Google Places API (Legacy) first - more stable
      if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'demo_key' && GOOGLE_API_KEY !== 'your_anon_key_here') {
        console.log('🌐 Trying Google Places API...');
        let placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
        
        // Add location bias if available
        if (userLat && userLng) {
          placesUrl += `&location=${userLat},${userLng}&radius=50000`;
        }

        console.log('📡 Google Places URL:', placesUrl);
        const response = await fetch(placesUrl);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Google Places response:', data);
          
          if (data.predictions && data.predictions.length > 0) {
            const suggestions: LocationSuggestion[] = data.predictions.map((place: any) => ({
              place_id: place.place_id,
              description: place.description,
              structured_formatting: {
                main_text: place.structured_formatting?.main_text || place.description.split(',')[0],
                secondary_text: place.structured_formatting?.secondary_text || place.description.split(',').slice(1).join(',').trim()
              }
            }));
            console.log('🎯 Google Places suggestions:', suggestions);
            setSuggestions(suggestions);
            setLoading(false);
            return;
          } else {
            console.log('⚠️ Google Places returned no predictions');
          }
        } else {
          console.log('❌ Google Places API error:', response.status, response.statusText);
        }
      } else {
        console.log('⚠️ Google API key not available or invalid:', GOOGLE_API_KEY);
      }
      
      // Fallback to OpenStreetMap
      console.log('🗺️ Trying OpenStreetMap...');
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
      if (userLat && userLng) {
        searchUrl += `&lat=${userLat}&lon=${userLng}&bounded=1&viewbox=${userLng-0.1},${userLat+0.1},${userLng+0.1},${userLat-0.1}`;
      }
      
      console.log('📡 OpenStreetMap URL:', searchUrl);
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenStreetMap response:', data);
        
        const suggestions: LocationSuggestion[] = data.map((place: any, index: number) => ({
          place_id: place.place_id || `osm-${index}`,
          description: place.display_name,
          structured_formatting: {
            main_text: place.name || place.display_name.split(',')[0],
            secondary_text: place.display_name.split(',').slice(1, 3).join(',').trim()
          }
        }));

        console.log('🎯 OpenStreetMap suggestions:', suggestions);
        setSuggestions(suggestions);
        setLoading(false);
        return;
      } else {
        console.log('❌ OpenStreetMap API error:', response.status, response.statusText);
      }
      
      // If both APIs fail, show a helpful message instead of mock suggestions
      console.log('❌ All location APIs failed, showing no suggestions');
      setSuggestions([]);
      
    } catch (error) {
      console.error('❌ Location search error:', error);
      // Don't show mock suggestions - just show empty
      setSuggestions([]);
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
