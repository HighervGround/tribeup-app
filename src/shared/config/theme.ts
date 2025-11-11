// Brand Colors - Centralized theme configuration
export const brandColors = {
  primary: '#FA4616',
  primaryHover: '#E63E14',
  primaryLight: '#FF6B3D',
  primaryDark: '#D32F02',
} as const;

// Layout Constants
export const layoutConstants = {
  sidebar: {
    expanded: 'w-64',
    collapsed: 'w-16',
    transition: 'transition-all duration-300',
  },
  navigation: {
    height: {
      mobile: 80, // Base height for mobile bottom nav
      desktop: 64, // Desktop header height if needed
    },
    safeArea: 'pb-safe', // iOS safe area
  },
  toast: {
    offset: {
      mobile: 96, // Bottom nav height + padding
      desktop: 80,
    },
  },
} as const;

// CSS Custom Properties for consistent theming
export const cssVariables = {
  '--brand-primary': brandColors.primary,
  '--brand-primary-hover': brandColors.primaryHover,
  '--sidebar-width-expanded': '16rem',
  '--sidebar-width-collapsed': '4rem',
  '--nav-height-mobile': '5rem',
} as const;
