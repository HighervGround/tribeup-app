import { supabase } from './supabase';

interface NetworkConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

const defaultConfig: NetworkConfig = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  timeout: 60000 // Increased to 60 seconds - let queries complete naturally
};

class NetworkService {
  private static instance: NetworkService;
  private connectionAttempts = new Map<string, number>();
  private lastConnectionTime = new Map<string, number>();
  private config: NetworkConfig;

  private constructor(config: NetworkConfig = defaultConfig) {
    this.config = config;
  }

  static getInstance(config?: NetworkConfig): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService(config);
    }
    return NetworkService.instance;
  }

  // Exponential backoff with jitter
  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.baseDelay * Math.pow(2, attempt),
      this.config.maxDelay
    );
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  // Check if we should throttle the connection attempt
  private shouldThrottle(key: string): boolean {
    const attempts = this.connectionAttempts.get(key) || 0;
    const lastTime = this.lastConnectionTime.get(key) || 0;
    const now = Date.now();
    
    // If too many attempts recently, throttle
    if (attempts >= this.config.maxRetries) {
      const timeSinceLastAttempt = now - lastTime;
      const requiredWait = this.calculateDelay(attempts);
      
      if (timeSinceLastAttempt < requiredWait) {
        console.log(`🚦 Throttling connection attempt for ${key}. Wait ${Math.ceil((requiredWait - timeSinceLastAttempt) / 1000)}s`);
        return true;
      } else {
        // Reset attempts after sufficient wait
        this.connectionAttempts.set(key, 0);
      }
    }
    
    return false;
  }

  // Record connection attempt
  private recordAttempt(key: string): void {
    const attempts = this.connectionAttempts.get(key) || 0;
    this.connectionAttempts.set(key, attempts + 1);
    this.lastConnectionTime.set(key, Date.now());
  }

  // Reset connection attempts on success
  private resetAttempts(key: string): void {
    this.connectionAttempts.delete(key);
    this.lastConnectionTime.delete(key);
  }

  // Wrapper for database queries with retry logic
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationKey: string,
    customConfig?: Partial<NetworkConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig };
    
    if (this.shouldThrottle(operationKey)) {
      throw new Error(`Operation ${operationKey} is being throttled due to repeated failures`);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        this.recordAttempt(operationKey);
        
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), config.timeout);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        
        // Success - reset attempts
        this.resetAttempts(operationKey);
        return result;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt + 1} failed for ${operationKey}:`, error.message);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.log(`⏳ Retrying ${operationKey} in ${Math.ceil(delay / 1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Operation ${operationKey} failed after ${config.maxRetries} attempts`);
  }

  // Check if error should not be retried
  private isNonRetryableError(error: any): boolean {
    const nonRetryableMessages = [
      'Invalid API key',
      'Unauthorized',
      'Forbidden',
      'Not found',
      'Bad request',
      'Invalid JWT',
      'JWT expired'
    ];
    
    const message = error.message?.toLowerCase() || '';
    return nonRetryableMessages.some(msg => message.includes(msg.toLowerCase()));
  }

  // Health check for network connectivity
  async checkConnectivity(): Promise<boolean> {
    try {
      // Use a lightweight query to check connectivity
      const { error } = await supabase.from('games').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Get connection statistics
  getConnectionStats(): Record<string, { attempts: number; lastAttempt: number }> {
    const stats: Record<string, { attempts: number; lastAttempt: number }> = {};
    
    for (const [key, attempts] of this.connectionAttempts.entries()) {
      stats[key] = {
        attempts,
        lastAttempt: this.lastConnectionTime.get(key) || 0
      };
    }
    
    return stats;
  }

  // Clear all connection tracking (useful for testing or manual reset)
  clearConnectionTracking(): void {
    this.connectionAttempts.clear();
    this.lastConnectionTime.clear();
    console.log('🧹 Cleared all connection tracking');
  }
}

export const networkService = NetworkService.getInstance();
export default NetworkService;
