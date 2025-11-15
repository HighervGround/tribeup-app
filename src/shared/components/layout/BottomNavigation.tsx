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

  return (
    <div ref={ref} className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-40">
      <div className="flex items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-3 px-0 h-auto flex-1 rounded-none transition-all duration-200 focus:ring-0 focus:ring-offset-0 shadow-none ${
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-700 dark:text-muted-foreground hover:text-black dark:hover:text-foreground'
              }`}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                {item.path === '/profile' && safeUser ? (
                  <div onClick={() => navigate('/profile')} className="cursor-pointer">
                    <CurrentUserAvatar size="sm" className="w-8 h-8" />
                  </div>
                ) : (
                  <Icon className="w-8 h-8" />
                )}
                {item.showBadge && unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px]"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              
              <span className="text-xs font-medium">
                {item.label}
              </span>
              
              {/* Active indicator - only show for meaningful active states */}
              {isActive && (
                <div
                  className="absolute -top-1 left-1/2 w-1 h-1 bg-primary rounded-full transition-all duration-200"
                  style={{ transform: 'translateX(-50%)' }}
                />
              )}
            </Button>
          );
        })}
      </div>
      
      {/* Bottom safe area for mobile devices */}
      <div className="pb-safe bg-background/95" />
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';