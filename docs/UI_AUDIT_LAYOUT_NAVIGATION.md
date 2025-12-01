Project Path: layout

Source Tree:

```txt
layout
├── AppContent.tsx
├── BottomNavigation.tsx
├── DesktopLayout.tsx
└── MobileLayout.tsx

```

`AppContent.tsx`:

```tsx
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
```

`BottomNavigation.tsx`:

```tsx
import { forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { CurrentUserAvatar } from '@/shared/components/common/current-user-avatar';
import { useNotifications } from '@/domains/users/hooks/useNotifications';
import { useAppStore } from '@/store/appStore';
import { getMobileNavItems } from '@/shared/config/navigation';


export const BottomNavigation = forwardRef<HTMLDivElement>((_props, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use safe defaults to prevent white screen on refresh
  const notifications = useNotifications();
  const { user } = useAppStore();
  
  // Provide fallbacks if hooks return undefined/null
  const unreadCount = notifications?.unreadCount || 0;
  const safeUser = user || null;
  
  const navItems = getMobileNavItems();

  // Helper to check if nav item is active
  const isNavItemActive = (itemPath: string, currentPath: string) => {
    // Exact match
    if (currentPath === itemPath) return true;
    // Home route: also match /app and /app/
    if (itemPath === '/app' && (currentPath === '/app' || currentPath === '/app/')) return true;
    return false;
  };

  return (
    <div ref={ref} className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-40">
      <nav className="flex items-stretch max-w-lg mx-auto" role="navigation" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item.path, location.pathname);
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 h-auto flex-1 rounded-none transition-colors duration-150 shadow-none group ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center w-6 h-6">
                {item.path === '/profile' && safeUser ? (
                  <CurrentUserAvatar size="sm" className={isActive ? 'scale-110 transition-transform duration-200' : 'transition-transform duration-200'} />
                ) : (
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform duration-150`} />
                )}
                {(item.showBadge || item.path === '/notifications') && unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center min-w-[16px] rounded-full"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              
              <span className={`text-[11px] font-medium leading-tight ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              
              {/* Active indicator - subtle top border */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full" aria-hidden="true" />
              )}
            </Button>
          );
        })}
      </nav>
      
      {/* Bottom safe area for mobile devices */}
      <div className="pb-safe bg-background/95" />
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
```

`DesktopLayout.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useNotifications } from '@/domains/users/hooks/useNotifications';
import { useAppStore } from '@/store/appStore';
import { Plus, Menu } from 'lucide-react';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';
import { getDesktopNavItems } from '@/shared/config/navigation';
import { brandColors, layoutConstants } from '@/shared/config/theme';


export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { user } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const sidebarItems = getDesktopNavItems();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={`bg-card border-r border-border ${layoutConstants.sidebar.transition} ${
          sidebarCollapsed ? layoutConstants.sidebar.collapsed : layoutConstants.sidebar.expanded
        }`}
      >
        {/* Sidebar Header */}
        <div className={sidebarCollapsed ? 'px-4 py-4' : 'p-6 border-b border-border'}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-xl text-foreground">TribeUp</h1>
                  <p className="text-sm text-muted-foreground">Find your tribe</p>
                </div>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  aria-label="Collapse sidebar"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
              {/* Close outer flex container */}
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Expand sidebar"
              className="w-10 h-10 p-0 mx-auto"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Quick Create Button */}
        <div className="p-4">
          <Button
            onClick={() => navigate('/app/create')}
            className={`gap-3 text-white hover:opacity-90 ${
              sidebarCollapsed 
                ? 'w-10 h-10 p-0 justify-center mx-auto' 
                : 'w-full justify-start'
            }`}
            style={{ 
              backgroundColor: brandColors.primary, 
              borderColor: brandColors.primary
            }}
            aria-label="Create new game"
          >
            <Plus className="w-5 h-5" />
            {!sidebarCollapsed && 'Create Activity'}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-2" role="menubar">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <div
                key={item.path}
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`gap-3 h-10 relative ${
                    sidebarCollapsed 
                      ? 'w-10 p-0 justify-center mx-auto' 
                      : 'w-full justify-start px-4'
                  } ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {(item.showBadge || item.path === '/notifications') && unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-xs flex items-center justify-center"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-medium flex items-center gap-2">
                        {item.label}
                        {(item.showBadge || item.path === '/notifications') && unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 px-2 text-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Button>
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={`border-t border-border ${sidebarCollapsed ? 'px-4 py-4' : 'p-4'}`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <Avatar className="cursor-pointer" onClick={() => navigate('/app/profile')}>
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || 'User'} />}
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.username ? `@${user.username}` : '@user'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto">
              <Avatar className="cursor-pointer w-8 h-8" onClick={() => navigate('/app/profile')}>
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || 'User'} />}
                <AvatarFallback className="text-xs">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
```

`MobileLayout.tsx`:

```tsx
import React from 'react';
import { BottomNavigation } from './BottomNavigation';
import { LayoutState } from '@/shared/hooks/useLayoutState';
import { FloatingActionButton } from '@/shared/components/common/FloatingActionButton';

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

      {/* Floating Action Button for Create */}
      <FloatingActionButton />

      {/* Bottom navigation - conditionally rendered */}
      {shouldShowBottomNav && <BottomNavigation ref={navigationRef} />}
    </div>
  );
}

```