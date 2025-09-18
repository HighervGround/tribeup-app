// System configuration service for runtime configurable settings
import { supabase } from './supabase';

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

  // Get a configuration value with caching
  async get<T = string>(key: string, defaultValue?: T): Promise<T> {
    // Check cache first
    const cached = this.cache[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value as T;
    }

    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', key)
        .single();

      if (error || !data) {
        return defaultValue as T;
      }

      let value = data.value;
      
      // Parse JSON strings back to their original types
      if (typeof value === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(value);
          value = parsed;
        } catch {
          // If parsing fails, keep as string
          // Handle boolean strings
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          // Handle numeric strings
          else if (!isNaN(Number(value)) && value !== '') {
            value = Number(value);
          }
        }
      }

      // Cache the result
      this.cache[key] = {
        value,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      };

      return value as T;
    } catch (error) {
      console.error(`Error fetching system config '${key}':`, error);
      return defaultValue as T;
    }
  }

  // Get multiple configuration values at once
  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const uncachedKeys: string[] = [];

    // Check cache for each key
    for (const key of keys) {
      const cached = this.cache[key];
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        result[key] = cached.value;
      } else {
        uncachedKeys.push(key);
      }
    }

    // Fetch uncached keys from database
    if (uncachedKeys.length > 0) {
      try {
        const { data, error } = await supabase
          .from('system_config')
          .select('key, value')
          .in('key', uncachedKeys);

        if (!error && data) {
          for (const item of data) {
            let value = item.value;
            
            // Parse JSON strings
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                value = parsed;
              } catch {
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(Number(value)) && value !== '') {
                  value = Number(value);
                }
              }
            }

            result[item.key] = value;
            
            // Cache the result
            this.cache[item.key] = {
              value,
              timestamp: Date.now(),
              ttl: this.CACHE_TTL
            };
          }
        }
      } catch (error) {
        console.error('Error fetching multiple system configs:', error);
      }
    }

    return result;
  }

  // Get all public configurations (for client-side use)
  async getPublicConfigs(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value, category')
        .eq('is_public', true);

      if (error || !data) {
        return {};
      }

      const result: Record<string, any> = {};
      for (const item of data) {
        let value = item.value;
        
        // Parse JSON strings
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            value = parsed;
          } catch {
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value)) && value !== '') {
              value = Number(value);
            }
          }
        }

        result[item.key] = value;
      }

      return result;
    } catch (error) {
      console.error('Error fetching public system configs:', error);
      return {};
    }
  }

  // Set a configuration value (admin only)
  async set(key: string, value: any, description?: string, category: string = 'general', isPublic: boolean = false): Promise<void> {
    try {
      // Convert value to JSON string for storage
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);

      const { error } = await supabase
        .from('system_config')
        .upsert({
          key,
          value: jsonValue,
          description,
          category,
          is_public: isPublic
        });

      if (error) throw error;

      // Update cache
      this.cache[key] = {
        value,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      };
    } catch (error) {
      console.error(`Error setting system config '${key}':`, error);
      throw error;
    }
  }

  // Clear cache for a specific key or all keys
  clearCache(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }

  // Get configurations by category
  async getByCategory(category: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value, description, is_public')
        .eq('category', category);

      if (error || !data) {
        return {};
      }

      const result: Record<string, any> = {};
      for (const item of data) {
        let value = item.value;
        
        // Parse JSON strings
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            value = parsed;
          } catch {
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value)) && value !== '') {
              value = Number(value);
            }
          }
        }

        result[item.key] = {
          value,
          description: item.description,
          is_public: item.is_public
        };
      }

      return result;
    } catch (error) {
      console.error(`Error fetching configs for category '${category}':`, error);
      return {};
    }
  }

  // Helper methods for common config types
  async getBusinessRule(rule: string, defaultValue?: number): Promise<number> {
    return this.get<number>(`${rule}`, defaultValue);
  }

  async getFeatureFlag(feature: string, defaultValue: boolean = false): Promise<boolean> {
    return this.get<boolean>(`enable_${feature}`, defaultValue);
  }

  async getSportDefault(sport: string, setting: string, defaultValue?: any): Promise<any> {
    return this.get(`default_${sport}_${setting}`, defaultValue);
  }

  // Batch update multiple configurations
  async updateMultiple(configs: Array<{ key: string; value: any; description?: string; category?: string; isPublic?: boolean }>): Promise<void> {
    try {
      const upsertData = configs.map(config => ({
        key: config.key,
        value: typeof config.value === 'string' ? config.value : JSON.stringify(config.value),
        description: config.description,
        category: config.category || 'general',
        is_public: config.isPublic || false
      }));

      const { error } = await supabase
        .from('system_config')
        .upsert(upsertData);

      if (error) throw error;

      // Update cache for all modified keys
      for (const config of configs) {
        this.cache[config.key] = {
          value: config.value,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        };
      }
    } catch (error) {
      console.error('Error updating multiple system configs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const systemConfig = SystemConfigService.getInstance();

// Convenience functions
export const getSystemConfig = <T = string>(key: string, defaultValue?: T) => 
  systemConfig.get<T>(key, defaultValue);

export const getBusinessRule = (rule: string, defaultValue?: number) => 
  systemConfig.getBusinessRule(rule, defaultValue);

export const getFeatureFlag = (feature: string, defaultValue: boolean = false) => 
  systemConfig.getFeatureFlag(feature, defaultValue);

export const getSportDefault = (sport: string, setting: string, defaultValue?: any) => 
  systemConfig.getSportDefault(sport, setting, defaultValue);
