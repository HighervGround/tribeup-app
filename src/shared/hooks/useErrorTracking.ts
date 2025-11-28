import { useCallback } from 'react';
import { analyticsService } from '@/core/analytics/analyticsService';

/**
 * Hook for manual error tracking
 * Most errors are automatically tracked via errorMonitoring.ts
 * Use this for manual error reporting in components
 */
export function useErrorTracking() {
  const captureException = useCallback((error: Error, context?: Record<string, any>) => {
    analyticsService.captureException(error, context);
  }, []);

  const captureMessage = useCallback((message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) => {
    analyticsService.captureMessage(message, level, context);
  }, []);

  return {
    captureException,
    captureMessage,
  };
}

