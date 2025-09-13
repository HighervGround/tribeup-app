import React, { useRef, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { DesktopLayout } from './DesktopLayout';
import { Toaster } from './ui/sonner';
import { useResponsive } from './ui/use-responsive';
import { useAccessibility } from '../hooks/useAccessibility';
import { toast } from 'sonner';

export function AppContent() {
  const { isMobile } = useResponsive();
  const location = useLocation();
  const { announceToScreenReader } = useAccessibility();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);
  
  // Navigation height calculation for proper scrolling
  const navigationRef = useRef<HTMLDivElement>(null);
  const [navigationHeight, setNavigationHeight] = useState(0);

  // Handle the fromOnboarding state to prevent redirect loops
  React.useEffect(() => {
    const locationState = location.state || window.history.state?.usr || {};
    console.log('AppContent: Current location state:', locationState);
    
    if (locationState.fromOnboarding && !hasCompletedOnboarding) {
      console.log('AppContent: Detected navigation from onboarding, marking as complete');
      setHasCompletedOnboarding(true);
      
      // Clear the state to prevent issues if user refreshes
      window.history.replaceState(
        { ...window.history.state, usr: { ...window.history.state?.usr, fromOnboarding: false } },
        ''
      );
    }
  }, [location.state, hasCompletedOnboarding]);

  // Announce route changes to screen readers
  React.useEffect(() => {
    const getRouteTitle = (pathname: string) => {
      if (pathname === '/') return 'Home';
      if (pathname === '/search') return 'Search';
      if (pathname === '/create') return 'Create Game';
      if (pathname === '/profile') return 'Profile';
      if (pathname.startsWith('/game/')) return 'Game Details';
      if (pathname.startsWith('/chat/')) return 'Chat';
      if (pathname.startsWith('/user/')) return 'User Profile';
      if (pathname.startsWith('/settings')) return 'Settings';
      return 'Page';
    };

    const title = getRouteTitle(location.pathname);
    announceToScreenReader(`Navigated to ${title}`);
    
    // Update document title
    document.title = `${title} - TribeUp`;
  }, [location.pathname, announceToScreenReader]);

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

  // Render mobile layout
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-background">
          {/* Main content area with proper scrolling */}
          <main style={{ paddingBottom: `${navigationHeight + 16}px` }}>
            <Outlet />
          </main>

          {/* Bottom navigation */}
          <BottomNavigation ref={navigationRef} />

        </div>

        {/* Toast notifications for mobile */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            className: 'animate-slide-in-down',
          }}
        />
      </>
    );
  }

  // Render desktop layout
  return (
    <>
      <div className="min-h-screen bg-background">
        <DesktopLayout>
          <main id="main-content" className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </DesktopLayout>

      </div>

      {/* Toast notifications for desktop */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          className: 'animate-slide-in-down',
        }}
      />
    </>
  );
}