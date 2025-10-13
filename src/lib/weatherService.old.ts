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
  private static readonly API_KEY = envConfig.get('weatherApiKey');

export class WeatherService {
  private static readonly API_KEY = envConfig.get('openWeatherApiKey');
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  // Weather configuration - now managed by environment config
  private static readonly CONFIG = {
    temperatureUnit: envConfig.get('weatherTempUnit'),
    updateInterval: envConfig.get('weatherUpdateInterval'),
    includeHourlyForecast: envConfig.get('weatherIncludeHourly'),
    rainThreshold: envConfig.get('weatherRainThreshold'),
    windThreshold: envConfig.get('weatherWindThreshold')
  };

  // Get current weather for coordinates
  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    if (!this.API_KEY) {
      console.warn('Weather API key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getMockWeatherData();
    }
  }

  // Get weather forecast for game time with 4-hour window analysis
  static async getGameWeather(lat: number, lng: number, gameDateTime: Date): Promise<WeatherData | null> {
    if (!this.API_KEY) {
      console.warn('Weather API key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      // Ensure coordinates are properly formatted (max 6 decimal places for precision)
      const formattedLat = parseFloat(lat.toFixed(6));
      const formattedLng = parseFloat(lng.toFixed(6));
      
      console.log(`🌤️ Fetching weather for coordinates: ${formattedLat}, ${formattedLng}`);
      console.log(`🕐 Game time: ${gameDateTime.toISOString()}`);
      
      // Check if game is in the past (more than 1 hour ago)
      const now = new Date();
      const hoursDiff = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < -1) {
        console.log(`⏰ Game was ${Math.abs(hoursDiff).toFixed(1)} hours ago - using current weather instead of forecast`);
        const currentWeather = await this.getCurrentWeather(formattedLat, formattedLng);
        if (currentWeather) {
          // Add a note that this is current weather for a past game
          return {
            ...currentWeather,
            description: `Current conditions (game was ${Math.abs(hoursDiff).toFixed(0)}h ago)`,
            alerts: [`Game was ${Math.abs(hoursDiff).toFixed(0)} hours ago - showing current weather conditions`]
          };
        }
      }
      
      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${formattedLat}&lon=${formattedLng}&appid=${this.API_KEY}&units=imperial`
      );

      if (!response.ok) {
        console.error(`Weather API error: ${response.status} ${response.statusText}`);
        // Try current weather as fallback
        return await this.getCurrentWeather(formattedLat, formattedLng);
      }

      const data = await response.json();
      
      if (!data.list || data.list.length === 0) {
        console.warn('No forecast data available, falling back to current weather');
        return await this.getCurrentWeather(formattedLat, formattedLng);
      }
      
      console.log(`📊 Received ${data.list.length} forecast entries`);
      
      // OpenWeather provides forecasts in 3-hour intervals, so use a wider window
      // to ensure we catch at least one forecast near the game time
      const gameTime = gameDateTime.getTime();
      const windowStart = gameTime - (8 * 60 * 60 * 1000); // 8 hours before
      const windowEnd = gameTime + (8 * 60 * 60 * 1000);   // 8 hours after
      
      console.log(`🕐 Extended weather window: ${new Date(windowStart).toISOString()} to ${new Date(windowEnd).toISOString()}`);
      
      // Find all forecasts within the extended window
      const windowForecasts = data.list.filter((forecast: any) => {
        const forecastTime = forecast.dt * 1000;
        return forecastTime >= windowStart && forecastTime <= windowEnd;
      });
      
      console.log(`📈 Found ${windowForecasts.length} forecasts in extended window`);
      
      let selectedForecast;
      
      if (windowForecasts.length > 0) {
        // Use the forecast closest to game time within the window
        selectedForecast = windowForecasts.reduce((closest: any, current: any) => {
          const currentDiff = Math.abs((current.dt * 1000) - gameTime);
          const closestDiff = Math.abs((closest.dt * 1000) - gameTime);
          return currentDiff < closestDiff ? current : closest;
        });
        
        const timeDiff = Math.abs((selectedForecast.dt * 1000) - gameTime) / (1000 * 60 * 60);
        console.log(`🎯 Selected forecast: ${new Date(selectedForecast.dt * 1000).toISOString()} (${timeDiff.toFixed(1)}h from game)`);
      } else {
        // Fallback: find the closest forecast to game time (even outside window)
        selectedForecast = data.list.reduce((closest: any, current: any) => {
          const currentDiff = Math.abs((current.dt * 1000) - gameTime);
          const closestDiff = Math.abs((closest.dt * 1000) - gameTime);
          return currentDiff < closestDiff ? current : closest;
        });
        
        const timeDiff = Math.abs((selectedForecast.dt * 1000) - gameTime) / (1000 * 60 * 60);
        console.log(`⚠️ No forecasts in window, using closest: ${new Date(selectedForecast.dt * 1000).toISOString()} (${timeDiff.toFixed(1)}h from game)`);
      }

      // Analyze conditions across the window for better insights
      const weatherSummary = this.analyzeWeatherWindow(windowForecasts, selectedForecast);
      
      return this.transformWeatherData(selectedForecast, weatherSummary);
    } catch (error) {
      console.error('Error fetching game weather:', error);
      return this.getMockWeatherData();
    }
  }

  // Get weather by zipcode (more reliable for US locations)
  static async getWeatherByZipcode(zipcode: string, gameDateTime: Date): Promise<WeatherData | null> {
    if (!this.API_KEY) {
      console.warn('Weather API key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      console.log(`🌤️ Fetching weather for zipcode: ${zipcode}`);
      console.log(`🕐 Game time: ${gameDateTime.toISOString()}`);
      
      const response = await fetch(
        `${this.BASE_URL}/forecast?zip=${zipcode},US&appid=${this.API_KEY}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Received ${data.list.length} forecast entries for ${zipcode}`);
      
      // Define 4-hour window around game time (2 hours before to 2 hours after)
      const gameTime = gameDateTime.getTime();
      const windowStart = gameTime - (2 * 60 * 60 * 1000); // 2 hours before
      const windowEnd = gameTime + (2 * 60 * 60 * 1000);   // 2 hours after
      
      console.log(`🕐 Weather window: ${new Date(windowStart).toISOString()} to ${new Date(windowEnd).toISOString()}`);
      
      // Find all forecasts within the 4-hour window
      const windowForecasts = data.list.filter((forecast: any) => {
        const forecastTime = forecast.dt * 1000;
        return forecastTime >= windowStart && forecastTime <= windowEnd;
      });
      
      console.log(`📈 Found ${windowForecasts.length} forecasts in 4-hour window`);
      
      let selectedForecast;
      
      if (windowForecasts.length > 0) {
        // Use the forecast closest to game time within the window
        selectedForecast = windowForecasts.reduce((closest: any, current: any) => {
          const currentDiff = Math.abs((current.dt * 1000) - gameTime);
          const closestDiff = Math.abs((closest.dt * 1000) - gameTime);
          return currentDiff < closestDiff ? current : closest;
        });
        
        console.log(`🎯 Selected forecast: ${new Date(selectedForecast.dt * 1000).toISOString()}`);
      } else {
        // Fallback: find the closest forecast to game time (even outside window)
        selectedForecast = data.list.reduce((closest: any, current: any) => {
          const currentDiff = Math.abs((current.dt * 1000) - gameTime);
          const closestDiff = Math.abs((closest.dt * 1000) - gameTime);
          return currentDiff < closestDiff ? current : closest;
        });
        
        console.log(`⚠️ No forecasts in window, using closest: ${new Date(selectedForecast.dt * 1000).toISOString()}`);
      }

      // Analyze conditions across the window for better insights
      const weatherSummary = this.analyzeWeatherWindow(windowForecasts, selectedForecast);
      
      return this.transformWeatherData(selectedForecast, weatherSummary);
    } catch (error) {
      console.error('Error fetching weather by zipcode:', error);
      return null;
    }
  }

  // Extract zipcode from location string
  static extractZipcode(location: string): string | null {
    // Match 5-digit zipcode (with optional +4)
    const zipcodeMatch = location.match(/\b(\d{5}(?:-\d{4})?)\b/);
    return zipcodeMatch ? zipcodeMatch[1].split('-')[0] : null; // Return just the 5-digit part
  }
  
  // Analyze weather conditions across the 4-hour window
  private static analyzeWeatherWindow(windowForecasts: any[], primaryForecast: any) {
    if (windowForecasts.length === 0) {
      return { alerts: [], windowSummary: '' };
    }
    
    const temps = windowForecasts.map(f => f.main.temp);
    const conditions = windowForecasts.map(f => f.weather[0].main);
    const precipitations = windowForecasts.map(f => f.rain?.['3h'] || f.snow?.['3h'] || 0);
    
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const maxPrecip = Math.max(...precipitations);
    
    const alerts: string[] = [];
    let windowSummary = '';
    
    // Temperature variation alert
    if (maxTemp - minTemp > 10) {
      alerts.push(`🌡️ Temperature will vary ${Math.round(minTemp)}°F to ${Math.round(maxTemp)}°F during game time`);
    }
    
    // Precipitation alert
    if (maxPrecip > 0.1) {
      alerts.push(`🌧️ Possible precipitation during game window`);
    }
    
    // Condition changes
    const uniqueConditions = [...new Set(conditions)];
    if (uniqueConditions.length > 1) {
      alerts.push(`🌤️ Weather conditions may change: ${uniqueConditions.join(', ')}`);
    }
    
    // Create window summary
    if (windowForecasts.length > 1) {
      windowSummary = `4-hour forecast: ${Math.round(minTemp)}-${Math.round(maxTemp)}°F, ${uniqueConditions.join('/')}`;
    }
    
    return { alerts, windowSummary };
  }

  // Transform API response to our weather data format
  private static transformWeatherData(apiData: any, weatherSummary?: { alerts: string[], windowSummary: string }): WeatherData {
    const temp = Math.round(apiData.main.temp);
    const condition = apiData.weather[0].main;
    const description = apiData.weather[0].description;
    const precipitation = apiData.rain?.['1h'] || apiData.snow?.['1h'] || 0;
    
    // Combine standard alerts with window-specific alerts
    const standardAlerts = this.generateWeatherAlerts(condition, temp, precipitation, apiData.wind.speed);
    const allAlerts = weatherSummary ? [...standardAlerts, ...weatherSummary.alerts] : standardAlerts;
    
    // Use window summary as description if available
    const finalDescription = weatherSummary?.windowSummary || this.capitalizeWords(description);
    
    return {
      temperature: temp,
      condition,
      description: finalDescription,
      humidity: apiData.main.humidity,
      windSpeed: Math.round(apiData.wind.speed), // Already in mph from imperial units
      precipitation,
      icon: this.getWeatherIcon(condition),
      isOutdoorFriendly: this.isOutdoorFriendly(condition, temp, precipitation, apiData.wind.speed),
      alerts: allAlerts
    };
  }

  // Determine if weather is suitable for outdoor activities
  private static isOutdoorFriendly(condition: string, temp: number, precipitation: number, windSpeed: number): boolean {
    // Too cold (below 40°F) or too hot (above 95°F)
    if (temp < 40 || temp > 95) return false;
    
    // Heavy rain or snow (using custom threshold)
    if (precipitation > this.CONFIG.rainThreshold) return false;
    
    // Strong winds (using custom threshold in mph)
    if (windSpeed > this.CONFIG.windThreshold) return false;
    
    // Severe weather conditions
    const severeConditions = ['Thunderstorm', 'Tornado', 'Squall'];
    if (severeConditions.includes(condition)) return false;
    
    return true;
  }

  // Generate weather alerts for games
  private static generateWeatherAlerts(condition: string, temp: number, precipitation: number, windSpeed: number): string[] {
    const alerts: string[] = [];
    
    if (temp < 50) {
      alerts.push('🧥 Dress warmly - temperature below 50°F');
    } else if (temp > 85) {
      alerts.push('☀️ Stay hydrated - high temperature expected');
    }
    
    if (precipitation > this.CONFIG.rainThreshold) {
      alerts.push('🌧️ Rain expected - consider indoor backup plan');
    }
    
    if (windSpeed > 12) {
      alerts.push('💨 Windy conditions - secure loose items');
    }
    
    if (condition === 'Thunderstorm') {
      alerts.push('⚡ Thunderstorm warning - move indoors immediately');
    }
    
    return alerts;
  }

  // Get weather icon based on condition
  private static getWeatherIcon(condition: string): string {
    const iconMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    
    return iconMap[condition] || '🌤️';
  }

  // Capitalize first letter of each word
  private static capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  // Mock weather data for development/fallback
  private static getMockWeatherData(): WeatherData {
    return {
      temperature: 72,
      condition: 'Clear',
      description: 'Clear Sky',
      humidity: 65,
      windSpeed: 8,
      precipitation: 0,
      icon: '☀️',
      isOutdoorFriendly: true,
      alerts: []
    };
  }

  // Check if weather API is configured
  static isConfigured(): boolean {
    return !!this.API_KEY && this.API_KEY.length > 0;
  }

  // Get weather recommendation text
  static getWeatherRecommendation(weather: WeatherData): string {
    if (!weather.isOutdoorFriendly) {
      return 'Weather conditions may not be ideal for outdoor activities. Consider rescheduling or moving indoors.';
    }
    
    if (weather.temperature < 60) {
      return 'Cool weather - dress in layers and bring warm clothing.';
    } else if (weather.temperature > 80) {
      return 'Warm weather - bring water and sun protection.';
    }
    
    return 'Great weather for outdoor activities!';
  }
}
