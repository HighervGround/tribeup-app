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