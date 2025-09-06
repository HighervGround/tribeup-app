import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { DesktopLayout } from './DesktopLayout';
import { Toaster } from './ui/sonner';
import { useResponsive } from './ui/use-responsive';
import { useAccessibility } from '../hooks/useAccessibility';
import { Button } from './ui/button';
import { HelpCircle, Keyboard } from 'lucide-react';
import { toast } from 'sonner';

export function AppContent() {
  const { isMobile } = useResponsive();
  const location = useLocation();
  const { announceToScreenReader } = useAccessibility();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

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

  const handleShowKeyboardShortcuts = () => {
    toast.info('Keyboard shortcuts coming soon!', {
      description: 'This feature will be available in a future update'
    });
  };

  // Render mobile layout
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>

          {/* Bottom navigation */}
          <BottomNavigation />

          {/* Keyboard shortcuts help button for mobile (hidden by default, shown on focus) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowKeyboardShortcuts}
            className="fixed bottom-20 right-4 opacity-0 focus:opacity-100 transition-opacity z-40 bg-background/80 backdrop-blur-sm border border-border"
            aria-label="Show keyboard shortcuts help"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
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

        {/* Desktop keyboard shortcuts help */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col gap-2 items-end">
            {/* Keyboard shortcuts help button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowKeyboardShortcuts}
              className="bg-background/95 backdrop-blur-sm border shadow-medium"
              title="Show keyboard shortcuts (coming soon)"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Shortcuts
            </Button>
          </div>
        </div>
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