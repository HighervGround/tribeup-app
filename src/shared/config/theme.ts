// Brand Colors - Centralized theme configuration (Strava-inspired muted palette)
// Updated to meet WCAG AA contrast requirements (orange-700: #C2410C)
export const brandColors = {
  primary: '#C2410C', // orange-700 - meets WCAG AA contrast with white text
  primaryHover: '#9A3412', // orange-800 for hover states
  primaryLight: '#EA580C', // orange-600 for lighter accents
  primaryDark: '#7C2D12', // orange-900 for dark variants
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
