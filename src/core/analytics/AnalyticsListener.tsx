import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/core/analytics/googleAnalytics';

export const AnalyticsListener = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`, document.title);
  }, [location]);

  return null;
};
