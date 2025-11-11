import React from 'react';
import { BottomNavigation } from './BottomNavigation';
import { LayoutState } from '@/shared/hooks/useLayoutState';

interface MobileLayoutProps {
  children: React.ReactNode;
  navigationRef: React.RefObject<HTMLDivElement>;
  layoutState: LayoutState;
}

export function MobileLayout({ 
  children, 
  navigationRef, 
  layoutState 
}: MobileLayoutProps) {
  const { navigationHeight, shouldShowBottomNav } = layoutState;

  return (
    <div className="min-h-screen bg-background">
      {/* Main content area with proper scrolling */}
      <main 
        style={{ 
          paddingBottom: shouldShowBottomNav ? `${navigationHeight + 16}px` : '0px' 
        }}
        className="relative"
      >
        {children}
      </main>

      {/* Bottom navigation - conditionally rendered */}
      {shouldShowBottomNav && <BottomNavigation ref={navigationRef} />}
    </div>
  );
}
