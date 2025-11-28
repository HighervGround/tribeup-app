import { Metric, onCLS, onFID, onINP, onLCP, onTTFB } from 'web-vitals';
import { analyticsReady, trackEvent } from '@/core/analytics/googleAnalytics';
import { captureMonitoringMetric } from '@/core/monitoring/systemMonitoring';

const perfDebug = (import.meta as any).env.VITE_PERF_METRICS_DEBUG === 'true';

const logMetric = (metric: Metric) => {
  if (perfDebug) {
    console.debug('[WebVital]', metric.name, metric.value);
  }
};

const reportMetric = (metric: Metric) => {
  logMetric(metric);

  captureMonitoringMetric({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType
  });

  if (analyticsReady()) {
    trackEvent('web_vital', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value),
      metric_id: metric.id,
      rating: metric.rating
    });
  }
};

export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') {
    return;
  }

  onCLS(reportMetric);
  onFID(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
};
