# Debug Attendee Click Flow - Implementation Summary

## ✅ Changes Made

### 1. Added Session & Client Verification

#### GameDetails.tsx (Click Handler)
```typescript
onClick={async () => {
  // Debug: Verify session and client before navigation
  const { data: { session } } = await supabase.auth.getSession();
  console.log('🔍 [GameDetails] Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    targetPlayerId: player.id
  });
  console.log('🔍 [GameDetails] Client check:', {
    hasClient: !!supabase,
    hasAuth: !!supabase.auth
  });
  
  navigateToUser(player.id);
}}
```

#### OtherUserProfile.tsx (Component Mount)
```typescript
useEffect(() => {
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 [OtherUserProfile] Component mount check:', {
      userId,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      hasClient: !!supabase,
      hasAuth: !!supabase.auth
    });
  })();
}, [userId]);
```

### 2. Enhanced Error Handling

#### getOtherUserProfile() - Auth Error Detection
- Checks for auth/permission errors (PGRST301, 42501)
- Logs detailed error information
- Distinguishes between "not found" vs "auth error"

#### OtherUserProfile.tsx - Error Display
- Shows different message for auth errors vs not found
- Displays error code when auth error detected
- Better user-facing error messages

### 3. Query Verification

All queries use `.maybeSingle()` (not `.single()`):
- ✅ `user_public_profile` view with `.in([userId])`
- ✅ `user_public_profile` view with `.eq(userId)`
- ✅ `users` table with `.eq('id', userId)`
- ✅ `users` table with `.eq('auth_user_id', userId)`

### 4. Query Path Verification

**Flow:**
1. `GameDetails` → Click participant → `navigateToUser(player.id)`
2. `navigateToUser` → `navigate(/user/${userId})`
3. `OtherUserProfile` → `useUserProfile(userId)`
4. `useUserProfile` → `SupabaseService.getUserProfile(userId)`
5. `getUserProfile` → Checks if own profile or calls `getOtherUserProfile(userId)`
6. `getOtherUserProfile` → Queries `user_public_profile` view (primary) or `users` table (fallback)

**All queries use the same Supabase client instance from `src/lib/supabase.ts`**

## 🔍 What to Check in Browser Console

### On Click:
```
🔍 [GameDetails] Clicking on player: { id: "...", name: "..." }
🔍 [GameDetails] Session check: { hasSession: true, userId: "...", targetPlayerId: "..." }
🔍 [GameDetails] Client check: { hasClient: true, hasAuth: true }
```

### On Profile Page Load:
```
🔍 [OtherUserProfile] Component mount check: { userId: "...", hasSession: true, ... }
✅ [getOtherUserProfile] Authenticated session confirmed, user: "..."
✅ [getOtherUserProfile] JWT will be automatically included in query headers
🔍 [getOtherUserProfile] Fetching profile for userId: "..."
```

### On Success:
```
✅ Found via user_public_profile view (by id via .in())
✅ [getOtherUserProfile] Profile found via user_public_profile (id via .in()): { id: "...", name: "..." }
```

### On Error:
```
❌ [getOtherUserProfile] All queries failed for userId: "..."
❌ [getOtherUserProfile] Has auth error: true/false
❌ [getOtherUserProfile] Error details: { ... }
❌ [getOtherUserProfile] Query attempted: { view: "user_public_profile", ... }
```

## 🎯 Expected Query Format

The exact query being executed:
```typescript
const { data, error } = await supabase
  .from('user_public_profile')
  .select('id, display_name, avatar_url, username, bio, location')
  .eq('id', userId)
  .maybeSingle();
```

**With automatic Authorization header:**
```
Authorization: Bearer <jwt-token-from-localStorage>
```

## 🔧 If Still Failing

### Check Network Tab:
1. Open DevTools → Network tab
2. Filter by "user_public_profile"
3. Click on the request
4. Verify:
   - **Headers** → Request Headers → `Authorization: Bearer ...` exists
   - **Headers** → Response Headers → Status code (should be 200)
   - **Response** → Should contain the user data or error message

### Check RLS Policy:
```sql
-- Verify policy exists
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_public_profile';

-- Test query directly (in Supabase SQL editor as authenticated user)
SELECT id, display_name, avatar_url, username, bio, location 
FROM user_public_profile 
WHERE id = '654fbc89-0211-4c1e-9977-21f42084b918';
```

### Check View Definition:
```sql
-- Verify view exists and has correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_public_profile';
```

## 📋 Next Steps

1. Click a participant from GameDetails
2. Check browser console for the debug logs above
3. Check Network tab for the actual HTTP request
4. Share the console logs and Network request details if still failing

The debugging infrastructure is now in place to pinpoint exactly where the issue occurs!

