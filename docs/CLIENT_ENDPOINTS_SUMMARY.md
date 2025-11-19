# Client Endpoints Summary

## 📊 Analysis Complete

Based on scanning all `.from()` calls in your codebase, here's what your client is actually calling:

## 🎯 Core Tables Used

### High-Traffic Tables (Most Called)
1. **`games`** - 20+ calls
   - SELECT: Game details, lists, search
   - INSERT: Create new games
   - UPDATE: Edit game details
   - DELETE: Cancel games

2. **`game_participants`** - 15+ calls
   - SELECT: Check if joined, get participant lists
   - INSERT: **JOIN GAMES** ← CRITICAL
   - DELETE: **LEAVE GAMES** ← CRITICAL

3. **`users`** - 25+ calls
   - SELECT: Profile data, search, lists
   - INSERT: User registration
   - UPDATE: Profile updates
   - UPSERT: Auth sync

4. **`chat_messages`** - 5+ calls
   - SELECT: Load game chat history
   - INSERT: **SEND MESSAGES** ← CRITICAL
   - DELETE: Remove messages

5. **`activity_likes`** - 4+ calls
   - SELECT: Get like counts
   - INSERT: **LIKE ACTIVITY** ← CRITICAL
   - DELETE: **UNLIKE ACTIVITY** ← CRITICAL

### Tribe System Tables
6. **`tribes`** - 10+ calls
   - SELECT: Tribe lists, details
   - INSERT: Create tribes
   - UPDATE: Edit tribe settings
   - DELETE: Remove tribes

7. **`tribe_members`** - 8+ calls
   - SELECT: Member lists, permissions
   - INSERT: Join tribe
   - UPDATE: Change roles
   - DELETE: Leave tribe

8. **`tribe_channels`** - 6+ calls
   - SELECT: Channel lists
   - INSERT: Create channels
   - UPDATE: Edit channels
   - DELETE: Remove channels

9. **`tribe_chat_messages`** - 5+ calls
   - SELECT: Load tribe chat
   - INSERT: **POST TO TRIBE** ← CRITICAL

10. **`tribe_games`** - 3+ calls
    - SELECT: Games linked to tribe
    - INSERT: Link game to tribe
    - DELETE: Unlink game

### Social/Friend Tables
11. **`user_connections`** - 8+ calls
    - SELECT: Follow lists, friend status
    - INSERT: Follow user
    - DELETE: Unfollow user

12. **`notifications`** - 6+ calls
    - SELECT: User notifications
    - INSERT: Create notifications
    - UPDATE: Mark as read
    - DELETE: Clear notifications

## 📈 Critical Views Used

### Must Work (Called Frequently)
1. **`games_with_counts`** - 15+ calls
   - Used by: Home page, search, game lists
   - Columns: All game fields + current_players, total_players, available_spots

2. **`activity_like_counts`** - 3+ calls
   - Used by: Activity cards, detail pages
   - Columns: activity_id, like_count

3. **`tribe_chat_messages_with_author`** - 2+ calls
   - Used by: Tribe chat UI
   - Columns: message fields + author profile data

### Nice to Have (Less Critical)
4. **`chat_messages_with_author`** - 1+ call
   - Used by: Game chat UI
   - Columns: message fields + author profile data

5. **`friend_suggestions`** - 1 call
   - Used by: Friend discovery
   - Columns: suggested user profiles

6. **`games_friend_counts`** - 1 call
   - Used by: Show which friends joined
   - Columns: game_id, friends_joined count

7. **`tribe_member_details`** - 1 call
   - Used by: Tribe member lists
   - Columns: member data + user profile

8. **`tribe_statistics`** - 1 call
   - Used by: Tribe overview
   - Columns: aggregate tribe metrics

## 🔴 Critical Permissions Needed

### For JOIN GAMES to work:
```sql
GRANT INSERT, DELETE ON game_participants TO authenticated;
```

