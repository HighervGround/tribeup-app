// Analytics event type definitions

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any; // Allow additional custom properties
}

export interface PageViewEvent {
  page_path: string;
  page_title?: string;
  page_location?: string;
}

export interface UserProperties {
  user_id?: string;
  username?: string;
  email?: string;
  [key: string]: any;
}

// Common event categories
export enum EventCategory {
  AUTH = 'auth',
  GAMES = 'games',
  USER = 'user',
  NAVIGATION = 'navigation',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

// Common event actions
export enum EventAction {
  // Auth
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',
  SIGN_OUT = 'sign_out',
  
  // Games
  CREATE_GAME = 'create_game',
  JOIN_GAME = 'join_game',
  LEAVE_GAME = 'leave_game',
  VIEW_GAME = 'view_game',
  UPDATE_GAME = 'update_game',
  DELETE_GAME = 'delete_game',
  
  // User
  COMPLETE_ONBOARDING = 'complete_onboarding',
  UPDATE_PROFILE = 'update_profile',
  UPLOAD_AVATAR = 'upload_avatar',
  
  // Navigation
  PAGE_VIEW = 'page_view',
  SEARCH = 'search',
  FILTER = 'filter',
}
