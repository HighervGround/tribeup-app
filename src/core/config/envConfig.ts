// Environment configuration validation and management
export interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Weather API
  weatherApiKey?: string;
  weatherTempUnit: string;
  weatherUpdateInterval: number;
  weatherIncludeHourly: boolean;
  weatherRainThreshold: number;
  weatherWindThreshold: number;
  
  // Push Notifications
  vapidPublicKey?: string;
  
  // Timeouts and Intervals
  profileCheckTimeout: number;
  profileForceTimeout: number;
  presenceHeartbeatInterval: number;
  locationMonitoringInterval: number;
  
  // Business Rules
  gameEditRestrictionHours: number;
  gameDeletionRestrictionHours: number;
  
  // Development
  enableMockData: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: EnvConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private loadConfig(): EnvConfig {
    const env = (import.meta as any).env;
    
    return {
      // Supabase (required)
      supabaseUrl: env.VITE_SUPABASE_URL,
      supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
      
      // Weather API (optional)
      weatherApiKey: env.VITE_WEATHERAPI_KEY,
      weatherTempUnit: env.VITE_WEATHER_TEMP_UNIT || 'fahrenheit',
      weatherUpdateInterval: parseInt(env.VITE_WEATHER_UPDATE_INTERVAL || '3600'),
      weatherIncludeHourly: env.VITE_WEATHER_INCLUDE_HOURLY !== 'false',
      weatherRainThreshold: parseFloat(env.VITE_WEATHER_RAIN_THRESHOLD || '0.1'),
      weatherWindThreshold: parseInt(env.VITE_WEATHER_WIND_THRESHOLD || '15'),
      
      // Push Notifications (optional)
      vapidPublicKey: env.VITE_VAPID_PUBLIC_KEY,
      
      // Timeouts and Intervals
      profileCheckTimeout: parseInt(env.VITE_PROFILE_CHECK_TIMEOUT || '5000'),
      profileForceTimeout: parseInt(env.VITE_PROFILE_FORCE_TIMEOUT || '15000'),
      presenceHeartbeatInterval: parseInt(env.VITE_PRESENCE_HEARTBEAT_INTERVAL || '30000'),
      locationMonitoringInterval: parseInt(env.VITE_LOCATION_MONITORING_INTERVAL || '1800000'), // 30 minutes
      
      // Business Rules
      gameEditRestrictionHours: parseInt(env.VITE_GAME_EDIT_RESTRICTION_HOURS || '2'),
      gameDeletionRestrictionHours: parseInt(env.VITE_GAME_DELETION_RESTRICTION_HOURS || '4'),
      
      // Development
      enableMockData: env.VITE_ENABLE_MOCK_DATA === 'true',
      logLevel: (env.VITE_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error'
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];
    
    // Required environment variables
    if (!this.config.supabaseUrl) {
      errors.push('VITE_SUPABASE_URL is required');
    }
    
    if (!this.config.supabaseAnonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is required');
    }
    
    // Validate numeric values
    if (isNaN(this.config.weatherUpdateInterval) || this.config.weatherUpdateInterval < 60) {
      errors.push('VITE_WEATHER_UPDATE_INTERVAL must be a number >= 60');
    }
    
    if (isNaN(this.config.weatherRainThreshold) || this.config.weatherRainThreshold < 0) {
      errors.push('VITE_WEATHER_RAIN_THRESHOLD must be a number >= 0');
    }
    
    if (isNaN(this.config.weatherWindThreshold) || this.config.weatherWindThreshold < 0) {
      errors.push('VITE_WEATHER_WIND_THRESHOLD must be a number >= 0');
    }
    
    if (isNaN(this.config.profileCheckTimeout) || this.config.profileCheckTimeout < 1000) {
      errors.push('VITE_PROFILE_CHECK_TIMEOUT must be a number >= 1000');
    }
    
    if (isNaN(this.config.profileForceTimeout) || this.config.profileForceTimeout < 5000) {
      errors.push('VITE_PROFILE_FORCE_TIMEOUT must be a number >= 5000');
    }
    
    if (isNaN(this.config.presenceHeartbeatInterval) || this.config.presenceHeartbeatInterval < 10000) {
      errors.push('VITE_PRESENCE_HEARTBEAT_INTERVAL must be a number >= 10000');
    }
    
    if (isNaN(this.config.gameEditRestrictionHours) || this.config.gameEditRestrictionHours < 0) {
      errors.push('VITE_GAME_EDIT_RESTRICTION_HOURS must be a number >= 0');
    }
    
    if (isNaN(this.config.gameDeletionRestrictionHours) || this.config.gameDeletionRestrictionHours < 0) {
      errors.push('VITE_GAME_DELETION_RESTRICTION_HOURS must be a number >= 0');
    }
    
    // Validate string values
    if (!['fahrenheit', 'celsius'].includes(this.config.weatherTempUnit)) {
      errors.push('VITE_WEATHER_TEMP_UNIT must be "fahrenheit" or "celsius"');
    }
    
    if (!['debug', 'info', 'warn', 'error'].includes(this.config.logLevel)) {
      errors.push('VITE_LOG_LEVEL must be one of: debug, info, warn, error');
    }
    
    if (errors.length > 0) {
      console.error('Environment configuration errors:', errors);
      throw new Error(`Environment configuration errors:\n${errors.join('\n')}`);
    }
    
    // Warnings for optional but recommended variables
    const warnings: string[] = [];
    
    if (!this.config.weatherApiKey) {
      warnings.push('VITE_WEATHERAPI_KEY not set - weather features will use mock data');
    }
    
    if (!this.config.vapidPublicKey) {
      warnings.push('VITE_VAPID_PUBLIC_KEY not set - push notifications will be disabled');
    }
    
    if (warnings.length > 0) {
      console.warn('Environment configuration warnings:', warnings);
    }
  }

  public getConfig(): EnvConfig {
    return { ...this.config };
  }

  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  public isFeatureEnabled(feature: 'weather' | 'pushNotifications' | 'mockData'): boolean {
    switch (feature) {
      case 'weather':
        return !!this.config.weatherApiKey;
      case 'pushNotifications':
        return !!this.config.vapidPublicKey;
      case 'mockData':
        return this.config.enableMockData;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const envConfig = EnvironmentConfig.getInstance();

// Export individual getters for convenience
export const getEnvConfig = () => envConfig.getConfig();
export const isFeatureEnabled = (feature: 'weather' | 'pushNotifications' | 'mockData') => 
  envConfig.isFeatureEnabled(feature);
