# Tribes Domain

## Purpose
The Tribes system enables users to create and join persistent groups (tribes) for organizing activities. This mirrors Strava's club functionality and provides community-building features.

## Domain Score: 85/100

## Responsibilities

### Tribe Management
- Create, edit, and delete tribes
- Tribe discovery and search
- Public and private tribes
- Tribe settings and configuration

### Member Management
- Join/leave tribes
- Role-based permissions (member, moderator, admin)
- Member list and management
- Invitation system

### Tribe Games Integration
- Link games to tribes (optional)
- Filter games by tribe
- Tribe-organized game feed
- Statistics tracking

### Tribe Chat
- Multi-channel chat system
- Default channels (General, Announcements, Games)
- Custom channel creation
- Real-time messaging

### Statistics & Analytics
- Member count and growth
- Games organized count
- Active member metrics
- Participation trends

## Key Files

### Components
- `TribeList.tsx` - Browse and search tribes
- `TribeCard.tsx` - Tribe card for lists
- `TribeDetail.tsx` - Full tribe view with tabs
- `CreateTribe.tsx` - Tribe creation wizard
- `TribeChat.tsx` - Multi-channel chat interface
- `TribeMembers.tsx` - Member list and management
- `TribeGames.tsx` - Games organized by tribe
- `TribeStatistics.tsx` - Statistics dashboard

### Hooks
- `useTribes.ts` - Fetch tribes list, create/update/delete
- `useTribe.ts` - Single tribe data
- `useTribeMembers.ts` - Member management
- `useTribeActions.ts` - Combined actions hook
- `useTribeJoinToggle.ts` - Join/leave logic
- `useTribeGames.ts` - Tribe-organized games
- `useTribeStatistics.ts` - Stats calculation
- `useTribeChannels.ts` - Channel management
- `useTribeChat.ts` - Chat functionality
- `useTribeRealtime.ts` - Real-time updates

### Services
- `tribeService.ts` - Core CRUD operations
- `tribeMemberService.ts` - Member management
- `tribeChannelService.ts` - Channel operations

## Business Rules

### Tribe Creation
- Users can create unlimited tribes
- Must provide name and primary activity
- Creator automatically becomes admin
- Default channels created automatically

### Membership
- Public tribes: anyone can join
- Private tribes: invite only
- Users can be in multiple tribes
- Max members per tribe: 500 (configurable in settings)

### Permissions
- **Admins**: Full control (edit, delete, manage members, create channels)
- **Moderators**: Can manage members, create channels
- **Members**: Can post, create games, view content

### Games Integration
- Games can optionally link to tribe via `tribe_games` table
- Tribe games appear in tribe feed
- Statistics track tribe-organized games

## Database Tables

### Primary Tables
- `tribes` - Core tribe data (uses `activity` column, not `sport`)
- `tribe_members` - Member relationships with roles
- `tribe_games` - Link games to tribes (optional)
- `tribe_channels` - Chat channels within tribes
- `tribe_chat_messages` - Messages in tribe channels

### Views
- `tribe_member_details` - Members with profile data
- `tribe_statistics` - Aggregate statistics
- `tribe_chat_messages_with_author` - Messages with author info

## Integration Points

### Games Domain
- Games can be linked to tribes via `tribe_games` table
- Filter games by tribe in HomeScreen
- Show tribe badge on game cards (future enhancement)
- Tribe-organized game creation flow

### Users Domain
- Show user's tribes on profile
- Tribe membership in user stats
- Achievement: "Join first tribe", "Create tribe" (future)

### Locations Domain
- Location-based tribe discovery
- Tribe location on maps

## Real-time Features

### Supabase Realtime Subscriptions
- Tribe member updates (join/leave)
- Tribe chat messages
- Tribe statistics updates
- Game links to tribe

## Performance Considerations
- Use React Query for caching tribe data
- Implement optimistic updates for join/leave
- Real-time subscriptions only for active tribe views
- Pagination for tribe lists
- Index on location for distance queries

## Future Enhancements
- Tribe photo galleries
- Tribe events and competitions
- Tribe leaderboards
- Tribe achievements
- Advanced search and filtering
- Tribe recommendations based on user preferences
- Tribe analytics dashboard
- Export tribe data

