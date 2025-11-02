# Users Domain

## Purpose
The User Engagement system manages user profiles, achievements, notifications, preferences, and feedback collection.

## Domain Score: 70/100

## Responsibilities

### Profile Management
- User profile CRUD operations
- Profile photo upload and management
- Sport preferences and skill levels
- Privacy settings

### Onboarding
- Multi-step onboarding flow
- Sport preference selection
- Skill level assessment
- Location setup

### Achievement System
- Track participation milestones
- Award badges for achievements
- Display achievement progress
- Achievement notifications

### Notification Management
- Push notification preferences
- Email notification settings
- In-app notification center
- Real-time notification delivery

### Feedback & Support
- User feedback collection
- Bug reporting
- Feature requests
- User testing surveys

### Settings & Preferences
- Account settings
- Accessibility options
- Notification preferences
- Privacy controls

## Key Files

### Components
- `UserProfile.tsx` - User profile view
- `EditProfile.tsx` - Profile editing form
- `OtherUserProfile.tsx` - View other user profiles
- `Onboarding.tsx` - Multi-step onboarding wizard
- `Settings.tsx` - Account settings page
- `AchievementBadge.tsx` - Individual achievement display
- `AchievementNotification.tsx` - Achievement unlock notification
- `AchievementProgressIndicator.tsx` - Progress bars for achievements
- `AchievementScore.tsx` - Overall achievement score display
- `NotificationSettings.tsx` - Notification preferences
- `AccessibilitySettings.tsx` - Accessibility options
- `FeedbackButton.tsx` - Floating feedback button
- `FeedbackPage.tsx` - Feedback submission form
- `SimpleSurvey.tsx` - Survey component
- `UserTestingSurvey.tsx` - User testing feedback
- `SimplePhotoUpload.tsx` - Profile photo upload

### Hooks
- `useUserProfile.ts` - User profile data fetching
- `useAchievements.ts` - Achievement tracking and display
- `useOnboardingCheck.ts` - Onboarding status checking
- `useNotifications.ts` - Notification management
- `usePushNotifications.ts` - Push notification setup
- `useUserPresence.ts` - Online/offline status
- `useAccessibility.ts` - Accessibility preferences
- `useUserTestingSurvey.ts` - Survey management

### Services
- `profileService.ts` - Profile CRUD operations
- `feedbackService.ts` - Feedback submission
- `eloService.ts` - Skill rating calculations
- `moderationService.ts` - Content moderation
- `photoService.ts` - Photo upload and management

## Business Rules

### Onboarding Requirements
- Users must complete onboarding before accessing app
- Minimum 1 sport preference required
- Profile photo optional but recommended
- Location optional but improves recommendations

### Achievement Types
- **First Timer**: Complete onboarding
- **Team Player**: Join first game
- **Social Butterfly**: Join 5 games
- **Regular**: Join 10 games
- **Veteran**: Join 25 games
- **Legend**: Join 50 games
- **Creator**: Create first game
- **Host**: Host 5 games
- **Organizer**: Host 10 games

### Profile Privacy
- Display name always visible
- Email address private
- Location shared only for game discovery
- Game history visible to participants

### Skill Rating (ELO)
- Initial rating: 1200
- Adjusted based on game participation
- Sport-specific ratings
- Displayed as skill level (Beginner/Intermediate/Advanced)

## Dependencies on Other Domains

### Games Domain
- Game participation for achievements
- Creator stats and history
- Participant profiles in game views

### Locations Domain
- User location preferences
- Favorite venues

### Weather Domain
- Weather preference settings

## Common AI Prompts

### Profile Management
"Update user profile with new photo"
"Validate profile data before saving"
"Show error if required fields missing"

### Achievements
"Check if user unlocked new achievement"
"Display achievement notification"
"Calculate achievement progress percentage"

### Onboarding
"Create multi-step onboarding flow"
"Save sport preferences to profile"
"Skip onboarding if already completed"

### Notifications
"Request push notification permission"
"Show unread notification count"
"Mark all notifications as read"

## Database Tables

### Primary Tables
- `user_profiles` - Core user profile data
- `achievements` - Achievement definitions
- `user_achievements` - User achievement progress
- `user_notifications` - Notification history
- `user_feedback` - Feedback submissions
- `user_stats` - Aggregate user statistics

### Related Tables
- `games` - Created and participated games
- `game_participants` - Participation history
- `user_presence` - Online/offline status

## Profile Data Structure
```typescript
interface UserProfile {
  id: string;
  auth_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  sport_preferences: string[];
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}
```

## Performance Considerations
- Cache user profile data in React Query
- Optimistic updates for profile edits
- Lazy load achievement images
- Batch notification fetches
- Use Supabase Storage for profile photos
- Compress images before upload

## Future Enhancements
- Social connections (friends/followers)
- Private messaging
- Team/group formation
- Customizable profile themes
- Integration with fitness trackers
- Verification badges for regular players
- Reputation system
- Player statistics dashboard

