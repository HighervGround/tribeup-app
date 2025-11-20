/**
 * Icon System - Centralized icon definitions
 * 
 * This file provides centralized icon definitions for sports, UI elements, and actions.
 * Based on Strava's icon system patterns.
 */

import {
  // Sports
  Basketball,
  Soccer,
  Tennis,
  Volleyball,
  Football,
  Baseball,
  // UI
  Search,
  Filter,
  Settings,
  User,
  Users,
  Calendar,
  MapPin,
  Clock,
  Star,
  Trophy,
  Activity,
  // Actions
  Plus,
  Edit,
  Trash,
  Share,
  Heart,
  MessageCircle,
  // Navigation
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  // Status
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  // Other
  MoreVertical,
  MoreHorizontal,
} from 'lucide-react';

/**
 * Sport Icons Mapping
 */
export const sportIcons = {
  basketball: Basketball,
  soccer: Soccer,
  tennis: Tennis,
  volleyball: Volleyball,
  football: Football,
  baseball: Baseball,
  // Additional sports can use emoji or custom icons
  pickleball: '🥒',
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  hiking: '🥾',
  rock_climbing: '🧗',
} as const;

/**
 * Sport Icon Colors
 */
export const sportIconColors: Record<string, string> = {
  basketball: '#FA4616',
  soccer: '#22884C',
  tennis: '#0021A5',
  volleyball: '#F2A900',
  football: '#6A2A60',
  baseball: '#D32737',
  pickleball: '#22884C',
  running: '#FA4616',
  cycling: '#22884C',
  swimming: '#0021A5',
  hiking: '#22884C',
  rock_climbing: '#FA4616',
};

/**
 * UI Icons Mapping
 */
export const uiIcons = {
  search: Search,
  filter: Filter,
  settings: Settings,
  user: User,
  users: Users,
  calendar: Calendar,
  mapPin: MapPin,
  clock: Clock,
  star: Star,
  trophy: Trophy,
  activity: Activity,
} as const;

/**
 * Action Icons Mapping
 */
export const actionIcons = {
  add: Plus,
  edit: Edit,
  delete: Trash,
  share: Share,
  like: Heart,
  comment: MessageCircle,
} as const;

/**
 * Navigation Icons Mapping
 */
export const navigationIcons = {
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
} as const;

/**
 * Status Icons Mapping
 */
export const statusIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
} as const;

/**
 * Icon Size Presets
 */
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

/**
 * Get Sport Icon
 * 
 * Returns the icon component or emoji for a given sport.
 */
export function getSportIcon(sport: string): typeof sportIcons[keyof typeof sportIcons] | string {
  return sportIcons[sport as keyof typeof sportIcons] || '🏀';
}

/**
 * Get Sport Icon Color
 * 
 * Returns the color for a given sport.
 */
export function getSportIconColor(sport: string): string {
  return sportIconColors[sport] || '#FA4616';
}

/**
 * Icon Usage Guidelines
 * 
 * - Use consistent sizing: xs (12px), sm (16px), md (20px), lg (24px), xl (32px), 2xl (48px)
 * - Sports icons: Use for sport-specific UI elements
 * - UI icons: Use for general interface elements
 * - Action icons: Use for user actions (buttons, menus)
 * - Navigation icons: Use for navigation and directional elements
 * - Status icons: Use for status indicators and feedback
 * 
 * Example:
 * ```tsx
 * import { getSportIcon, iconSizes } from '@/shared/config/iconSystem';
 * 
 * const BasketballIcon = getSportIcon('basketball');
 * <BasketballIcon size={iconSizes.md} className="text-primary" />
 * ```
 */

