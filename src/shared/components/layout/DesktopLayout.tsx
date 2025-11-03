import React, { useState } from 'react';
// import { motion } from 'framer-motion'; // TEMPORARILY DISABLED
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useNotifications } from '@/domains/users/hooks/useNotifications';
import { useAppStore } from '@/store/appStore';
import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User, 
  Menu, 
  Settings,
  MapPin,
  Users,
  Calendar
} from 'lucide-react';

const sidebarItems = [
  { 
    path: '/', 
    icon: Home, 
    label: 'Home', 
    description: 'Discover activities' 
  },
  { 
    path: '/search', 
    icon: Search, 
    label: 'Search', 
    description: 'Find activities' 
  },
  { 
    path: '/notifications', 
    icon: Bell, 
    label: 'Notifications', 
    description: 'Stay updated',
    showBadge: true 
  },
  { 
    path: '/profile', 
    icon: User, 
    label: 'Profile', 
    description: 'Your account' 
  },
];

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { user } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={`bg-card border-r border-border transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className={sidebarCollapsed ? 'px-4 py-4' : 'p-6 border-b border-border'}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl text-foreground">TribeUp</h1>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Find your tribe</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label="Collapse sidebar"
              >
                <Menu className="w-5 h-5" />
              </Button>
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
            onClick={() => navigate('/create')}
            className={`gap-3 text-white hover:opacity-90 ${
              sidebarCollapsed 
                ? 'w-10 h-10 p-0 justify-center mx-auto' 
                : 'w-full justify-start'
            }`}
            style={{ backgroundColor: '#FA4616', borderColor: '#FA4616' }}
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
                    {item.showBadge && unreadCount > 0 && (
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
                        {item.showBadge && unreadCount > 0 && (
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
              <Avatar className="cursor-pointer" onClick={() => navigate('/profile')}>
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
              <Avatar className="cursor-pointer w-8 h-8" onClick={() => navigate('/profile')}>
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