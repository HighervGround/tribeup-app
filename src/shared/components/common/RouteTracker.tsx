import { useAnalytics } from '@/shared/hooks/useAnalytics';

/**
 * Component that automatically tracks page views on route changes
 * Should be placed inside BrowserRouter
 */
export function RouteTracker() {
  useAnalytics(); // This hook automatically tracks page views
  return null;
}

