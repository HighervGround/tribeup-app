export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
  isOutdoorFriendly: boolean;
  alerts?: string[];
}

export class WeatherService {
  private static readonly BASE_URL = 'https://api.weatherapi.com/v1';
  private static readonly API_KEY = (import.meta as any).env?.VITE_WEATHERAPI_KEY;

  // Get current weather for coordinates
  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    if (!this.API_KEY) {
      console.warn('WeatherAPI key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/current.json?key=${this.API_KEY}&q=${lat},${lng}&aqi=no`
      );

      if (!response.ok) {
        console.error(`WeatherAPI current error: ${response.status} ${response.statusText}`);
        return this.getMockWeatherData();
      }

      const data = await response.json();
      return this.transformCurrentWeatherData(data);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return this.getMockWeatherData();
    }
  }

  // Get weather forecast for game time
  static async getGameWeather(lat: number, lng: number, gameDateTime: Date): Promise<WeatherData | null> {
    if (!this.API_KEY) {
      console.warn('WeatherAPI key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      console.log(`🌤️ Fetching weather for coordinates: ${lat}, ${lng}`);
      console.log(`🕐 Game time: ${gameDateTime.toISOString()}`);
      
      // Check if game is in the past (more than 1 hour ago)
      const now = new Date();
      const hoursDiff = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < -1) {
        console.log(`⏰ Game was ${Math.abs(hoursDiff).toFixed(1)} hours ago - using current weather`);
        const currentWeather = await this.getCurrentWeather(lat, lng);
        if (currentWeather) {
          return {
            ...currentWeather,
            description: `Current conditions (game was ${Math.abs(hoursDiff).toFixed(0)}h ago)`,
            alerts: [`Game was ${Math.abs(hoursDiff).toFixed(0)} hours ago - showing current weather conditions`]
          };
        }
      }

      // For future games, get forecast
      const days = Math.max(1, Math.ceil(hoursDiff / 24) + 1); // Get enough days to cover the game
      
      const response = await fetch(
        `${this.BASE_URL}/forecast.json?key=${this.API_KEY}&q=${lat},${lng}&days=${days}&aqi=no&alerts=yes`
      );

      if (!response.ok) {
        console.error(`WeatherAPI forecast error: ${response.status} ${response.statusText}`);
        return await this.getCurrentWeather(lat, lng);
      }

      const data = await response.json();
      return this.findBestForecastMatch(data, gameDateTime);
    } catch (error) {
      console.error('Error fetching game weather:', error);
      return this.getMockWeatherData();
    }
  }

  // Get weather by zipcode (fallback method)
  static async getWeatherByZipcode(zipcode: string, gameDateTime: Date): Promise<WeatherData | null> {
    if (!this.API_KEY) {
      console.warn('WeatherAPI key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      const hoursDiff = (gameDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < -1) {
        // Past game - get current weather
        const response = await fetch(
          `${this.BASE_URL}/current.json?key=${this.API_KEY}&q=${zipcode}&aqi=no`
        );
        
        if (response.ok) {
          const data = await response.json();
          const weather = this.transformCurrentWeatherData(data);
          return {
            ...weather,
            description: `Current conditions (game was ${Math.abs(hoursDiff).toFixed(0)}h ago)`,
            alerts: [`Game was ${Math.abs(hoursDiff).toFixed(0)} hours ago - showing current weather conditions`]
          };
        }
      } else {
        // Future game - get forecast
        const days = Math.max(1, Math.ceil(hoursDiff / 24) + 1);
        
        const response = await fetch(
          `${this.BASE_URL}/forecast.json?key=${this.API_KEY}&q=${zipcode}&days=${days}&aqi=no&alerts=yes`
        );
        
        if (response.ok) {
          const data = await response.json();
          return this.findBestForecastMatch(data, gameDateTime);
        }
      }
      
      return this.getMockWeatherData();
    } catch (error) {
      console.error('Error fetching weather by zipcode:', error);
      return this.getMockWeatherData();
    }
  }

  // Transform WeatherAPI current weather data to our format
  private static transformCurrentWeatherData(data: any): WeatherData {
    const current = data.current;
    const temp = Math.round(current.temp_f);
    
    return {
      temperature: temp,
      condition: current.condition.text,
      description: current.condition.text,
      humidity: current.humidity,
      windSpeed: Math.round(current.wind_mph),
      precipitation: current.precip_in || 0,
      icon: this.getWeatherIcon(current.condition.text),
      isOutdoorFriendly: this.isOutdoorFriendly(temp, current.condition.text, current.wind_mph),
      alerts: data.alerts?.alert?.map((alert: any) => alert.headline) || []
    };
  }

  // Find the best forecast match for game time
  private static findBestForecastMatch(data: any, gameDateTime: Date): WeatherData {
    const gameTime = gameDateTime.getTime();
    
    // Look through forecast days and hours to find closest match
    let bestMatch = null;
    let smallestDiff = Infinity;
    
    for (const day of data.forecast.forecastday) {
      // Check hourly forecasts for this day
      for (const hour of day.hour) {
        const hourTime = new Date(hour.time).getTime();
        const diff = Math.abs(hourTime - gameTime);
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          bestMatch = hour;
        }
      }
    }
    
    if (bestMatch) {
      const temp = Math.round(bestMatch.temp_f);
      const timeDiff = smallestDiff / (1000 * 60 * 60);
      
      console.log(`🎯 Found forecast match: ${new Date(bestMatch.time).toISOString()} (${timeDiff.toFixed(1)}h from game)`);
      
      return {
        temperature: temp,
        condition: bestMatch.condition.text,
        description: bestMatch.condition.text,
        humidity: bestMatch.humidity,
        windSpeed: Math.round(bestMatch.wind_mph),
        precipitation: bestMatch.precip_in || 0,
        icon: this.getWeatherIcon(bestMatch.condition.text),
        isOutdoorFriendly: this.isOutdoorFriendly(temp, bestMatch.condition.text, bestMatch.wind_mph),
        alerts: data.alerts?.alert?.map((alert: any) => alert.headline) || []
      };
    }
    
    // Fallback to day forecast if no hourly match
    const dayForecast = data.forecast.forecastday[0].day;
    const temp = Math.round(dayForecast.avgtemp_f);
    
    return {
      temperature: temp,
      condition: dayForecast.condition.text,
      description: dayForecast.condition.text,
      humidity: dayForecast.avghumidity,
      windSpeed: Math.round(dayForecast.maxwind_mph),
      precipitation: dayForecast.totalprecip_in || 0,
      icon: this.getWeatherIcon(dayForecast.condition.text),
      isOutdoorFriendly: this.isOutdoorFriendly(temp, dayForecast.condition.text, dayForecast.maxwind_mph),
      alerts: data.alerts?.alert?.map((alert: any) => alert.headline) || []
    };
  }

  // Get weather icon based on condition
  private static getWeatherIcon(condition: string): string {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('partly cloudy')) return '⛅';
    if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) return '☁️';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return '⛈️';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
    if (conditionLower.includes('wind')) return '💨';
    
    return '🌤️'; // Default
  }

  // Determine if conditions are outdoor friendly
  private static isOutdoorFriendly(temp: number, condition: string, windSpeed: number): boolean {
    const conditionLower = condition.toLowerCase();
    
    // Temperature check (40-90°F is comfortable)
    if (temp < 40 || temp > 90) return false;
    
    // Wind check (over 25 mph is too windy)
    if (windSpeed > 25) return false;
    
    // Precipitation check
    if (conditionLower.includes('rain') || 
        conditionLower.includes('storm') || 
        conditionLower.includes('snow') ||
        conditionLower.includes('drizzle')) return false;
    
    return true;
  }

  // Extract zipcode from location string
  static extractZipcode(location: string): string | null {
    const zipcodeRegex = /\b\d{5}(-\d{4})?\b/;
    const match = location.match(zipcodeRegex);
    return match ? match[0] : null;
  }

  // Get weather recommendation text
  static getWeatherRecommendation(weather: WeatherData): string {
    if (weather.isOutdoorFriendly) {
      return 'Perfect conditions for outdoor sports! 🌟';
    }
    
    const recommendations = [];
    
    if (weather.temperature < 40) {
      recommendations.push('Dress warmly - temperatures are quite cold');
    } else if (weather.temperature > 90) {
      recommendations.push('Stay hydrated - it\'s very hot outside');
    }
    
    if (weather.windSpeed > 15) {
      recommendations.push('Expect windy conditions');
    }
    
    if (weather.precipitation > 0) {
      recommendations.push('Bring rain gear or consider indoor alternatives');
    }
    
    return recommendations.length > 0 
      ? recommendations.join('. ') + '.'
      : 'Check current conditions before heading out.';
  }

  // Mock weather data fallback
  private static getMockWeatherData(): WeatherData {
    return {
      temperature: 72,
      condition: 'Partly Cloudy',
      description: 'Weather data temporarily unavailable',
      humidity: 65,
      windSpeed: 8,
      precipitation: 0,
      icon: '🌤️',
      isOutdoorFriendly: true,
      alerts: ['Weather forecast unavailable - using default conditions']
    };
  }
}
