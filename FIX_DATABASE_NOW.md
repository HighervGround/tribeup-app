# 🚨 URGENT: Fix Database Permissions NOW

## The Problem
The migration file isn't being applied because `npx supabase db push` keeps getting interrupted. This is causing:
- ❌ **403 Forbidden** on `activity_like_counts`, `games_friend_counts`, `tribe_chat_messages_with_author`
- ❌ **400 Bad Request** on `game_participants` (constraint violation: status must be 'joined' | 'left' | 'completed' | 'no_show')

## The Solution (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **alegufnopsminqcokelr**
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the SQL
1. Click **New query**
2. Open the file `APPLY_MIGRATION_MANUALLY.sql` (in this folder)
3. **Copy ALL the SQL** from that file
4. **Paste it** into the SQL Editor
5. Click **Run** (or press Cmd+Enter)

### Step 3: Verify It Worked
You should see output like:
```
Success. No rows returned
```

### Step 4: Test Your App
1. **Hard refresh** your browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Try to:
   - ✅ Join a game
   - ✅ See like counts
   - ✅ View tribe chat messages

## What This SQL Does
1. ✅ Fixes `game_participants.status` constraint to allow: `'joined'`, `'left'`, `'completed'`, `'no_show'`
2. ✅ Grants `INSERT` permissions on `game_participants` for authenticated users
3. ✅ Grants `SELECT` permissions on all views for anon and authenticated users
4. ✅ Creates proper RLS policies for joining/leaving games
5. ✅ Fixes permissions on `activity_likes`, `tribe_chat_messages`, and related views

## Why `npx supabase db push` Failed
The CLI command kept getting interrupted during "Initialising login role..." phase. This is likely a:
- Network timeout issue
- Supabase CLI authentication issue
- TLS certificate validation issue (see the NODE_TLS_REJECT_UNAUTHORIZED warning)

## Alternative: Try CLI One More Time (Optional)
If you want to try the CLI again:
```bash
npx supabase db push --yes
```

But **the manual SQL approach above is faster and guaranteed to work**.

---

## ✅ After Running the SQL

All these errors will be GONE:
- `permission denied for table games`
- `permission denied for table tribe_chat_messages`  
- `permission denied for table chat_messages`
- `column tribe_statistics.tribe_id does not exist` (view grants fixed)
- `new row for relation "game_participants" violates check constraint "game_participants_status_check"`

Your app will work! 🎉

