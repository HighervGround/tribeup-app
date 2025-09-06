import React from 'react';
// import { motion } from 'framer-motion'; // TEMPORARILY DISABLED
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useNotifications } from '../hooks/useNotifications';
import { Home, Search, Plus, Bell, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/create', icon: Plus, label: 'Create' },
  { path: '/notifications', icon: Bell, label: 'Notifications', showBadge: true },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <div
              key={item.path}
              className="relative"
            >
              <Button
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 h-auto min-w-[50px] transition-all duration-200 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
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
                
                {/* Active indicator */}
                <div
                  className={`absolute -top-1 left-1/2 w-1 h-1 bg-primary rounded-full transition-all duration-200 ${
                    isActive ? 'scale-100' : 'scale-0'
                  }`}
                  style={{ transform: 'translateX(-50%)' }}
                />
                
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-primary/10 rounded-lg scale-0 opacity-0 transition-all duration-200" />
              </Button>
            </div>
          );
        })}
      </div>
      
      {/* Bottom safe area for mobile devices */}
      <div className="h-safe-area-inset-bottom bg-background/95" />
    </div>
  );
}