import { Outlet } from 'react-router-dom';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { useResponsive } from '@/shared/hooks/useResponsive';
import { useLayoutState } from '@/shared/hooks/useLayoutState';

function AppContent() {
  const { isMobile } = useResponsive();
  const { navigationRef, layoutState } = useLayoutState();

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