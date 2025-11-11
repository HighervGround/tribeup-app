import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User,
  LucideIcon
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
    path: '/create', 
    icon: Plus, 
    label: 'Create',
    description: 'Create new activity',
    mobileOnly: true // Only show in mobile nav, desktop has dedicated button
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

// Filter helpers
export const getMobileNavItems = () => navigationItems.filter(item => !item.desktopOnly);
export const getDesktopNavItems = () => navigationItems.filter(item => !item.mobileOnly);

// Route title mapping
export const getRouteTitle = (pathname: string): string => {
  const item = navigationItems.find(item => item.path === pathname);
  if (item) return item.label;
  
  // Handle dynamic routes
  if (pathname.startsWith('/game/')) return 'Activity Details';
  if (pathname.startsWith('/chat/')) return 'Chat';
  if (pathname.startsWith('/user/')) return 'User Profile';
  if (pathname.startsWith('/settings')) return 'Settings';
  
  return 'Page';
};
