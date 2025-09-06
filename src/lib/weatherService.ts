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

export interface WeatherForecast {
  current: WeatherData;
  hourly: WeatherData[];
  daily: WeatherData[];
}

export class WeatherService {
  private static readonly API_KEY = process.env.VITE_OPENWEATHER_API_KEY || 'demo_key';
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  // Get current weather for coordinates
  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric`
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

  // Get weather forecast for game time
  static async getGameWeather(lat: number, lng: number, gameDateTime: Date): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Find forecast closest to game time
      const gameTime = gameDateTime.getTime();
      let closestForecast = data.list[0];
      let smallestDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - gameTime);

      for (const forecast of data.list) {
        const forecastTime = new Date(forecast.dt * 1000).getTime();
        const diff = Math.abs(forecastTime - gameTime);
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestForecast = forecast;
        }
      }

      return this.transformWeatherData(closestForecast);
    } catch (error) {
      console.error('Error fetching game weather:', error);
      return this.getMockWeatherData();
    }
  }

  // Transform API response to our weather data format
  private static transformWeatherData(apiData: any): WeatherData {
    const temp = Math.round(apiData.main.temp);
    const condition = apiData.weather[0].main;
    const description = apiData.weather[0].description;
    const precipitation = apiData.rain?.['1h'] || apiData.snow?.['1h'] || 0;
    
    return {
      temperature: temp,
      condition,
      description: this.capitalizeWords(description),
      humidity: apiData.main.humidity,
      windSpeed: Math.round(apiData.wind.speed * 3.6), // Convert m/s to km/h
      precipitation,
      icon: this.getWeatherIcon(condition),
      isOutdoorFriendly: this.isOutdoorFriendly(condition, temp, precipitation, apiData.wind.speed),
      alerts: this.generateWeatherAlerts(condition, temp, precipitation, apiData.wind.speed)
    };
  }

  // Determine if weather is suitable for outdoor activities
  private static isOutdoorFriendly(condition: string, temp: number, precipitation: number, windSpeed: number): boolean {
    // Too cold (below 5°C) or too hot (above 35°C)
    if (temp < 5 || temp > 35) return false;
    
    // Heavy rain or snow
    if (precipitation > 2) return false;
    
    // Strong winds (over 10 m/s = 36 km/h)
    if (windSpeed > 10) return false;
    
    // Severe weather conditions
    const severeConditions = ['Thunderstorm', 'Tornado', 'Squall'];
    if (severeConditions.includes(condition)) return false;
    
    return true;
  }

  // Generate weather alerts for games
  private static generateWeatherAlerts(condition: string, temp: number, precipitation: number, windSpeed: number): string[] {
    const alerts: string[] = [];
    
    if (temp < 10) {
      alerts.push('🧥 Dress warmly - temperature below 10°C');
    } else if (temp > 30) {
      alerts.push('☀️ Stay hydrated - high temperature expected');
    }
    
    if (precipitation > 0.5) {
      alerts.push('🌧️ Rain expected - consider indoor backup plan');
    }
    
    if (windSpeed > 7) {
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
      temperature: 22,
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
    return this.API_KEY !== 'demo_key' && this.API_KEY.length > 0;
  }

  // Get weather recommendation text
  static getWeatherRecommendation(weather: WeatherData): string {
    if (!weather.isOutdoorFriendly) {
      return 'Weather conditions may not be ideal for outdoor activities. Consider rescheduling or moving indoors.';
    }
    
    if (weather.temperature < 15) {
      return 'Cool weather - dress in layers and bring warm clothing.';
    } else if (weather.temperature > 25) {
      return 'Warm weather - bring water and sun protection.';
    }
    
    return 'Great weather for outdoor activities!';
  }
}
