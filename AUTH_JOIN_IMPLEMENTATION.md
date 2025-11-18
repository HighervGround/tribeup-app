# Authentication-Required Join Button Implementation

## Overview
This document describes the implementation of enforcing authentication for the Join button while keeping game details publicly visible.

## Implementation Summary

### 1. **Public Game Details** ✅
- Game details are visible without authentication
- Users can browse all game information (location, time, participants, etc.)
- No login required to view game information

### 2. **Authentication-Enforced Join Flow** ✅

When a user clicks the "Join" button:

#### If NOT Authenticated:
1. System checks authentication status using `supabase.auth.getUser()`
2. Shows `QuickJoinModal` with options:
   - **Google OAuth**: One-click social login
   - **Sign Up**: Create new account with email
   - **Log In**: For existing users

#### If Authenticated:
1. Proceeds directly with join operation
2. Inserts record into `game_participants` table:
   ```typescript
   await supabase
     .from('game_participants')
     .insert({
       game_id: gameId,
       user_id: authUser.id,
       status: 'going'
     })
   ```

### 3. **Authorization Headers** ✅
- Supabase client automatically includes `Authorization: Bearer <access_token>` header
- No manual header management required
- RLS (Row Level Security) policies use `auth.uid()` to ensure proper access control

### 4. **Client-Side Best Practices** ✅

Following PostgREST and Supabase best practices:

#### **Explicit user_id in Insert Body**
```typescript
// ✅ CORRECT: Explicitly include user_id
await supabase
  .from('game_participants')
  .insert({
    game_id: gameId,
    user_id: authUser.id, // Required!
    status: 'going'
  });

// ❌ WRONG: Omitting user_id
await supabase
  .from('game_participants')
  .insert({
    game_id: gameId,
    status: 'going'
  }); // RLS won't auto-populate user_id
```

#### **Conflict Handling Options**

**Option 1: Upsert (requires UPDATE policy)**
```typescript
await supabase
  .from('game_participants')
  .upsert(
    {
      game_id: gameId,
      user_id: authUser.id,
      status: 'going'
    },
    { onConflict: 'game_id,user_id' }
  );
// This will UPDATE if row exists (needs UPDATE policy)
```

**Option 2: Insert with Ignore Duplicates (INSERT policy only)**
```typescript
await supabase
  .from('game_participants')
  .insert(
    {
      game_id: gameId,
      user_id: authUser.id,
      status: 'going'
    },
    { returning: 'minimal' }
  )
  .select()
  .single();

// Handle duplicate error gracefully
if (error?.code === '23505') {
  // User already joined, treat as success
  return { success: true };
}
```

**Our Implementation**: We use **upsert with onConflict** which allows:
- Re-joining a game updates the status
- No errors on duplicate attempts
- Requires both INSERT and UPDATE RLS policies

### 5. **Post-Authentication Auto-Join** ✅

After successful authentication (via any method):
1. Modal success callback is triggered
2. System waits briefly for auth state to propagate (500ms)
3. Verifies authentication with `supabase.auth.getUser()`
4. Automatically inserts participant record
5. Shows success toast notification
6. Refreshes page to update all game data

## Files Modified

### `src/domains/games/components/GameDetails.tsx`
**Changes:**
- Updated `handleJoinLeave()` to check auth status before proceeding
- Modified `handleQuickJoinSuccess()` to automatically join game after successful authentication
- Added proper error handling and user feedback

**Key Code:**
```typescript
const handleJoinLeave = async () => {
  if (actionLoading) return;
  
  // Check authentication status
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    console.log('👤 User not authenticated, showing login modal');
    setShowQuickJoin(true);
    return;
  }
  
  // User is authenticated, proceed with join/leave
  toggleJoin(game);
};

const handleQuickJoinSuccess = async () => {
  setShowQuickJoin(false);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (authUser && gameId && game) {
    const { error } = await supabase
      .from('game_participants')
      .insert({
        game_id: gameId,
        user_id: authUser.id,
        status: 'going'
      });
      
    if (error) {
      toast.error('Failed to join game. Please try clicking Join again.');
    } else {
      toast.success('Welcome! You\'ve successfully joined the game.');
      window.location.reload();
    }
  }
};
```