### For ACTIVITY LIKES to work:
```sql
GRANT SELECT ON activity_likes TO anon, authenticated;
GRANT INSERT, DELETE ON activity_likes TO authenticated;
```

### For TRIBE CHAT to work:
```sql
GRANT SELECT ON tribe_chat_messages TO anon, authenticated;
GRANT INSERT ON tribe_chat_messages TO authenticated;
```

### For CHAT to work:
```sql
GRANT SELECT ON chat_messages TO anon, authenticated;
GRANT INSERT ON chat_messages TO authenticated;
```

### For PUBLIC VIEWING to work:
```sql
GRANT SELECT ON games_with_counts TO anon, authenticated;
GRANT SELECT ON activity_like_counts TO anon, authenticated;
```

## 📋 Select Lists by Endpoint

### games_with_counts (Most Important)
```sql
SELECT 
  id, title, sport, description, location, latitude, longitude, 
  date, time, cost, image_url, max_players, creator_id, created_at, 
  duration, duration_minutes, planned_route,
  current_players, total_players, available_spots
FROM games_with_counts
```

### game_participants
```sql
SELECT user_id, joined_at, status
FROM game_participants
WHERE game_id = ? AND status = 'joined'
```

### users (Profile)
```sql
SELECT id, full_name, username, avatar_url, bio, location, preferred_sports
FROM users
WHERE id = ?
```

### activity_like_counts
```sql
SELECT activity_id, like_count
FROM activity_like_counts
WHERE activity_id IN (?)
```

### tribe_chat_messages_with_author
```sql
SELECT *
FROM tribe_chat_messages_with_author
WHERE channel_id = ?
ORDER BY created_at DESC
LIMIT 50
```

## 🚀 Quick Fix SQL Generated

I've created: **`20250206000000_minimal_compatibility_fix.sql`**

This migration:
- ✅ Grants all required INSERT/DELETE permissions
- ✅ Grants SELECT to anon for public viewing
- ✅ Creates minimal RLS policies
- ✅ Grants sequence access
- ✅ Fixes storage bucket permissions

## 📊 Tables in Database (52 total)

Full list of tables detected:
- achievements, activity_like_counts, activity_likes, admin_audit_log
- avatars (storage bucket)
- chat_messages, chat_messages_with_author
- friend_suggestions
- game_feedback, game_notifications, game_participants, game_photos
- game_rating_summary, game_results, game_reviews, game_rsvp_stats, game_waitlist
- games, games_friend_counts, games_with_counts
- location_notification_preferences
- matchmaking_preferences, notifications
- player_behavior, player_elo_ratings, player_penalties, player_ratings, player_reputation
- push_subscriptions
- recurring_game_instances, recurring_game_templates
- scheduled_notifications, system_config
- tribe_channels, tribe_chat_messages, tribe_chat_messages_with_author
- tribe_games, tribe_member_details, tribe_members, tribe_statistics, tribes
- user_achievements, user_connections, user_feedback, user_preferences
- user_profiles, user_rating_summary, user_stats, user_testing_feedback
- users, v_columns, venue_ratings, venues

## ✅ What to Do

1. **Apply the minimal fix migration**:
   ```bash
   cd "/Users/cole.guyton/Downloads/React TribeUp Social Sports App"
   npx supabase db push
   ```

2. **Hard refresh browser**: Cmd+Shift+R

3. **Test these critical features**:
   - ✅ Join/leave games
   - ✅ Like/unlike activities
   - ✅ Post to tribe chat
   - ✅ Send game chat messages
   - ✅ View like counts

4. **Everything should work!** 🎉

## 🎯 Migration Priority

Apply in this order:
1. `20250204000000_fix_games_with_counts_security.sql` (if not already)
2. `20250206000000_minimal_compatibility_fix.sql` ← **NEW, MOST IMPORTANT**
3. `20250205000000_comprehensive_schema_audit_and_fix.sql` (optional, for cleanup)
