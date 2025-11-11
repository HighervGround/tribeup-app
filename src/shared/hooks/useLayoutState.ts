import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '@/domains/users/hooks/useAccessibility';
import { getRouteTitle } from '@/shared/config/navigation';
import { layoutConstants } from '@/shared/config/theme';

export interface LayoutState {
  navigationHeight: number;
  isCreateGameRoute: boolean;
  shouldShowBottomNav: boolean;
  routeTitle: string;
}

export function useLayoutState() {
  const location = useLocation();
  const { announceToScreenReader } = useAccessibility();
  const navigationRef = useRef<HTMLDivElement>(null);
  const [navigationHeight, setNavigationHeight] = useState<number>(layoutConstants.navigation.height.mobile);

  // Route-based state
  const isCreateGameRoute = location.pathname === '/create';
  const shouldShowBottomNav = !isCreateGameRoute;
  const routeTitle = getRouteTitle(location.pathname);

  // Dynamic navigation height calculation
  useEffect(() => {
    const updateNavigationHeight = () => {
      if (navigationRef.current) {
        const height = navigationRef.current.offsetHeight;
        setNavigationHeight(height);
      }
    };

    updateNavigationHeight();
    window.addEventListener('resize', updateNavigationHeight);
    
    return () => window.removeEventListener('resize', updateNavigationHeight);
  }, []);

  // Announce route changes to screen readers
  useEffect(() => {
    announceToScreenReader(`Navigated to ${routeTitle}`);
    document.title = `${routeTitle} - TribeUp`;
  }, [location.pathname, announceToScreenReader, routeTitle]);

  return {
    navigationRef,
    layoutState: {
      navigationHeight,
      isCreateGameRoute,
      shouldShowBottomNav,
      routeTitle,
    } as LayoutState,
  };
}