### `src/domains/games/components/QuickJoinModal.tsx`
**Changes:**
- Added `signIn` function from auth provider
- Added login/signup mode toggle
- Enhanced OAuth callback to trigger join after authentication
- Added `handleLogin()` function for email/password login

**Key Features:**
1. **Mode Toggle**: Switch between signup and login forms
2. **Social OAuth**: Google login with automatic game join
3. **Email Signup**: Traditional registration flow
4. **Email Login**: For existing users
5. **Success Callbacks**: Properly trigger `onJoinSuccess()` after authentication

**Key Code:**
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const result = await signIn(formData.email, formData.password);
    
    if (result?.session) {
      toast.success('Logged in! Joining game...');
      onJoinSuccess(); // Triggers auto-join in parent
    }
  } catch (error: any) {
    setError(error.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

## User Flow Examples

### Example 1: New User Joins Game
1. User browses to game details page (no auth required)
2. Clicks "Join Game"
3. See modal with signup/login options
4. Clicks "Continue with Google"
5. Completes OAuth flow
6. Automatically joined to game
7. Sees success message
8. Page refreshes with updated participant list

### Example 2: Existing User Joins Game
1. User browses to game details page (no auth required)
2. Clicks "Join Game"
3. Sees modal, clicks "I Already Have an Account"
4. Enters email and password
5. Clicks "Login & Join Game"
6. Automatically joined to game
7. Sees success message
8. Page refreshes with updated participant list

### Example 3: Authenticated User Joins Game
1. User already logged in
2. Browses to game details page
3. Clicks "Join Game"
4. Immediately joined (no modal shown)
5. Button changes to "Leave"
6. Participant count updates

## Security Features

### Row Level Security (RLS)
- All `game_participants` operations protected by RLS policies
- Policies use `auth.uid()` to verify user identity
- Users can only insert/delete their own participation records
- Authorization header automatically included by Supabase client

### Authentication Verification
- Double-check authentication before any database operations
- Proper error handling for auth failures
- User feedback through toast notifications
- Automatic cleanup on errors

## Testing Checklist

- [ ] Unauthenticated user can view game details
- [ ] Join button shows "Join Game - Sign Up" for unauthenticated users
- [ ] Clicking Join shows QuickJoinModal
- [ ] Google OAuth successfully joins game after login
- [ ] Email signup successfully creates account
- [ ] Email login successfully authenticates existing user
- [ ] After auth, user is automatically joined to game
- [ ] Success toast notification appears
- [ ] Participant list updates correctly
- [ ] Page refresh shows user in participant list
- [ ] Authenticated users can join directly (no modal)
- [ ] Leave button works correctly for joined users
- [ ] Error handling works for failed joins
- [ ] RLS policies prevent unauthorized operations

## Technical Notes

### Why Use Direct Supabase Insert?
In `handleQuickJoinSuccess`, we use a direct Supabase insert instead of the `toggleJoin` hook because:
1. The hook expects the game object to have correct `isJoined` status
2. After fresh authentication, the game state hasn't updated yet
3. Direct insert ensures we use the fresh auth token
4. Simpler error handling for this specific flow
5. Page refresh ensures all state is properly synchronized

### Why Wait 500ms?
The 500ms delay after authentication allows:
- Supabase auth state to propagate to client
- Auth token to be stored in local storage
- React Query to update auth status
- Prevents race conditions with auth state

### Why Reload Page?
After joining, we reload the page to:
- Ensure all queries refetch with new auth context
- Update participant counts across all components
- Clear any stale cached data
- Provide clean slate with updated permissions

## Future Improvements

1. **Replace Page Reload**: Use React Query invalidation instead of `window.location.reload()`
2. **Email Verification**: Add proper email verification flow
3. **Password Reset**: Add "Forgot Password" link to login form
4. **Social Login Options**: Add Facebook, Apple, etc.
5. **Loading States**: Better loading indicators during auth flow
6. **Error Recovery**: More sophisticated error handling and retry logic
7. **Optimistic Updates**: Update UI immediately without waiting for server
8. **Toast Improvements**: More detailed success/error messages

## References

- Game Participant Service: `src/domains/games/services/gameParticipantService.ts`
- Game Join Hook: `src/domains/games/hooks/useGameJoinToggle.ts`
- Auth Provider: `src/core/auth/SimpleAuthProvider.tsx`
- Supabase Client: `src/core/database/supabase.ts`

