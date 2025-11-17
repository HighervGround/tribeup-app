/**
 * UI Components Barrel Export
 * 
 * Centralized exports for all shared UI components.
 * Use this for cleaner imports throughout the application.
 */

// Facepile
export { Facepile } from './facepile';
export type { FacepileProps, FacepileUser } from './facepile';

// Empty States
export {
  EmptyStateEnhanced,
  NoGamesFound,
  NoPlayersFound,
  NoUpcomingGames,
  EmptyLeaderboard,
  ErrorState,
  OnboardingWelcome,
} from './empty-state-enhanced';
export type {
  EmptyStateEnhancedProps,
  EmptyStateVariant,
  EmptyStateAction,
} from './empty-state-enhanced';

// Leaderboard
export { Leaderboard } from './leaderboard/Leaderboard';
export type { LeaderboardProps, LeaderboardPlayer } from './leaderboard/Leaderboard';
export { LeaderboardRow } from './leaderboard/LeaderboardRow';
export type { LeaderboardRowProps } from './leaderboard/LeaderboardRow';
export { LeaderboardHeader } from './leaderboard/LeaderboardHeader';
export type { LeaderboardHeaderProps, LeaderboardColumn } from './leaderboard/LeaderboardHeader';

// Stats
export { StatCard } from './stats/StatCard';
export type { StatCardProps } from './stats/StatCard';
export { StatGroup } from './stats/StatGroup';
export type { StatGroupProps } from './stats/StatGroup';
export { ProgressCard } from './stats/ProgressCard';
export type { ProgressCardProps } from './stats/ProgressCard';

// Wizard
export { Wizard } from './wizard/Wizard';
export type { WizardProps, WizardStep as WizardStepType } from './wizard/Wizard';
export { WizardStep } from './wizard/WizardStep';
export type { WizardStepProps } from './wizard/WizardStep';
export { WizardProgress } from './wizard/WizardProgress';
export type { WizardProgressProps } from './wizard/WizardProgress';

// Feed
export { FeedItem } from './feed/FeedItem';
export type { FeedItemProps, FeedActionType } from './feed/FeedItem';
export { FeedCard } from './feed/FeedCard';
export type { FeedCardProps } from './feed/FeedCard';

