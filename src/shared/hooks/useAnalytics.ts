import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/core/analytics/analyticsService';
import type { UserProperties } from '@/core/analytics/types';

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const location = useLocation();

  // Auto-track page views on route changes
  useEffect(() => {
    analyticsService.trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  return {
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
      analyticsService.trackEvent(eventName, properties);
    },
    trackPageView: (pagePath: string, pageTitle?: string) => {
      analyticsService.trackPageView(pagePath, pageTitle);
    },
    identify: (userId: string, properties?: UserProperties) => {
      analyticsService.identify(userId, properties);
    },
    setUserProperties: (properties: UserProperties) => {
      analyticsService.setUserProperties(properties);
    },
    reset: () => {
      analyticsService.reset();
    },
  };
}

/**
 * Hook for tracking structured events with category and action
 */
export function useStructuredAnalytics() {
  return {
    track: (
      category: string,
      action: string,
      label?: string,
      value?: number,
      additionalProperties?: Record<string, any>
    ) => {
      analyticsService.trackStructuredEvent(category, action, label, value, additionalProperties);
    },
  };
}

