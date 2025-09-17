import React, { forwardRef } from 'react';
// import { motion } from 'framer-motion'; // TEMPORARILY DISABLED
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ClickableAvatar } from './ui/clickable-avatar';
import { useNotifications } from '../hooks/useNotifications';
import { useAppStore } from '../store/appStore';
import { Home, Search, Plus, Bell, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/create', icon: Plus, label: 'Create' },
  { path: '/notifications', icon: Bell, label: 'Notifications', showBadge: true },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNavigation = forwardRef<HTMLDivElement>((props, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { user } = useAppStore();

  return (
    <div ref={ref} className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-between px-4 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <div
              key={item.path}
              className="relative flex-1 flex justify-center"
            >
              <Button
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 h-auto w-full transition-all duration-200 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  {item.path === '/profile' && user ? (
                    <ClickableAvatar
                      src={user.avatar}
                      alt={user.name}
                      size="sm"
                      onClick={() => navigate('/profile')}
                      className="w-5 h-5"
                    />
                  ) : (
                    <Icon className="w-5 h-5" />
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
            </div>
          );
        })}
      </div>
      
      {/* Bottom safe area for mobile devices */}
      <div className="pb-safe bg-background/95" />
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';