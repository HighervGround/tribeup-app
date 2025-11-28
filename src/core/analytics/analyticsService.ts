import posthog from 'posthog-js';
import { envConfig } from '@/core/config/envConfig';
import type { AnalyticsEvent, PageViewEvent, UserProperties } from './types';

class AnalyticsService {
  private static instance: AnalyticsService;
  private initialized = false;
  private consentGiven = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize PostHog analytics
   * Should be called once when the app starts
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn('Analytics already initialized');
      return;
    }

    const apiKey = envConfig.get('posthogApiKey');
    const host = envConfig.get('posthogHost');

    if (!apiKey) {
      console.warn('PostHog API key not configured - analytics disabled');
      return;
    }

    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV;

    try {
      posthog.init(apiKey, {
        api_host: host || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (isDevelopment) {
            console.log('✅ PostHog initialized (development mode)');
          }
        },
        // Disable autocapture in development to reduce noise
        autocapture: !isDevelopment,
        // Respect user consent
        opt_out_capturing_by_default: !this.consentGiven,
        // Capture pageviews automatically
        capture_pageview: true,
        // Capture pageleaves
        capture_pageleave: true,
        // Disable in development unless explicitly enabled
        disable_session_recording: isDevelopment,
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Set user consent for analytics
   */
  public setConsent(consent: boolean): void {
    this.consentGiven = consent;
    
    if (this.initialized) {
      if (consent) {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
    }
  }

  /**
   * Check if analytics is initialized and ready
   */
  public isReady(): boolean {
    return this.initialized && this.consentGiven;
  }

  /**
   * Track a custom event
   */
  public trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isReady()) {
      if (import.meta.env.DEV) {
        console.log('[Analytics] Event (not sent):', eventName, properties);
      }
      return;
    }

    try {
      posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track a page view
   */
  public trackPageView(pagePath: string, pageTitle?: string): void {
    if (!this.isReady()) {
      if (import.meta.env.DEV) {
        console.log('[Analytics] Page view (not sent):', pagePath, pageTitle);
      }
      return;
    }

    try {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_path: pagePath,
        page_title: pageTitle || document.title,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Identify a user
   */
  public identify(userId: string, properties?: UserProperties): void {
    if (!this.isReady()) {
      if (import.meta.env.DEV) {
        console.log('[Analytics] Identify (not sent):', userId, properties);
      }
      return;
    }

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  /**
   * Set user properties
   */
  public setUserProperties(properties: UserProperties): void {
    if (!this.isReady()) {
      if (import.meta.env.DEV) {
        console.log('[Analytics] Set user properties (not sent):', properties);
      }
      return;
    }

    try {
      posthog.setPersonProperties(properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Reset user identification (on logout)
   */
  public reset(): void {
    if (!this.initialized) {
      return;
    }

    try {
      posthog.reset();
    } catch (error) {
      console.error('Failed to reset analytics:', error);
    }
  }

  /**
   * Capture an exception/error
   */
  public captureException(error: Error, context?: Record<string, any>): void {
    if (!this.isReady()) {
      if (import.meta.env.DEV) {
        console.error('[Analytics] Exception (not sent):', error, context);
      }
      return;
    }

    try {
      posthog.capture('$exception', {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack_trace_raw: error.stack,
        ...context,
      });
    } catch (err) {
      console.error('Failed to capture exception:', err);
    }
  }

  /**
   * Capture a message/log
   */
  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.isReady()) {
      if (import.meta.env.DEV) {
        console.log(`[Analytics] ${level} (not sent):`, message, context);
      }
      return;
    }

    try {
      posthog.capture('$log', {
        $log_message: message,
        $log_level: level,
        ...context,
      });
    } catch (error) {
      console.error('Failed to capture message:', error);
    }
  }

  /**
   * Track structured event with category and action
   */
  public trackStructuredEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    additionalProperties?: Record<string, any>
  ): void {
    this.trackEvent(`${category}_${action}`, {
      category,
      action,
      label,
      value,
      ...additionalProperties,
    });
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();

// Export for convenience
export default analyticsService;

