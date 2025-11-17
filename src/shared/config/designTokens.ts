/**
 * Design Tokens - Programmatic Access
 * 
 * This file provides TypeScript access to design tokens defined in CSS.
 * Use this for programmatic styling, calculations, or when CSS variables aren't sufficient.
 * 
 * Note: For most cases, prefer using CSS custom properties directly in your styles.
 */

/**
 * Spacing Scale (4pt grid system)
 */
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const;

/**
 * Border Radius Scale
 */
export const radius = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const;

/**
 * Shadow/Elevation System
 */
export const shadows = {
  none: 'none',
  subtle: '0 1px 3px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
  strong: '0 8px 24px rgba(0, 0, 0, 0.2)',
  large: '0 12px 32px rgba(0, 0, 0, 0.25)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Z-Index Scale (Layering System)
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  max: 9999,
} as const;

/**
 * Icon Size Scale
 */
export const iconSizes = {
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

/**
 * Animation Durations
 */
export const durations = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
} as const;

/**
 * Easing Functions
 */
export const easing = {
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  springBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Sport Colors
 */
export const sportColors = {
  basketball: '#FA4616',
  soccer: '#22884C',
  tennis: '#0021A5',
  volleyball: '#F2A900',
  football: '#6A2A60',
  baseball: '#D32737',
} as const;

/**
 * Status Colors
 */
export const statusColors = {
  upcoming: {
    color: '#0021A5',
    foreground: '#ffffff',
    bg: 'rgba(0, 33, 165, 0.1)',
  },
  inProgress: {
    color: '#F2A900',
    foreground: '#000000',
    bg: 'rgba(242, 169, 0, 0.1)',
  },
  completed: {
    color: '#343741',
    foreground: '#ffffff',
    bg: 'rgba(52, 55, 65, 0.1)',
  },
  cancelled: {
    color: '#D32737',
    foreground: '#ffffff',
    bg: 'rgba(211, 39, 55, 0.1)',
  },
} as const;

/**
 * Typography Scale
 */
export const typography = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '6xl': '3.75rem', // 60px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.6,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

/**
 * Breakpoints
 */
export const breakpoints = {
  mobile: '767px',
  tablet: '768px',
  tabletMax: '1023px',
  desktop: '1024px',
  desktopLarge: '1440px',
} as const;

/**
 * Brand Colors (UF)
 */
export const brandColors = {
  primary: '#FA4616',
  primaryHover: '#E63E14',
  primaryLight: '#FF6B3D',
  primaryDark: '#D32F02',
  secondary: '#0021A5',
  bottlebrush: '#D32737',
  alachua: '#F2A900',
  gator: '#22884C',
  darkBlue: '#002657',
  perennial: '#6A2A60',
  coolGrey11: '#343741',
  coolGrey3: '#C7C9C8',
  warmGrey1: '#D8D4D7',
} as const;

/**
 * Helper function to get CSS variable value
 * Usage: getCSSVar('--space-4') returns 'var(--space-4)'
 */
export function getCSSVar(variable: string): string {
  return `var(${variable})`;
}

/**
 * Helper function to get spacing value
 * Usage: getSpacing(4) returns '16px'
 */
export function getSpacing(value: keyof typeof spacing): string {
  return spacing[value];
}

/**
 * Helper function to get icon size
 * Usage: getIconSize('md') returns '20px'
 */
export function getIconSize(size: keyof typeof iconSizes): string {
  return iconSizes[size];
}

/**
 * Helper function to get sport color
 * Usage: getSportColor('basketball') returns '#FA4616'
 */
export function getSportColor(sport: keyof typeof sportColors): string {
  return sportColors[sport];
}

/**
 * Helper function to get status color
 * Usage: getStatusColor('upcoming') returns { color: '#0021A5', ... }
 */
export function getStatusColor(status: keyof typeof statusColors) {
  return statusColors[status];
}

/**
 * Helper function to get z-index value
 * Usage: getZIndex('modal') returns 1050
 */
export function getZIndex(layer: keyof typeof zIndex): number {
  return zIndex[layer];
}

/**
 * Type exports for use in components
 */
export type SpacingValue = keyof typeof spacing;
export type RadiusValue = keyof typeof radius;
export type ShadowValue = keyof typeof shadows;
export type ZIndexValue = keyof typeof zIndex;
export type IconSizeValue = keyof typeof iconSizes;
export type DurationValue = keyof typeof durations;
export type EasingValue = keyof typeof easing;
export type SportColorValue = keyof typeof sportColors;
export type StatusColorValue = keyof typeof statusColors;

