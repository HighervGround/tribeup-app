# TribeUp Database Schema Documentation

**Last Updated:** November 18, 2025  
**Database Version:** PostgreSQL (Supabase)

This document serves as the definitive reference for all database objects in the TribeUp application.

---

## Table of Contents
1. [Tables](#tables)
2. [Views](#views)
3. [Materialized Views](#materialized-views)
4. [Functions](#functions)
5. [Triggers](#triggers)
6. [Policies (RLS)](#policies-rls)
7. [Extensions](#extensions)
8. [Storage Buckets](#storage-buckets)

---

## Tables

### Core Tables

#### `users`
- **Primary Key:** `id` (UUID)
- **Description:** Core user profiles for authenticated users
- **Key Columns:**
  - `email` (TEXT, UNIQUE, NOT NULL)
  - `username` (TEXT, UNIQUE)
  - `full_name` (TEXT)
  - `avatar_url` (TEXT)
  - `bio` (TEXT)
  - `location` (TEXT)
  - `preferred_sports` (TEXT[])
  - `role` (TEXT) - 'user', 'moderator', 'admin'
  - `reputation_score` (INTEGER, DEFAULT 100)
  - `onboarding_completed` (BOOLEAN)
  - `stats` (JSONB)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** email, username

#### `games`
- **Primary Key:** `id` (UUID)
- **Description:** Sports games/activities created by users
- **Key Columns:**
  - `title` (TEXT, NOT NULL)
  - `sport` (TEXT, NOT NULL)
  - `location` (TEXT, NOT NULL)
  - `latitude` (DECIMAL(10, 8))
  - `longitude` (DECIMAL(11, 8))
  - `date` (DATE, NOT NULL)
  - `time` (TIME, NOT NULL)
  - `duration` (TEXT)
  - `duration_minutes` (INTEGER)
  - `cost` (TEXT, DEFAULT 'FREE')
  - `max_players` (INTEGER, NOT NULL)
  - `current_players` (INTEGER, DEFAULT 0)
  - `description` (TEXT)
  - `image_url` (TEXT)
  - `skill_level` (TEXT)
  - `min_reputation` (INTEGER, DEFAULT 70)
  - `competitive_mode` (BOOLEAN, DEFAULT false)
  - `is_archived` (BOOLEAN, DEFAULT false)
  - `archived` (BOOLEAN, DEFAULT false)
  - `creator_id` (UUID, FK -> users.id)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** creator_id, sport, date, location

#### `game_participants`
- **Primary Key:** `id` (UUID)
- **Description:** Many-to-many relationship between users and games
- **Key Columns:**
  - `game_id` (UUID, FK -> games.id, ON DELETE CASCADE)
  - `user_id` (UUID, FK -> users.id, ON DELETE CASCADE)
  - `status` (TEXT) - 'joined', 'left', etc.
  - `joined_at` (TIMESTAMPTZ)
  - `left_at` (TIMESTAMPTZ)
  - `play_time_minutes` (INTEGER)
- **RLS:** Enabled
- **Constraints:** UNIQUE(game_id, user_id)
- **Indexes:** game_id, user_id

#### `chat_messages`
- **Primary Key:** `id` (UUID)
- **Description:** Game chat messages
- **Key Columns:**
  - `game_id` (UUID, FK -> games.id, ON DELETE CASCADE)
  - `user_id` (UUID, FK -> users.id, ON DELETE CASCADE)
  - `message` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** game_id, user_id, created_at

#### `notifications`
- **Primary Key:** `id` (UUID)
- **Description:** User notifications
- **Key Columns:**
  - `user_id` (UUID, FK -> users.id, ON DELETE CASCADE)
  - `type` (TEXT, NOT NULL)
  - `message` (TEXT, NOT NULL)
  - `read` (BOOLEAN, DEFAULT false)
  - `game_id` (UUID, FK -> games.id)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** user_id, read, created_at

#### `public_rsvps`
- **Primary Key:** `id` (UUID)
- **Description:** Anonymous RSVPs for games (non-authenticated users)
- **Key Columns:**
  - `game_id` (UUID, FK -> games.id, ON DELETE CASCADE)
  - `user_id` (UUID, nullable)
  - `guest_name` (TEXT)
  - `guest_email` (TEXT)
  - `attending` (BOOLEAN, DEFAULT true)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** game_id, guest_email

#### `activity_likes`
- **Primary Key:** `id` (UUID)
- **Description:** Like/kudos functionality for games
- **Key Columns:**
  - `user_id` (UUID, FK -> auth.users.id, ON DELETE CASCADE)
  - `activity_id` (UUID, FK -> games.id, ON DELETE CASCADE)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Constraints:** UNIQUE(user_id, activity_id)
- **Indexes:** activity_id, user_id

### Social/Connection Tables

#### `user_connections`
- **Primary Key:** `id` (UUID)
- **Description:** User following/friend relationships
- **Key Columns:**
  - `follower_id` (UUID, FK -> users.id, ON DELETE CASCADE)
  - `following_id` (UUID, FK -> users.id, ON DELETE CASCADE)
  - `status` (TEXT) - 'active', 'blocked', etc.
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Constraints:** UNIQUE(follower_id, following_id)
- **Indexes:** follower_id, following_id

### Tribes (Groups) Tables

#### `tribes`
- **Primary Key:** `id` (UUID)
- **Description:** User-created sports groups
- **Key Columns:**
  - `name` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `activity` (TEXT, NOT NULL)
  - `avatar_url` (TEXT)
  - `cover_image_url` (TEXT)
  - `creator_id` (UUID, FK -> users.id)
  - `is_public` (BOOLEAN, DEFAULT true)
  - `member_count` (INTEGER, DEFAULT 0)
  - `game_count` (INTEGER, DEFAULT 0)
  - `location` (TEXT)
  - `latitude` (DECIMAL)
  - `longitude` (DECIMAL)
  - `settings` (JSONB)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** creator_id, activity, is_public

#### `tribe_members`
- **Primary Key:** `id` (UUID)
- **Description:** Tribe membership
- **Key Columns:**
  - `tribe_id` (UUID, FK -> tribes.id, ON DELETE CASCADE)
  - `user_id` (UUID, FK -> users.id, ON DELETE CASCADE)
  - `role` (TEXT) - 'owner', 'admin', 'member'
  - `status` (TEXT) - 'active', 'invited', 'left'
  - `joined_at` (TIMESTAMPTZ)
  - `invited_by` (UUID, FK -> users.id)
- **RLS:** Enabled
- **Constraints:** UNIQUE(tribe_id, user_id)
- **Indexes:** tribe_id, user_id, status

#### `tribe_channels`
- **Primary Key:** `id` (UUID)
- **Description:** Chat channels within tribes
- **Key Columns:**
  - `tribe_id` (UUID, FK -> tribes.id, ON DELETE CASCADE)
  - `name` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `type` (TEXT) - 'text', 'announcements'
  - `created_by` (UUID, FK -> users.id)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** tribe_id

#### `tribe_chat_messages`
- **Primary Key:** `id` (UUID)
- **Description:** Messages in tribe channels
- **Key Columns:**
  - `channel_id` (UUID, FK -> tribe_channels.id, ON DELETE CASCADE)
  - `user_id` (UUID, FK -> users.id, ON DELETE CASCADE)
  - `message` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Indexes:** channel_id, user_id, created_at

#### `tribe_games`
- **Primary Key:** `id` (UUID)
- **Description:** Association between tribes and games
- **Key Columns:**
  - `tribe_id` (UUID, FK -> tribes.id, ON DELETE CASCADE)
  - `game_id` (UUID, FK -> games.id, ON DELETE CASCADE)
  - `created_at` (TIMESTAMPTZ)
- **RLS:** Enabled
- **Constraints:** UNIQUE(tribe_id, game_id)
- **Indexes:** tribe_id, game_id

---

## Views

All views listed below have been updated to **Owner: `pg_database_owner`** (as of November 18, 2025)

### `activity_like_counts`
- **Owner:** `pg_database_owner`
- **Description:** Aggregated count of likes per activity
- **Columns:** 
  - `activity_id` (UUID)
  - `like_count` (BIGINT)
- **Access:** GRANT SELECT TO authenticated, anon

### `chat_messages_with_author`
- **Owner:** `pg_database_owner`
- **Description:** Chat messages joined with user profile information to avoid N+1 queries
- **Columns:**
  - `id` (UUID)
  - `game_id` (UUID)
  - `user_id` (UUID)
  - `message` (TEXT)
  - `created_at` (TIMESTAMPTZ)
  - `display_name` (TEXT) - computed from full_name or username
  - `username` (TEXT)
  - `avatar_url` (TEXT)
- **Source:** `chat_messages` LEFT JOIN `user_public_profile`
- **Access:** GRANT SELECT TO authenticated, anon
- **Migration:** `20250121000001_create_chat_messages_with_author_view.sql`

### `creator_profile`
- **Owner:** `pg_database_owner`
- **Description:** Public user profile view with computed display_name
- **Columns:**
  - `id` (UUID)
  - `username` (TEXT)
  - `full_name` (TEXT)
  - `display_name` (TEXT) - COALESCE(full_name, username)
  - `avatar_url` (TEXT)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)
- **Source:** `users`
- **Access:** GRANT SELECT TO authenticated, anon
- **Usage:** Used as creator_profile relationship in games queries
- **Migration:** `20250120000011_create_creator_profile_view.sql`

### `friend_suggestions`
- **Owner:** `pg_database_owner`
- **Description:** Intelligent friend suggestions based on common games played
- **Columns:**
  - `id` (UUID)
  - `display_name` (TEXT) - COALESCE(full_name, username, email prefix)
  - `username` (TEXT)
  - `avatar_url` (TEXT)
  - `bio` (TEXT)
  - `common_games_count` (BIGINT)
  - `shared_games` (UUID[])
  - `is_following` (BOOLEAN)
- **Source:** Common games CTE joined with users and user_connections
- **Access:** GRANT SELECT TO authenticated
- **Security:** security_barrier = true
- **Limit:** 20 suggestions, ordered by common_games_count DESC
- **Migration:** `20251116000000_fix_friend_suggestions_view.sql`

### `game_private_confirmed_count`
- **Owner:** `pg_database_owner`
- **Description:** Count of confirmed private game participants
- **Note:** Details to be verified in migration files

### `games_friend_counts`
- **Owner:** `pg_database_owner`
- **Description:** Count of friends participating in each game
- **Note:** Details to be verified in migration files

### `games_with_counts`
- **Owner:** `pg_database_owner`
- **Description:** Primary view for game listings with real-time participant counts
- **Key Columns:**
  - All columns from `games` table
  - `duration_minutes` (INTEGER) - for frontend integer handling
  - `current_players` (INTEGER) - authenticated participants with status='joined'
  - `public_rsvp_count` (INTEGER) - anonymous RSVPs with attending=true
  - `total_players` (INTEGER) - current_players + public_rsvp_count
  - `available_spots` (INTEGER) - max_players - total_players (minimum 0)
- **Source:** `games` LEFT JOIN LATERAL subqueries for counts
- **Access:** GRANT SELECT TO authenticated, anon
- **Migration:** `20250111000000_add_duration_minutes_to_games_with_counts_view.sql`

### `public_rsvps` (View)
- **Owner:** `pg_database_owner`
- **Description:** Public view of RSVPs (may also exist as a table)
- **Note:** Used for unauthenticated user access to game participation

### `tribe_chat_messages_with_author`
- **Owner:** `pg_database_owner`
- **Description:** Tribe chat messages with author profile information
- **Columns:**
  - `id` (UUID)
  - `channel_id` (UUID)
  - `user_id` (UUID)
  - `message` (TEXT)
  - `created_at` (TIMESTAMPTZ)
  - `display_name` (TEXT)
  - `username` (TEXT)
  - `avatar_url` (TEXT)
- **Source:** `tribe_chat_messages` LEFT JOIN `user_profiles`
- **Access:** GRANT SELECT TO authenticated
- **Migration:** `20250122000000_create_tribes_system.sql`

### `tribe_member_details`
- **Owner:** `pg_database_owner`
- **Description:** Tribe members with full user profile data
- **Columns:**
  - `id` (UUID)
  - `tribe_id` (UUID)
  - `user_id` (UUID)
  - `role` (TEXT)
  - `status` (TEXT)
  - `joined_at` (TIMESTAMPTZ)
  - `invited_by` (UUID)
  - `display_name` (TEXT)
  - `username` (TEXT)
  - `avatar_url` (TEXT)
  - `email` (TEXT)
- **Source:** `tribe_members` JOIN `user_profiles`
- **Filter:** WHERE status = 'active'
- **Access:** GRANT SELECT TO authenticated
- **Migration:** `20250122000000_create_tribes_system.sql`

### `tribe_statistics`
- **Owner:** `pg_database_owner`
- **Description:** Aggregated statistics for each tribe
- **Columns:**
  - `tribe_id` (UUID)
  - `name` (TEXT)
  - `activity` (TEXT)
  - `member_count` (INTEGER) - from tribes table
  - `game_count` (INTEGER) - from tribes table
  - `actual_game_count` (BIGINT) - COUNT of tribe_games
  - `active_member_count` (BIGINT) - COUNT of active members
  - `last_game_date` (TIMESTAMPTZ) - MAX game created_at
  - `next_game_date` (DATE) - MIN upcoming game date
- **Source:** `tribes` LEFT JOIN `tribe_members`, `tribe_games`, `games`
- **Access:** GRANT SELECT TO authenticated
- **Migration:** `20250122000000_create_tribes_system.sql`

### `user_public_profile`
- **Owner:** `pg_database_owner`
- **Description:** Public-facing user profile information
- **Note:** Details to be verified - likely similar to creator_profile

---

## Materialized Views

### `rsvp_counts_mview`
- **Owner:** `pg_database_owner`
- **Description:** Materialized view for optimized RSVP counting
- **Refresh Strategy:** To be determined based on implementation
- **Note:** Details to be verified in migration files

---

## Functions

### `set_rsvp_user_id()`
- **Returns:** TRIGGER
- **Description:** Automatically sets user_id on RSVP insert from auth.uid()
- **Security:** DEFINER
- **Language:** plpgsql
- **Usage:** Allows clients to omit user_id in RSVP payloads
- **Migration:** `20250124000000_fix_activity_likes_rls_and_rsvp_trigger.sql`

### Game Management Functions
- Various functions for game creation, updates, and participant management
- See individual migration files for specifics

---

## Triggers

### `set_rsvp_user_id_tg`
- **Table:** `rsvps`
- **Timing:** BEFORE INSERT
- **For Each:** ROW
- **Function:** `set_rsvp_user_id()`
- **Migration:** `20250124000000_fix_activity_likes_rls_and_rsvp_trigger.sql`

---

## Policies (RLS)

All tables have Row Level Security (RLS) enabled. Key policy patterns:

### Users Table
- Users can view their own profile
- Public profile data visible to all
- Users can update their own profile

### Games Table
- All authenticated users can view games
- Game creators can update their own games
- Games cannot be modified within 2 hours of start time

### Game Participants
- Users can join/leave games
- Participants can view other participants
- Status tracking for join/leave actions

### Chat Messages
- Participants can view messages for their games
- Users can post messages to games they've joined

### Activity Likes
- `likes_read`: Authenticated users can view all likes
- `likes_write`: Users can insert their own likes
- `likes_delete_own`: Users can delete their own likes

### Tribes
- Public tribes visible to all
- Private tribes visible only to members
- Owners/admins can manage tribe settings

---

## Extensions

### Installed Extensions
- `uuid-ossp` - UUID generation
- `postgis` - Geospatial data support (if enabled)

---

## Storage Buckets

### `avatars`
- **Public:** Yes
- **File Size Limit:** 5MB
- **Allowed MIME Types:** image/jpeg, image/png, image/webp, image/gif
- **Policies:**
  - Users can upload their own avatars
  - Users can update their own avatars
  - Users can delete their own avatars
  - Anyone can view avatars (public bucket)

### `game-images`
- **Public:** Yes
- **File Size Limit:** 10MB
- **Allowed MIME Types:** image/jpeg, image/png, image/webp, image/gif
- **Policies:**
  - Authenticated users can upload game images
  - Users can update game images they uploaded
  - Users can delete game images they uploaded
  - Anyone can view game images

---

## Important Notes

### Database Object Ownership
**Last Update: November 18, 2025**

The following database objects have been updated to use `pg_database_owner` for improved security and permission management:
- All views listed in the Views section above
- `rsvp_counts_mview` materialized view

This ensures proper isolation and security in the Supabase hosted environment.

### Key Business Rules Enforced by Database
1. Games cannot be modified within 2 hours of start time
2. game_participants has UNIQUE constraint on (game_id, user_id) to prevent duplicate joins
3. All games must have valid creator_id
4. Real-time updates enabled for active game subscriptions

### Migration Strategy
- Migrations are located in `supabase/migrations/`
- Simplified migrations available in `supabase/simplified_migrations/`
- Always test migrations in development before production
- Maintain backward compatibility for views used by frontend

---

## Maintenance Tasks

### Regular Tasks
- [ ] Refresh materialized views as needed
- [ ] Monitor view performance
- [ ] Audit RLS policies for security
- [ ] Review and optimize indexes
- [ ] Clean up archived games periodically

### When Adding New Database Objects
1. Create migration file with timestamp
2. Update this document with full details
3. Update `database.types.ts` if needed
4. Test in development environment
5. Document any new RLS policies
6. Grant appropriate permissions
7. Add to relevant READMEs in domain folders

---

**Document Maintainer:** This document should be updated whenever database schema changes are made.


