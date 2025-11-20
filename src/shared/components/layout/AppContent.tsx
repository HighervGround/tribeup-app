import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { useResponsive } from '@/shared/hooks/useResponsive';
import { useLayoutState } from '@/shared/hooks/useLayoutState';

function AppContent() {
  const { isMobile } = useResponsive();
  const { navigationRef, layoutState } = useLayoutState();
  const location = useLocation();

  // Scroll to top on route change - first line of defense
  useEffect(() => {
    // Scroll immediately on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isMobile) {
    return (
      <MobileLayout 
        navigationRef={navigationRef}
        layoutState={layoutState}
      >
        <Outlet />
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout>
      <Outlet />
    </DesktopLayout>
  );
}

export default AppContent;