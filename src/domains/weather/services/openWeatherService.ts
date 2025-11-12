import { env } from '@/core/config/envUtils';

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
  isOutdoorFriendly: boolean;
}

export class OpenWeatherService {
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static readonly API_KEY = env.OPENWEATHER_API_KEY;

  // Get current weather for coordinates
  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    if (!this.API_KEY) {
      console.warn('OpenWeatherMap API key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=imperial`
      );

      if (!response.ok) {
        console.error(`OpenWeatherMap current error: ${response.status} ${response.statusText}`);
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
      console.warn('OpenWeatherMap API key not configured, using mock data');
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
            description: `Current conditions (game was ${Math.abs(hoursDiff).toFixed(0)}h ago)`
          };
        }
      }

      // For future games, get 5-day forecast
      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=imperial`
      );

      if (!response.ok) {
        console.error(`OpenWeatherMap forecast error: ${response.status} ${response.statusText}`);
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
      console.warn('OpenWeatherMap API key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      const hoursDiff = (gameDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < -1) {
        // Past game - get current weather
        const response = await fetch(
          `${this.BASE_URL}/weather?zip=${zipcode}&appid=${this.API_KEY}&units=imperial`
        );
        
        if (response.ok) {
          const data = await response.json();
          const weather = this.transformCurrentWeatherData(data);
          return {
            ...weather,
            description: `Current conditions (game was ${Math.abs(hoursDiff).toFixed(0)}h ago)`
          };
        }
      } else {
        // Future game - get forecast
        const response = await fetch(
          `${this.BASE_URL}/forecast?zip=${zipcode}&appid=${this.API_KEY}&units=imperial`
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

  // Transform OpenWeatherMap current weather data to our format
  private static transformCurrentWeatherData(data: any): WeatherData {
    const main = data.main;
    const weather = data.weather[0];
    const wind = data.wind || {};
    const temp = Math.round(main.temp);
    
    return {
      temperature: temp,
      condition: weather.main,
      description: weather.description,
      humidity: main.humidity,
      windSpeed: Math.round(wind.speed || 0),
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      icon: this.getWeatherIcon(weather.main, weather.description),
      isOutdoorFriendly: this.isOutdoorFriendly(temp, weather.main, wind.speed || 0)
    };
  }

  // Find the best forecast match for game time
  private static findBestForecastMatch(data: any, gameDateTime: Date): WeatherData {
    console.log(`🎯 Looking for forecast match for: ${gameDateTime.toISOString()}`);
    
    // Look through forecast list to find closest match
    let bestMatch = null;
    let smallestDiff = Infinity;
    
    for (const forecast of data.list) {
      // Parse the forecast time
      const forecastTime = new Date(forecast.dt * 1000);
      const gameTime = gameDateTime.getTime();
      const diff = Math.abs(forecastTime.getTime() - gameTime);
      
      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestMatch = forecast;
        console.log(`⏰ Better match found: ${forecastTime.toISOString()} (diff: ${(diff / (1000 * 60 * 60)).toFixed(1)}h)`);
      }
    }
    
    if (bestMatch) {
      const temp = Math.round(bestMatch.main.temp);
      const timeDiff = smallestDiff / (1000 * 60 * 60);
      
      console.log(`🎯 Found forecast match: ${new Date(bestMatch.dt * 1000).toISOString()} (${timeDiff.toFixed(1)}h from game)`);
      
      return {
        temperature: temp,
        condition: bestMatch.weather[0].main,
        description: bestMatch.weather[0].description,
        humidity: bestMatch.main.humidity,
        windSpeed: Math.round(bestMatch.wind?.speed || 0),
        precipitation: bestMatch.rain?.['3h'] || bestMatch.snow?.['3h'] || 0,
        icon: this.getWeatherIcon(bestMatch.weather[0].main, bestMatch.weather[0].description),
        isOutdoorFriendly: this.isOutdoorFriendly(temp, bestMatch.weather[0].main, bestMatch.wind?.speed || 0)
      };
    }
    
    // Fallback to first forecast if no match
    const fallback = data.list[0];
    const temp = Math.round(fallback.main.temp);
    
    return {
      temperature: temp,
      condition: fallback.weather[0].main,
      description: fallback.weather[0].description,
      humidity: fallback.main.humidity,
      windSpeed: Math.round(fallback.wind?.speed || 0),
      precipitation: fallback.rain?.['3h'] || fallback.snow?.['3h'] || 0,
      icon: this.getWeatherIcon(fallback.weather[0].main, fallback.weather[0].description),
      isOutdoorFriendly: this.isOutdoorFriendly(temp, fallback.weather[0].main, fallback.wind?.speed || 0)
    };
  }

  // Get weather icon based on condition
  private static getWeatherIcon(main: string, description: string): string {
    const mainLower = main.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (mainLower === 'clear') return '☀️';
    if (mainLower === 'clouds') {
      if (descLower.includes('few')) return '🌤️';
      if (descLower.includes('scattered') || descLower.includes('broken')) return '⛅';
      return '☁️';
    }
    if (mainLower === 'rain' || mainLower === 'drizzle') return '🌧️';
    if (mainLower === 'snow') return '❄️';
    if (mainLower === 'thunderstorm') return '⛈️';
    if (mainLower === 'mist' || mainLower === 'fog') return '🌫️';
    if (mainLower === 'haze' || mainLower === 'dust') return '🌫️';
    
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
    if (conditionLower === 'rain' || 
        conditionLower === 'thunderstorm' || 
        conditionLower === 'snow' ||
        conditionLower === 'drizzle') return false;
    
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

  // Get enhanced weather recommendation with temperature trends and time-aware suggestions
  static async getEnhancedWeatherRecommendation(
    lat: number, 
    lng: number, 
    gameDateTime: Date, 
    duration: number = 60,
    sport: string = 'general'
  ): Promise<string> {
    if (!this.API_KEY) {
      return 'Weather data unavailable - dress appropriately for current conditions.';
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=imperial`
      );

      if (!response.ok) {
        return 'Weather data unavailable - dress appropriately for current conditions.';
      }

      const data = await response.json();
      const gameEndTime = new Date(gameDateTime.getTime() + (duration * 60 * 1000));
      
      // Get weather at start and end of game
      const startWeather = this.findBestForecastMatch(data, gameDateTime);
      const endWeather = this.findBestForecastMatch(data, gameEndTime);
      
      if (!startWeather || !endWeather) {
        return this.getWeatherRecommendation(startWeather || endWeather || this.getMockWeatherData());
      }

      return this.generateEnhancedRecommendations(startWeather, endWeather, gameDateTime, duration, sport);
    } catch (error) {
      console.error('Error generating enhanced weather recommendations:', error);
      return 'Weather data unavailable - dress appropriately for current conditions.';
    }
  }

  // Generate concise, actionable recommendations
  private static generateEnhancedRecommendations(
    startWeather: WeatherData,
    endWeather: WeatherData,
    gameDateTime: Date,
    _duration: number,
    sport: string
  ): string {
    const recommendations = [];
    const tempDrop = startWeather.temperature - endWeather.temperature;
    const avgTemp = (startWeather.temperature + endWeather.temperature) / 2;
    const isNightTime = gameDateTime.getHours() >= 18 || gameDateTime.getHours() <= 6;

    // Only show temperature drop if significant (>2°F)
    if (tempDrop > 2) {
      recommendations.push(`🌡️ ${tempDrop.toFixed(0)}°F drop expected - bring layers`);
    }

    // Concise clothing advice based on temperature
    if (avgTemp < 45) {
      recommendations.push('🧥 Dress warmly - multiple layers recommended');
    } else if (avgTemp >= 45 && avgTemp <= 60) {
      recommendations.push('👕 Light layers - long sleeves + removable jacket');
    }

    // Wind warning (only if significant)
    if (startWeather.windSpeed > 15 || endWeather.windSpeed > 15) {
      const maxWind = Math.max(startWeather.windSpeed, endWeather.windSpeed);
      recommendations.push(`💨 Windy (${maxWind.toFixed(0)} mph) - secure loose items`);
    }

    // Sport-specific tip (only one, most important)
    if ((sport.toLowerCase().includes('pickleball') || sport.toLowerCase().includes('tennis')) && avgTemp < 55) {
      recommendations.push('🏓 Ball bounces less in cold - adjust play');
    }

    // Night game essentials
    if (isNightTime && avgTemp < 55) {
      recommendations.push('🌙 Night + cool = extra warm-up needed');
    }

    // Default if no specific recommendations
    if (recommendations.length === 0) {
      return startWeather.isOutdoorFriendly ? 
        'Great conditions for outdoor play! 🌟' : 
        'Playable conditions - dress appropriately';
    }

    // Limit to max 3 recommendations
    return recommendations.slice(0, 3).join(' • ');
  }

  // Mock weather data fallback
  private static getMockWeatherData(): WeatherData {
    return {
      temperature: 72,
      condition: 'Clear',
      description: 'Weather data temporarily unavailable',
      humidity: 65,
      windSpeed: 8,
      precipitation: 0,
      icon: '🌤️',
      isOutdoorFriendly: true,
    };
  }
}
