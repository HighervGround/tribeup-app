# Games Domain

## Purpose
The Game Management System is the core feature of TribeUp, handling the full lifecycle of sports activities from creation to completion.

## Domain Score: 90/100

## Responsibilities

### Game Creation & Management
- Multi-step game creation flow with sport-specific validations
- Support for recurring games and one-time events
- Weather-integrated planning for outdoor activities
- Auto-archive system for completed games

### Participant Management
- Join/leave game functionality with timing restrictions
- Real-time participant count updates
- Waitlist management for full games
- Participant status tracking (active, left, etc.)

### Game Discovery
- Location-based game recommendations
- Search and filtering by sport type, location, date
- Quick join functionality for nearby games
- Public game pages for easy sharing

### Social Features
- In-game chat with real-time updates
- Invite system for bringing friends
- Post-game ratings and reviews
- Game sharing via links

## Key Files

### Components
- `CreateGame.tsx` - Multi-step game creation wizard with validation
- `GameDetails.tsx` - Comprehensive game detail view with actions
- `UnifiedGameCard.tsx` - Reusable game card for lists
- `GameChat.tsx` / `EnhancedGameChat.tsx` - Real-time chat interface
- `HomeScreen.tsx` - Main game discovery feed
- `SearchDiscovery.tsx` - Advanced search and filtering
- `QuickJoinModal.tsx` - Fast join for nearby games
- `InviteModal.tsx` - Friend invitation system
- `ShareGameModal.tsx` - Social sharing functionality
- `PublicGamePage.tsx` - Public game view for non-authenticated users
- `WaitlistManager.tsx` - Waitlist handling for full games
- `PostGameRatingModal.tsx` - Post-game feedback collection

### Hooks
- `useGameActions.ts` - Core game actions (create, update, delete, join, leave)
- `useGames.ts` - Game data fetching and caching
- `useGamesWithCreators.ts` - Games with creator profile data
- `useGameJoinToggle.ts` - Join/leave toggle logic with optimistic updates
- `useGameRealtime.ts` - Real-time game updates via Supabase
- `useGameParticipants.ts` - Participant list management
- `useGameCard.ts` - Shared game card logic
- `useSimpleGames.ts` - Simplified game queries
- `usePublicGame.ts` - Public game access without auth

### Services
- `gameParticipantService.ts` - Participant CRUD operations
- `simpleGameService.ts` - Core game database operations

## Business Rules

### Timing Restrictions
- Games cannot be modified within 2 hours of start time
- Past games are automatically archived
- Participants can leave up to 2 hours before start

### Participant Limits
- Each game has min/max participant requirements
- Waitlist activates when game reaches capacity
- Creator counts toward participant limit

### Weather Integration
- Outdoor games show weather forecasts
- Weather warnings for unsuitable conditions
- Sport-specific weather thresholds

### Location Requirements
- All games must have a valid location
- Location stored as coordinates + address
- Distance calculations for discovery

## Dependencies on Other Domains

### Weather Domain
- Weather forecasts for outdoor games
- Suitability analysis for game timing

### Locations Domain
- Venue data and coordinates
- Distance calculations
- Map visualizations

### Users Domain
- Creator and participant profiles
- Achievement tracking for participation
- User preferences for game recommendations

## Common AI Prompts

### Game Creation
"Create a new game with validation for [sport type]"
"Add weather checking for outdoor game creation"
"Implement multi-step form with progress indicator"

### Participant Management
"Handle join game with optimistic updates"
"Implement waitlist when game is full"
"Add leave game with confirmation dialog"

### Real-time Features
"Add real-time participant count updates"
"Implement live chat with presence indicators"
"Show typing indicators in game chat"

### Discovery & Search
"Filter games by distance from user location"
"Search games by sport type and date range"
"Show recommended games based on user preferences"

## Database Tables

### Primary Tables
- `games` - Core game data
- `game_participants` - Participant tracking with status
- `game_chat_messages` - In-game chat messages
- `recurring_games` - Recurring game patterns
- `game_waitlist` - Waitlist management

### Related Tables
- `user_profiles` - Creator and participant profiles
- `venues` - Game location data
- `game_reviews` - Post-game ratings

## Performance Considerations
- Use React Query for caching game data
- Implement optimistic updates for join/leave
- Real-time subscriptions only for active game views
- Pagination for game lists
- Index on location for distance queries

