// System configuration service for runtime configurable settings
import { supabase } from '@/core/database/supabase';

export interface SystemConfigValue {
  key: string;
  value: any;
  description?: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemConfigCache {
  [key: string]: {
    value: any;
    timestamp: number;
    ttl: number;
  };
}

class SystemConfigService {
  private static instance: SystemConfigService;
  private cache: SystemConfigCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): SystemConfigService {
    if (!SystemConfigService.instance) {
      SystemConfigService.instance = new SystemConfigService();
    }
    return SystemConfigService.instance;
  }

  private async fetchConfigValue(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - config doesn't exist
          console.warn(`Config key '${key}' not found in database`);
          return null;
        }
        throw error;
      }

      return this.parseConfigValue(data.value);
    } catch (error) {
      console.log(`⚠️ system_config table not found or error fetching '${key}', using default`);
      return null;
    }
  }

  private parseConfigValue(value: any): any {
    // Parse JSON strings back to their original types
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(value);
        return parsed;
      } catch {
        // If parsing fails, keep as string
        // Handle boolean strings
        if (value === 'true') return true;
        if (value === 'false') return false;
        // Handle numeric strings
        if (!isNaN(Number(value)) && value !== '') {
          return Number(value);
        }
        return value;
      }
    }

    return value;
  }

  // Get a configuration value with caching
  async get<T = string>(key: string, defaultValue?: T): Promise<T> {
    // Check cache first
    const cached = this.cache[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value as T;
    }

    const value = await this.fetchConfigValue(key);

    // Cache the result
    this.cache[key] = {
      value,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };

    return (value !== null ? value : defaultValue) as T;
  }
}

export const systemConfig = SystemConfigService.getInstance();
