import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, Cloud, AlertTriangle } from 'lucide-react';
import { WeatherService, WeatherData } from '@/domains/weather/services/weatherService';

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  location: string;
  gameDateTime: Date;
  className?: string;
}

export function WeatherWidget({ 
  latitude, 
  longitude, 
  location, 
  gameDateTime, 
  className = '' 
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let weatherData: WeatherData | null = null;
        let finalLat = latitude;
        let finalLng = longitude;
        
        // If we don't have coordinates, use Google Geocoding API for precise location
        if ((!latitude || !longitude) && location) {
          console.log(`🗺️ Using Google Geocoding for location: ${location}`);
          const googleApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
          
          if (googleApiKey) {
            try {
              const geocodeResponse = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleApiKey}`
              );
              
              if (geocodeResponse.ok) {
                const geocodeData = await geocodeResponse.json();
                console.log('🗺️ Google geocoding results:', geocodeData);
                
                if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
                  finalLat = geocodeData.results[0].geometry.location.lat;
                  finalLng = geocodeData.results[0].geometry.location.lng;
                  console.log(`🎯 Google Maps coordinates: ${finalLat}, ${finalLng}`);
                  
                  // Also get the formatted address for better accuracy
                  const formattedAddress = geocodeData.results[0].formatted_address;
                  console.log(`📍 Formatted address: ${formattedAddress}`);
                } else {
                  console.warn('🗺️ Google geocoding failed:', geocodeData.status, geocodeData.error_message);
                }
              } else {
                console.error('🗺️ Google geocoding HTTP error:', geocodeResponse.status);
              }
            } catch (geocodeError) {
              console.error('❌ Google geocoding error:', geocodeError);
            }
          } else {
            console.warn('🗺️ Google Maps API key not available');
          }
        }
        
        // Now fetch weather with the best coordinates we have
        if (finalLat && finalLng) {
          console.log(`🌤️ Fetching weather for coordinates: ${finalLat}, ${finalLng}`);
          console.log(`🕐 Game time: ${gameDateTime.toISOString()} (${gameDateTime.toLocaleString()})`);
          console.log(`🕐 Current time: ${new Date().toISOString()} (${new Date().toLocaleString()})`);
          
          const hoursDiff = (gameDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
          console.log(`⏰ Game is ${hoursDiff > 0 ? `in ${Math.round(hoursDiff)} hours` : `${Math.round(Math.abs(hoursDiff))} hours ago`}`);
          
          // Also get current weather for comparison
          const currentWeather = await WeatherService.getCurrentWeather(finalLat, finalLng);
          console.log(`🌡️ CURRENT weather: ${currentWeather?.temperature}°F, ${currentWeather?.condition} - ${currentWeather?.description}`);
          
          weatherData = await WeatherService.getGameWeather(finalLat, finalLng, gameDateTime);
          
          if (weatherData) {
            console.log(`🎯 GAME weather: ${weatherData.temperature}°F, ${weatherData.condition} - ${weatherData.description}`);
            console.log(`📍 Compare with: https://openweathermap.org/find?q=${finalLat},${finalLng}`);
          }
        }
        
        // Fallback to zipcode extraction if coordinates failed
        if (!weatherData && location) {
          const zipcode = WeatherService.extractZipcode(location);
          if (zipcode) {
            console.log(`🌤️ Fallback: Using zipcode ${zipcode}`);
            weatherData = await WeatherService.getWeatherByZipcode(zipcode, gameDateTime);
          }
        }
        
        // Final fallback to mock data
        if (!weatherData) {
          console.warn('🌤️ Using mock weather data - no valid location found');
          weatherData = {
            temperature: 72,
            condition: 'Clear',
            description: 'Weather data unavailable for this location',
            humidity: 65,
            windSpeed: 8,
            precipitation: 0,
            icon: '🌤️',
            isOutdoorFriendly: true,
          };
        }
        
        setWeather(weatherData);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have location data
    if (location) {
      fetchWeather();
    } else {
      setLoading(false);
      setError('Location not available');
    }
  }, [latitude, longitude, location, gameDateTime]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cloud className="w-4 h-4" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading weather...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cloud className="w-4 h-4" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            {error || 'Weather data unavailable'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getGameTimeText = () => {
    const now = new Date();
    const timeDiff = gameDateTime.getTime() - now.getTime();
    const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));
    
    if (hoursDiff < 0) {
      return 'Game time';
    } else if (hoursDiff < 24) {
      return `In ${hoursDiff} hours`;
    } else {
      const daysDiff = Math.round(hoursDiff / 24);
      return `In ${daysDiff} days`;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Cloud className="w-4 h-4" />
          Weather Forecast
          <Badge variant="outline" className="ml-auto text-xs">
            {getGameTimeText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main Weather Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{weather.icon}</span>
            <div>
              <div className="font-semibold">{weather.temperature}°F</div>
              <div className="text-sm text-muted-foreground">{weather.description}</div>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Humidity: {weather.humidity}%</div>
            <div>Wind: {weather.windSpeed} mph</div>
          </div>
        </div>

        {/* Outdoor Friendly Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={weather.isOutdoorFriendly ? "default" : "destructive"}
            className="text-xs"
          >
            {weather.isOutdoorFriendly ? '✅ Good for outdoor sports' : '⚠️ Check conditions'}
          </Badge>
        </div>


        {/* Weather Recommendation */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          {WeatherService.getWeatherRecommendation(weather)}
        </div>
      </CardContent>
    </Card>
  );
}
