# Supabase Schema Alignment Audit

## Summary
This document tracks the alignment of code changes with the actual Supabase database schema that was deployed.

## Database Changes Applied

### 1. Indexes ✅
- `idx_game_participants_game_status`
- `idx_games_date`
- `idx_game_participants_game_user`
- `idx_game_participants_user`

**Status**: These are database-level optimizations and don't require code changes.

### 2. User Connections Table ✅
**Table**: `public.user_connections`
- Columns: `id`, `follower_id`, `following_id`, `status`, `created_at`, `updated_at`
- RLS Policies: `read_own_connections`, `insert_self_as_follower`, `accept_if_target`, `delete_if_involved`

**Code Updates**:
- ✅ Updated `friendService.ts` to use actual `user_connections` table
- ✅ Implemented `followUser()` to create/delete connections with `status = 'accepted'`
- ✅ Implemented `isFollowing()` to check connection status
- ✅ Implemented `getUserFriends()` to fetch bidirectional connections
- ✅ Updated `getFriendSuggestions()` to use `friend_suggestions` view

### 3. Engagement Views ✅

#### `games_friend_counts` View
**Purpose**: Shows how many friends have joined each game for the current user.

**Code Updates**:
- ✅ Added `getGamesFriendCounts()` function in `friendService.ts`
- ⚠️ Not yet integrated into UI components (can be added for social signals)

#### `friend_suggestions` View
**Purpose**: Provides friend suggestions based on co-play analysis using `user_connections` table.

**Code Updates**:
- ✅ Updated `getFriendSuggestions()` to query `friend_suggestions` view directly
- ✅ View automatically filters by `status = 'accepted'` connections
- ✅ View includes `is_following` flag

### 4. Realtime Broadcasting ✅

**Channel Format**: `game:{game_id}:participants` with `private: true`

**Code Updates**:
- ✅ Updated `useGameParticipants.ts` to subscribe to broadcast channel
- ✅ Added listeners for `participant_join` and `participant_leave` broadcast events
- ✅ Kept `postgres_changes` as fallback for reliability
- ✅ Channel configured with `private: true` for authorization

**Implementation Details**:
```typescript
const channel = supabase
  .channel(`game:${gameId}:participants`, {
    config: { private: true }
  })
  .on('broadcast', { event: 'participant_join' }, handler)
  .on('broadcast', { event: 'participant_leave' }, handler)
```

## Files Modified

### Core Service Files
1. **`src/domains/users/services/friendService.ts`**
   - ✅ Replaced placeholder functions with real database queries
   - ✅ Uses `user_connections` table for follow/unfollow
   - ✅ Uses `friend_suggestions` view for suggestions
   - ✅ Added `getGamesFriendCounts()` for social signals

### Hook Files
2. **`src/domains/games/hooks/useGameParticipants.ts`**
   - ✅ Updated to use broadcast channel `game:{game_id}:participants`
   - ✅ Added private channel configuration
   - ✅ Listens to both broadcast events and postgres_changes

### Component Files
3. **`src/domains/games/components/HomeScreen.tsx`**
   - ✅ Updated friends filter comment to note future `games_friend_counts` integration
   - ⚠️ Friends filter still uses placeholder logic (needs `games_friend_counts` integration)

## Remaining Work

### High Priority
1. **Integrate `games_friend_counts` into UI**
   - Add friend count badges to game cards
   - Show "X friends joined" indicators
   - Use in "From Friends" filter logic

2. **Test Realtime Broadcasting**
   - Verify broadcast events are received correctly
   - Test authorization with `private: true` channels
   - Ensure fallback to postgres_changes works

### Medium Priority
3. **Enhance Friend Suggestions**
   - Add loading states
   - Add error handling
   - Show mutual friends count

4. **Friends Filter Enhancement**
   - Use `games_friend_counts` view to properly filter games
   - Show games where friends have joined
   - Add "Friends Joined" badge to filtered games

## Testing Checklist

- [ ] Follow/unfollow users works correctly
- [ ] Friend suggestions load from `friend_suggestions` view
- [ ] Realtime broadcasts received on `game:{id}:participants` channel
- [ ] `games_friend_counts` returns correct friend join counts
- [ ] RLS policies allow proper access to `user_connections`
- [ ] Friend filter shows games from followed users

## Notes

- The `user_connections` table uses `status = 'accepted'` for auto-accepting follows (no pending state)
- Broadcast channel uses `private: true` which requires proper authorization
- `friend_suggestions` view automatically excludes already-followed users
- `games_friend_counts` view requires `status = 'accepted'` connections to count friends

## Migration Status

✅ All code changes align with deployed database schema
✅ No breaking changes introduced
⚠️ Some UI features can be enhanced with new views (noted above)
