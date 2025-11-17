// Brand Colors - Centralized theme configuration (Strava-inspired muted palette)
export const brandColors = {
  primary: '#E85A2B', // Muted from #FA4616 (reduced saturation ~15%)
  primaryHover: '#D14A1F',
  primaryLight: '#F07A4F',
  primaryDark: '#C03D0A',
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
