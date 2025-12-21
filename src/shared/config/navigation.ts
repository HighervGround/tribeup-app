import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User,
  Users,
  LucideIcon,
  Shield
} from 'lucide-react';

export interface NavigationItem {
  path: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  showBadge?: boolean;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

export const navigationItems: NavigationItem[] = [
  { 
    path: '/app', 
    icon: Home, 
    label: 'Home', 
    description: 'Discover activities' 
  },
  { 
    path: '/app/search', 
    icon: Search, 
    label: 'Search', 
    description: 'Find activities' 
  },
  { 
    path: '/app/tribes', 
    icon: Users, 
    label: 'Tribes', 
    description: 'Join communities' 
  },
  { 
    path: '/app/profile', 
    icon: User, 
    label: 'Profile', 
    description: 'Your account' 
  },
  // Create moved to floating action button
  // Notifications moved to profile menu
  { 
    path: '/app/create', 
    icon: Plus, 
    label: 'Create',
    description: 'Create new activity',
    mobileOnly: false, // Show in both mobile and desktop
    desktopOnly: false
  },
  { 
    path: '/app/notifications', 
    icon: Bell, 
    label: 'Notifications', 
    description: 'Stay updated',
    showBadge: true,
    desktopOnly: false // Show in mobile nav too
  },
  { 
    path: '/app/admin', 
    icon: Shield, 
    label: 'Admin', 
    description: 'Manage platform',
    desktopOnly: true // Desktop only
  },
];

// Filter helpers
export const getMobileNavItems = () => {
  // Show Home, Create, Notifications, Tribes, Profile in mobile bottom nav (5 items)
  return navigationItems.filter(item => 
    !item.desktopOnly && 
    ['/app', '/app/create', '/app/notifications', '/app/tribes', '/app/profile'].includes(item.path)
  );
};
export const getDesktopNavItems = () => navigationItems.filter(item => !item.mobileOnly);

// Route title mapping
export const getRouteTitle = (pathname: string): string => {
  const item = navigationItems.find(item => item.path === pathname);
  if (item) return item.label;
  
  // Handle dynamic routes
  if (pathname.startsWith('/app/game/')) return 'Activity Details';
  if (pathname.startsWith('/app/chat/')) return 'Chat';
  if (pathname.startsWith('/app/user/')) return 'User Profile';
  if (pathname.startsWith('/app/settings')) return 'Settings';
  if (pathname.startsWith('/app/tribe/')) return 'Tribe';
  if (pathname === '/app/tribe/create') return 'Create Tribe';
  
  return 'Page';
};
