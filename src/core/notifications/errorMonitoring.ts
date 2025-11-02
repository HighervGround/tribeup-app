import { toast } from 'sonner';

export interface ErrorContext {
  userId?: string;
  gameId?: string;
  operation: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  recoveredErrors: number;
  averageRecoveryTime: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  GAME_OPERATION = 'game_operation',
  LOCATION_SERVICE = 'location_service',
  PRESENCE_SYSTEM = 'presence_system',
  PAYMENT = 'payment',
  UNKNOWN = 'unknown'
}

class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: Map<string, ErrorContext[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorRate: 0,
    criticalErrors: 0,
    recoveredErrors: 0,
    averageRecoveryTime: 0
  };
  private recoveryStrategies: Map<string, (error: Error, context: ErrorContext) => Promise<any>> = new Map();
  private alertThresholds = {
    errorRate: 0.05, // 5% error rate
    criticalErrorCount: 5,
    circuitBreakerTrips: 3
  };

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private constructor() {
    this.initializeCircuitBreakers();
    this.initializeRecoveryStrategies();
    this.startMetricsCollection();
  }

  private initializeCircuitBreakers() {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringWindow: 300000 // 5 minutes
    };

    // Create circuit breakers for different operations
    this.circuitBreakers.set('database', new CircuitBreaker(defaultConfig));
    this.circuitBreakers.set('game_operations', new CircuitBreaker(defaultConfig));
    this.circuitBreakers.set('location_services', new CircuitBreaker(defaultConfig));
    this.circuitBreakers.set('presence_system', new CircuitBreaker({
      ...defaultConfig,
      failureThreshold: 10 // Higher threshold for presence system
    }));
  }

  private initializeRecoveryStrategies() {
    // Database connection recovery
    this.recoveryStrategies.set('database', async (error, context) => {
      console.log('Attempting database recovery for:', context.operation);
      
      // Wait and retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, context.metadata?.retryCount || 0), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Try to reconnect or use cached data
      if (context.operation.includes('getGames')) {
        return this.getCachedGames();
      }
      
      throw error; // Re-throw if no recovery possible
    });

    // Game operation recovery
    this.recoveryStrategies.set('game_operation', async (error, context) => {
      console.log('Attempting game operation recovery for:', context.operation);
      
      if (context.operation === 'joinGame') {
        // Try alternative join method or queue the request
        return this.queueGameJoin(context.gameId!, context.userId!);
      }
      
      if (context.operation === 'createGame') {
        // Save draft and retry later
        return this.saveDraftGame(context.metadata?.gameData);
      }
      
      throw error;
    });

    // Location service recovery
    this.recoveryStrategies.set('location_service', async (error, context) => {
      console.log('Attempting location service recovery');
      
      // Fall back to IP-based location or cached location
      const fallbackLocation = await this.getFallbackLocation();
      return fallbackLocation;
    });

    // Presence system recovery
    this.recoveryStrategies.set('presence_system', async (error, context) => {
      console.log('Attempting presence system recovery');
      
      // Use local cache or simplified presence tracking
      return this.getSimplifiedPresence(context.gameId);
    });
  }

  async logError(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN
  ): Promise<void> {
    const errorId = this.generateErrorId();
    const enhancedContext: ErrorContext = {
      ...context,
      timestamp: new Date(),
      stackTrace: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store error
    const categoryKey = `${category}_${severity}`;
    if (!this.errors.has(categoryKey)) {
      this.errors.set(categoryKey, []);
    }
    this.errors.get(categoryKey)!.push(enhancedContext);

    // Update metrics
    this.updateMetrics(severity);

    // Log to console with structured format
    console.error(`[${severity.toUpperCase()}] ${category}:`, {
      errorId,
      message: error.message,
      context: enhancedContext
    });

    // Send to external monitoring service (if configured)
    this.sendToMonitoringService(errorId, error, enhancedContext, severity, category);

    // Check if alerts should be triggered
    this.checkAlertThresholds(category, severity);

    // Attempt automatic recovery for certain error types
    if (this.shouldAttemptRecovery(category, severity)) {
      try {
        await this.attemptRecovery(error, enhancedContext, category);
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }
  }

  async executeWithCircuitBreaker<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(operation);
    if (!circuitBreaker) {
      return fn();
    }

    try {
      return await circuitBreaker.execute(fn);
    } catch (error) {
      await this.logError(
        error as Error,
        {
          operation,
          ...context,
          timestamp: new Date()
        },
        ErrorSeverity.HIGH,
        this.categorizeError(error as Error)
      );
      throw error;
    }
  }

  private async attemptRecovery(
    error: Error,
    context: ErrorContext,
    category: ErrorCategory
  ): Promise<any> {
    const recoveryStrategy = this.recoveryStrategies.get(category);
    if (!recoveryStrategy) {
      throw error;
    }

    const startTime = Date.now();
    try {
      const result = await recoveryStrategy(error, context);
      const recoveryTime = Date.now() - startTime;
      
      // Update recovery metrics
      this.metrics.recoveredErrors++;
      this.metrics.averageRecoveryTime = 
        (this.metrics.averageRecoveryTime + recoveryTime) / 2;
      
      console.log(`Recovery successful for ${category} in ${recoveryTime}ms`);
      return result;
    } catch (recoveryError) {
      console.error(`Recovery failed for ${category}:`, recoveryError);
      throw error; // Re-throw original error
    }
  }

  private shouldAttemptRecovery(category: ErrorCategory, severity: ErrorSeverity): boolean {
    // Don't attempt recovery for critical errors or certain categories
    if (severity === ErrorSeverity.CRITICAL) {
      return false;
    }
    
    const recoverableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.DATABASE,
      ErrorCategory.GAME_OPERATION,
      ErrorCategory.LOCATION_SERVICE,
      ErrorCategory.PRESENCE_SYSTEM
    ];
    
    return recoverableCategories.includes(category);
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('database') || message.includes('supabase')) {
      return ErrorCategory.DATABASE;
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('game') || message.includes('join') || message.includes('create')) {
      return ErrorCategory.GAME_OPERATION;
    }
    if (message.includes('location') || message.includes('geolocation')) {
      return ErrorCategory.LOCATION_SERVICE;
    }
    if (message.includes('presence') || message.includes('websocket')) {
      return ErrorCategory.PRESENCE_SYSTEM;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  private updateMetrics(severity: ErrorSeverity) {
    this.metrics.totalErrors++;
    
    if (severity === ErrorSeverity.CRITICAL) {
      this.metrics.criticalErrors++;
    }
    
    // Calculate error rate (errors per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentErrors = Array.from(this.errors.values())
      .flat()
      .filter(error => error.timestamp.getTime() > oneMinuteAgo);
    
    this.metrics.errorRate = recentErrors.length / 60; // errors per second
  }

  private checkAlertThresholds(category: ErrorCategory, severity: ErrorSeverity) {
    // Check error rate threshold
    if (this.metrics.errorRate > this.alertThresholds.errorRate) {
      this.sendAlert('HIGH_ERROR_RATE', {
        errorRate: this.metrics.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }

    // Check critical error threshold
    if (this.metrics.criticalErrors > this.alertThresholds.criticalErrorCount) {
      this.sendAlert('CRITICAL_ERROR_THRESHOLD', {
        criticalErrors: this.metrics.criticalErrors,
        threshold: this.alertThresholds.criticalErrorCount
      });
    }

    // Check circuit breaker states
    const openCircuitBreakers = Array.from(this.circuitBreakers.entries())
      .filter(([_, breaker]) => breaker.getState().state === 'OPEN');
    
    if (openCircuitBreakers.length > this.alertThresholds.circuitBreakerTrips) {
      this.sendAlert('CIRCUIT_BREAKER_TRIPS', {
        openBreakers: openCircuitBreakers.map(([name]) => name),
        count: openCircuitBreakers.length
      });
    }
  }

  private sendAlert(type: string, data: any) {
    console.warn(`🚨 ALERT [${type}]:`, data);
    
    // Show user-friendly notification for critical issues
    if (type === 'CRITICAL_ERROR_THRESHOLD') {
      toast.error('System experiencing issues. Our team has been notified.');
    }
    
    // Send to external alerting service (Slack, PagerDuty, etc.)
    this.sendToAlertingService(type, data);
  }

  private async sendToMonitoringService(
    errorId: string,
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity,
    category: ErrorCategory
  ) {
    // Integration with external monitoring services like Sentry, DataDog, etc.
    try {
      // Example: Send to Sentry
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            category,
            severity,
            operation: context.operation
          },
          contexts: {
            error_context: context
          },
          fingerprint: [errorId]
        });
      }
    } catch (monitoringError) {
      console.error('Failed to send to monitoring service:', monitoringError);
    }
  }

  private sendToAlertingService(type: string, data: any) {
    // Integration with alerting services
    // This would typically send to Slack, PagerDuty, email, etc.
    console.log(`Alert sent: ${type}`, data);
  }

  private startMetricsCollection() {
    setInterval(() => {
      this.cleanupOldErrors();
      this.logMetrics();
    }, 60000); // Every minute
  }

  private cleanupOldErrors() {
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [category, errors] of this.errors) {
      const filteredErrors = errors.filter(
        error => error.timestamp.getTime() > oneHourAgo
      );
      this.errors.set(category, filteredErrors);
    }
  }

  private logMetrics() {
    console.log('📊 Error Metrics:', this.metrics);
    console.log('🔌 Circuit Breaker States:', 
      Array.from(this.circuitBreakers.entries()).map(([name, breaker]) => ({
        name,
        state: breaker.getState()
      }))
    );
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Recovery helper methods
  private async getCachedGames() {
    // Return cached games from localStorage or IndexedDB
    const cached = localStorage.getItem('cached_games');
    return cached ? JSON.parse(cached) : [];
  }

  private async queueGameJoin(gameId: string, userId: string) {
    // Queue the join request for retry later
    const queue = JSON.parse(localStorage.getItem('pending_joins') || '[]');
    queue.push({ gameId, userId, timestamp: Date.now() });
    localStorage.setItem('pending_joins', JSON.stringify(queue));
    
    toast.info('Join request queued. Will retry automatically.');
    return { queued: true };
  }

  private async saveDraftGame(gameData: any) {
    // Save game as draft for later submission
    const drafts = JSON.parse(localStorage.getItem('draft_games') || '[]');
    drafts.push({ ...gameData, timestamp: Date.now() });
    localStorage.setItem('draft_games', JSON.stringify(drafts));
    
    toast.info('Game saved as draft. You can complete it later.');
    return { draft: true };
  }

  private async getFallbackLocation() {
    // Try to get location from IP or use cached location
    const cached = localStorage.getItem('last_known_location');
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Default to a general location
    return { latitude: 39.8283, longitude: -98.5795 }; // Center of US
  }

  private async getSimplifiedPresence(gameId?: string) {
    // Return simplified presence data
    return {
      onlineUsers: [],
      onlineCount: 0,
      isSimplified: true
    };
  }

  // Public API methods
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  getCircuitBreakerStates() {
    return Array.from(this.circuitBreakers.entries()).map(([name, breaker]) => ({
      name,
      ...breaker.getState()
    }));
  }

  getRecentErrors(category?: ErrorCategory, limit: number = 50) {
    if (category) {
      const categoryErrors = Array.from(this.errors.entries())
        .filter(([key]) => key.includes(category))
        .flatMap(([_, errors]) => errors);
      
      return categoryErrors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    }
    
    return Array.from(this.errors.values())
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Global error handler
export function initializeErrorMonitoring() {
  const monitor = ErrorMonitor.getInstance();
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    monitor.logError(
      new Error(event.reason),
      {
        operation: 'unhandled_promise_rejection',
        timestamp: new Date(),
        metadata: { reason: event.reason }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN
    );
  });
  
  // Catch global errors
  window.addEventListener('error', (event) => {
    monitor.logError(
      event.error || new Error(event.message),
      {
        operation: 'global_error',
        timestamp: new Date(),
        url: event.filename,
        metadata: { 
          lineno: event.lineno,
          colno: event.colno 
        }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN
    );
  });
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Utility functions for common error handling patterns
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Partial<ErrorContext>,
  category: ErrorCategory = ErrorCategory.UNKNOWN
): Promise<T> {
  try {
    return await errorMonitor.executeWithCircuitBreaker(operation, fn, context);
  } catch (error) {
    await errorMonitor.logError(
      error as Error,
      {
        operation,
        ...context,
        timestamp: new Date()
      },
      ErrorSeverity.MEDIUM,
      category
    );
    throw error;
  }
}

export function createErrorBoundary(component: string) {
  return (error: Error, errorInfo: any) => {
    errorMonitor.logError(
      error,
      {
        operation: `react_error_boundary_${component}`,
        timestamp: new Date(),
        metadata: errorInfo
      },
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN
    );
  };
}
