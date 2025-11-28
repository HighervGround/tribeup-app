import * as Sentry from '@sentry/react';
import { initializeErrorMonitoring } from '@/core/notifications/errorMonitoring';

declare global {
  interface Window {
    Sentry?: typeof Sentry;
  }
}

const env = (import.meta as any).env;
const sentryDsn: string | undefined = env.VITE_SENTRY_DSN;
const tracesSampleRate = parseFloat(env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1');
const replaysSessionSampleRate = parseFloat(env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0');
const replaysErrorSampleRate = parseFloat(env.VITE_SENTRY_REPLAYS_ERROR_SAMPLE_RATE || '1');

let initialized = false;
let sentryEnabled = false;

const clampRate = (rate: number) => {
  if (Number.isNaN(rate)) return 0;
  return Math.max(0, Math.min(1, rate));
};

export interface ObservabilityMetric {
  name: string;
  value: number;
  id?: string;
  rating?: string;
  delta?: number;
  navigationType?: string;
}

export const initializeSystemMonitoring = () => {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  if (sentryDsn) {
    const integrations: Sentry.Integration[] = [
      Sentry.browserTracingIntegration()
    ];

    const normalizedSessionRate = clampRate(replaysSessionSampleRate);
    const normalizedErrorRate = clampRate(replaysErrorSampleRate);

    if (normalizedSessionRate > 0 || normalizedErrorRate > 0) {
      integrations.push(
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: true
        })
      );
    }

    Sentry.init({
      dsn: sentryDsn,
      environment: env.VITE_SENTRY_ENVIRONMENT || env.MODE || 'production',
      release: env.VITE_APP_VERSION,
      integrations,
      tracesSampleRate: clampRate(tracesSampleRate),
      replaysSessionSampleRate: normalizedSessionRate,
      replaysOnErrorSampleRate: normalizedErrorRate,
      beforeSend(event) {
        event.tags = {
          ...event.tags,
          app_version: env.VITE_APP_VERSION || 'dev',
          deployment: env.VITE_DEPLOYMENT_TARGET || 'unknown'
        };
        return event;
      }
    });

    window.Sentry = Sentry;
    sentryEnabled = true;
  }

  initializeErrorMonitoring();
  initialized = true;
};

export const captureMonitoringMetric = (metric: ObservabilityMetric) => {
  if (!sentryEnabled || !window.Sentry) {
    return;
  }

  window.Sentry.captureEvent({
    message: `web-vital:${metric.name}`,
    level: 'info',
    extra: metric
  });
};

export const monitoringStatus = () => ({
  sentryEnabled,
  initialized,
  environment: env.VITE_SENTRY_ENVIRONMENT || env.MODE
});
