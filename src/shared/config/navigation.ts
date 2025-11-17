import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User,
  Users,
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
    path: '/tribes', 
    icon: Users, 
    label: 'Tribes', 
    description: 'Join communities' 
  },
  { 
    path: '/profile', 
    icon: User, 
    label: 'Profile', 
    description: 'Your account' 
  },
  // Create moved to floating action button
  // Notifications moved to profile menu
  { 
    path: '/create', 
    icon: Plus, 
    label: 'Create',
    description: 'Create new activity',
    mobileOnly: false, // Show in both mobile and desktop
    desktopOnly: false
  },
  { 
    path: '/notifications', 
    icon: Bell, 
    label: 'Notifications', 
    description: 'Stay updated',
    showBadge: true,
    desktopOnly: false // Show in mobile nav too
  },
];

// Filter helpers
export const getMobileNavItems = () => {
  // Show Home, Create, Notifications, Tribes, Profile in mobile bottom nav (5 items)
  return navigationItems.filter(item => 
    !item.desktopOnly && 
    ['/', '/create', '/notifications', '/tribes', '/profile'].includes(item.path)
  );
};
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
  if (pathname.startsWith('/tribe/')) return 'Tribe';
  if (pathname === '/tribe/create') return 'Create Tribe';
  
  return 'Page';
};
