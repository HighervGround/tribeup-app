# Fix for Joining Activities Issue

## Problems Fixed

1. **Status Mismatch**: Code was using `'going'` but database expects `'joined'`
2. **RLS Policy Issue**: Permission denied when viewing games through `games_with_counts` view
3. **Non-existent Table Reference**: Migration referenced `rsvps` table which doesn't exist (should be `public_rsvps`)
4. **Activity Likes Not Showing**: Like counts not displaying due to restrictive RLS policy
5. **Tribe Chat Permission Denied**: Tribe chat messages blocked by missing table grants

## Code Changes (Already Applied)

✅ Fixed `gameParticipantService.ts` - Changed `'going'` to `'joined'` in 3 places
✅ Fixed `GameDetails.tsx` - Changed `'going'` to `'joined'` in quick join flow

## Database Migration Required

You need to apply the new migration to fix the RLS policy issue:

### Option 1: Using Supabase CLI (Recommended)

```bash
cd "/Users/cole.guyton/Downloads/React TribeUp Social Sports App"

# Push the new migration to your Supabase project
npx supabase db push
```

### Option 2: Apply Manually via Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy and paste the contents of:
   `supabase/migrations/20250204000000_fix_games_with_counts_security.sql`
5. Click **Run**

### What the Migration Does

- **Consolidates RLS policies**: Removes conflicting policies on `games` table, creates single `public_can_view_active_games` policy
- **Fixes table references**: Removes references to non-existent `rsvps` table
- **Cleans up problematic views**: Drops `game_public_rsvps` view that references wrong table
- **Grants permissions**: Ensures `anon` and `authenticated` roles can SELECT from necessary tables
- **Recreates view**: Rebuilds `games_with_counts` view with correct table references
- **Updates counting logic**: Uses `status='joined'` instead of `status='going'`
- **Fixes activity likes**: Creates public-readable policy for `activity_likes` so like counts display
- **Fixes tribe chat**: Grants SELECT on `tribe_chat_messages` and related tables to both roles

## Testing After Migration

1. Refresh your app (Cmd+Shift+R or Ctrl+Shift+R)
2. Navigate to any game detail page
3. Try joining an activity
4. Verify you can see the game details without 403 errors
5. Verify participant counts are correct
6. Check that like counts display on activities
7. Try liking/unliking an activity
8. Navigate to a tribe chat and verify messages load

## If Issues Persist

Check the browser console for any remaining errors and verify:
- The migration ran successfully (no SQL errors)
- Your app is connected to the correct Supabase project
- You've refreshed the page after applying the migration

