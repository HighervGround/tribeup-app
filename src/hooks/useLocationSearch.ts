import { useState, useCallback, useEffect } from 'react';

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

// Declare global Google Maps types
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export function useLocationSearch() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  const GOOGLE_API_KEY = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY || 'AIzaSyATPbnuTvpYDDY0vLrKy0IoS80A27rpq-4';
  
  // Debug API key on component mount
  useEffect(() => {
    console.log('🔑 API Key status:', {
      hasKey: !!GOOGLE_API_KEY,
      keyLength: GOOGLE_API_KEY?.length,
      keyPrefix: GOOGLE_API_KEY?.substring(0, 10) + '...',
      envVars: Object.keys((import.meta as any).env || {}).filter(k => k.includes('GOOGLE'))
    });
  }, [GOOGLE_API_KEY]);

  // Using new Google Places API (Text Search) with OpenStreetMap fallback
  useEffect(() => {
    console.log('🌐 Using new Google Places API with OpenStreetMap fallback');
    setGoogleMapsLoaded(false); // Not using SDK, using REST API directly
  }, []);

  // Geocoding using Google Geocoding API (v3 is still supported)
  const geocodeLocation = useCallback(async (address: string): Promise<Coordinates | null> => {
    try {
      console.log('🌍 Geocoding address with Google:', address);
      
      // Try Google Geocoding API first
      if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'demo_key') {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('🌍 Google Geocoding response:', data);
          
          if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            const coords = {
              lat: location.lat,
              lng: location.lng
            };
            console.log('✅ Google geocoded coordinates:', coords);
            return coords;
          }
        } else {
          console.log('⚠️ Google Geocoding API error:', response.status);
        }
      }
      
      // Fallback to OpenStreetMap
      console.log('🗺️ Falling back to OpenStreetMap geocoding...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'TribeUp Sports App'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      console.log('🌍 OpenStreetMap geocoding response:', data);
      
      if (data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        console.log('✅ OpenStreetMap geocoded coordinates:', coords);
        return coords;
      }
      
      console.log('⚠️ No geocoding results found');
      return null;
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  }, [GOOGLE_API_KEY]);

  // Search for location suggestions with proximity bias
  const searchLocations = useCallback(async (query: string, userLat?: number, userLng?: number) => {
    console.log('🔍 searchLocations called with:', { query, userLat, userLng, queryLength: query?.length });
    
    if (!query.trim()) {
      console.log('❌ Empty query, clearing suggestions');
      setSuggestions([]);
      return;
    }

    console.log('🔍 Starting location search for:', query);
    setLoading(true);
    
    // Fallback function for OpenStreetMap
    const tryOpenStreetMapSearch = async () => {
      try {
        console.log('🗺️ Trying OpenStreetMap for query:', query);
        let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        
        if (userLat && userLng) {
          searchUrl += `&lat=${userLat}&lon=${userLng}&bounded=1&viewbox=${userLng-0.1},${userLat+0.1},${userLng+0.1},${userLat-0.1}`;
          console.log('📍 Added location bias to OpenStreetMap search');
        }
        
        console.log('📡 OpenStreetMap URL:', searchUrl);
        
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'TribeUp Sports App'
          }
        });
        
        console.log('📥 OpenStreetMap response status:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ OpenStreetMap response data:', data);
          
          if (data && data.length > 0) {
            const suggestions: LocationSuggestion[] = data.map((place: any, index: number) => ({
              place_id: place.place_id || `osm-${index}`,
              description: place.display_name,
              structured_formatting: {
                main_text: place.name || place.display_name.split(',')[0],
                secondary_text: place.display_name.split(',').slice(1, 3).join(',').trim()
              }
            }));

            console.log('🎯 OpenStreetMap suggestions processed:', suggestions);
            setSuggestions(suggestions);
            return;
          } else {
            console.log('⚠️ OpenStreetMap returned empty results for query:', query);
          }
        } else {
          console.log('❌ OpenStreetMap API error:', response.status, response.statusText);
          const errorText = await response.text();
          console.log('❌ Error details:', errorText);
        }
      } catch (error) {
        console.error('❌ OpenStreetMap search error:', error);
      }
      
      // If all APIs fail
      console.log('❌ All location APIs failed, showing no suggestions');
      setSuggestions([]);
    };
    
    try {
      // Try new Google Places API first (Text Search)
      if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'demo_key' && GOOGLE_API_KEY !== 'your_anon_key_here') {
        console.log('🌐 Trying new Google Places API (Text Search)...');
        
        const requestBody = {
          textQuery: query,
          maxResultCount: 5,
          locationBias: userLat && userLng ? {
            circle: {
              center: { latitude: userLat, longitude: userLng },
              radius: 50000
            }
          } : undefined
        };
        
        console.log('📤 Google Places API request:', requestBody);
        
        const response = await fetch(
          `https://places.googleapis.com/v1/places:searchText`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
            },
            body: JSON.stringify(requestBody)
          }
        );
        
        console.log('📥 Google Places API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Google Places API response:', data);
          
          if (data.places && data.places.length > 0) {
            const suggestions: LocationSuggestion[] = data.places.map((place: any, index: number) => {
              const displayName = place.displayName?.text || '';
              const formattedAddress = place.formattedAddress || '';
              
              // Prioritize display name for description, but include address context if needed
              const description = displayName ? 
                (formattedAddress ? `${displayName}, ${formattedAddress}` : displayName) :
                formattedAddress || 'Unknown location';
              
              return {
                place_id: place.id || `google-${index}`,
                description: description,
                structured_formatting: {
                  main_text: displayName || formattedAddress?.split(',')[0] || 'Unknown',
                  secondary_text: formattedAddress || ''
                }
              };
            });
            
            console.log('🎯 Google Places API suggestions:', suggestions);
            setSuggestions(suggestions);
            setLoading(false);
            return;
          } else {
            console.log('⚠️ Google Places API returned no results');
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Google Places API error:', response.status, errorText);
        }
      }
      
      // Fallback to OpenStreetMap if Google fails
      console.log('🗺️ Falling back to OpenStreetMap...');
      await tryOpenStreetMapSearch();
      
    } catch (error) {
      console.error('❌ Location search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed for OpenStreetMap

  // Debug function for testing in browser console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugLocationSearch = async (query: string) => {
        console.log('🧪 Debug location search for:', query);
        await searchLocations(query);
      };
    }
  }, [searchLocations]);

  return {
    suggestions,
    loading,
    searchLocations,
    geocodeLocation
  };
}
