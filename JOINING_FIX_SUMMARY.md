# Joining Activities - Complete Fix Summary

## 🔍 Issues Identified

### 1. Status Value Mismatch ✅ FIXED IN CODE
**Error**: Database constraint violation when joining activities
**Cause**: Code was using `status: 'going'` but database only accepts `'joined' | 'left' | 'completed' | 'no_show'`
**Files Fixed**:
- `src/domains/games/services/gameParticipantService.ts` (3 locations)
- `src/domains/games/components/GameDetails.tsx` (1 location)

### 2. RLS Permission Errors ⚠️ REQUIRES MIGRATION
**Error**: `403 Forbidden - permission denied for table games`
**Cause**: Conflicting RLS policies preventing public access to games
**Solution**: Migration consolidates policies and grants proper permissions

### 3. Non-existent Table Reference ⚠️ REQUIRES MIGRATION
**Error**: `permission denied for table rsvps`
**Cause**: Old migration created view referencing `rsvps` table (doesn't exist, should be `public_rsvps`)
**Solution**: Migration removes problematic view and trigger

### 4. Activity Likes Not Showing ⚠️ REQUIRES MIGRATION
**Error**: Like counts are not displaying on activities
**Cause**: RLS policy on `activity_likes` only allows `authenticated` users, blocking `anon` access
**Solution**: Migration creates public-readable policy for like counts

### 5. Tribe Chat Messages Permission Denied ⚠️ REQUIRES MIGRATION
**Error**: `permission denied for table tribe_chat_messages`
**Cause**: Missing grants for `anon` role on tribe-related tables and views
**Solution**: Migration grants SELECT permissions to both `anon` and `authenticated` roles

## ✅ Code Changes Applied

All code changes have been applied and are ready. No further code changes needed.

## ⚠️ Database Migration Required

**You must apply this migration**: `supabase/migrations/20250204000000_fix_games_with_counts_security.sql`

### Quick Apply (Choose One Method)

#### Method 1: Supabase CLI
```bash
cd "/Users/cole.guyton/Downloads/React TribeUp Social Sports App"
npx supabase db push
```

#### Method 2: Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project: **alegufnopsminqcokelr**
3. Navigate to **SQL Editor**
4. Copy entire contents of: `supabase/migrations/20250204000000_fix_games_with_counts_security.sql`
5. Paste in SQL editor
6. Click **Run** (bottom right)
7. Verify "Success" message appears

## 🧪 Testing Checklist

After applying the migration, test these scenarios:

- [ ] **Home page loads** without 403 errors in console
- [ ] **Game list displays** with correct participant counts
- [ ] **Game detail page loads** without permission errors
- [ ] **Join button works** and adds you to participants list
- [ ] **Leave button works** and removes you from game
- [ ] **Quick join** (when not logged in) successfully creates account and joins
- [ ] **Participant list** displays correctly with all joined users
- [ ] **Like counts display** on activity cards and detail pages
- [ ] **Like button works** to toggle likes
- [ ] **Tribe chat loads** without permission errors
- [ ] **Tribe chat messages** display correctly

## 🎯 Expected Results

After migration:
- ✅ No more 403 Forbidden errors
- ✅ Games load and display properly
- ✅ Join/leave functionality works correctly
- ✅ Participant counts are accurate
- ✅ Like counts display on all activities
- ✅ Tribe chat messages load without errors
- ✅ All console errors related to permissions are gone

## 📊 What the Migration Does

1. **Consolidates RLS Policies**
   - Removes 4 conflicting policies on `games` table
   - Creates single clear policy: `public_can_view_active_games`
   - Creates public-readable policy for `activity_likes`

2. **Fixes Table Grants**
   - Grants SELECT on `games` to anon and authenticated
   - Grants SELECT on `game_participants` to anon and authenticated
   - Grants SELECT on `activity_likes` to anon and authenticated
   - Grants SELECT on all tribe-related tables to anon and authenticated
   - Conditionally grants SELECT on `public_rsvps` if it exists

3. **Cleans Up Bad References**
   - Drops `game_public_rsvps` view (references wrong table)
   - Drops `set_rsvp_user_id_tg` trigger (on non-existent table)
   - Drops `set_rsvp_user_id()` function

4. **Recreates View Correctly**
   - Rebuilds `games_with_counts` with proper table references
   - Uses `status='joined'` for counting participants
   - Removes dependency on problematic `rsvps` table

5. **Fixes Activity Likes**
   - Replaces restrictive `likes_read` policy with `public_can_view_activity_likes`
   - Ensures `activity_like_counts` view is accessible to everyone
   - Enables like counts to display for all users

6. **Fixes Tribe Chat**
   - Grants access to `tribe_chat_messages` and related tables
   - Ensures `tribe_chat_messages_with_author` view is accessible
   - Enables tribe chat to work for all users

## 🚨 Troubleshooting

### If errors persist after migration:

1. **Check migration ran successfully**
   - Look for "Success" or "Completed" message
   - No SQL errors in output

2. **Clear browser cache**
   ```
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear browser cache entirely
   ```

3. **Check Supabase connection**
   - Verify `VITE_SUPABASE_URL` matches your project
   - Verify `VITE_SUPABASE_ANON_KEY` is correct

4. **Check database**
   - Run in SQL Editor: `SELECT * FROM games_with_counts LIMIT 1;`
   - Should return data without errors

### Still having issues?

Check browser console for specific error messages and compare with this list:
- ✅ "permission denied for table games" → Should be fixed
- ✅ "permission denied for table rsvps" → Should be fixed
- ✅ "permission denied for table tribe_chat_messages" → Should be fixed
- ✅ "403 Forbidden" on games_with_counts → Should be fixed
- ✅ Like counts not showing → Should be fixed

## 📚 Related Files

- Migration: `supabase/migrations/20250204000000_fix_games_with_counts_security.sql`
- Instructions: `APPLY_FIX.md`
- Service: `src/domains/games/services/gameParticipantService.ts`
- Component: `src/domains/games/components/GameDetails.tsx`

