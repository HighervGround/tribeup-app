# Client-Side Best Practices for Supabase Game Participants

## Summary of Changes

This document outlines the client-side implementation best practices we've followed for the authentication-enforced join feature, based on PostgREST and Supabase recommendations.

---

## ✅ Key Requirements Implemented

### 1. **Explicit user_id in Request Body**

**Requirement**: The insert/upsert body MUST include `user_id` equal to the current authenticated user's ID.

**Why**: RLS policies check `auth.uid()` against the `user_id` column. If `user_id` is omitted, the RLS policy cannot validate ownership and the request will fail.

**Implementation**:

```typescript
// ✅ CORRECT - gameParticipantService.ts
const { data: { user } } = await supabase.auth.getUser();

await supabase
  .from('game_participants')
  .upsert({
    game_id: gameId,
    user_id: user.id,  // ✅ Explicitly included
    status: 'going'
  }, {
    onConflict: 'game_id,user_id'
  });
```

```typescript
// ❌ WRONG - Missing user_id
await supabase
  .from('game_participants')
  .upsert({
    game_id: gameId,
    status: 'going'  // ❌ Missing user_id!
  });
```

---

### 2. **Understanding Upsert Behavior**

**Key Point**: `upsert` with `onConflict` performs an **UPDATE** when a row exists.

**Implication**: Your RLS policies must allow BOTH:
- **INSERT** policy: For new participants
- **UPDATE** policy: For re-joining or updating status

**Our Implementation**:

```typescript
// From gameParticipantService.ts - joinGame()
await supabase
  .from('game_participants')
  .upsert(
    {
      game_id: gameId,
      user_id: user.id,
      status: 'going'
    },
    { onConflict: 'game_id,user_id' }
  );

// What this does:
// - If row doesn't exist: INSERT (requires INSERT policy)
// - If row exists: UPDATE status='going' (requires UPDATE policy)
```

---

### 3. **Alternative: Insert with Ignore Duplicates**

**Option**: If you want to avoid needing an UPDATE policy, use `Prefer: resolution=ignore-duplicates` header.

**Implementation** (if we wanted this approach):

```typescript
// Using ignore-duplicates (INSERT policy only)
const { error } = await supabase
  .from('game_participants')
  .insert(
    {
      game_id: gameId,
      user_id: authUser.id,
      status: 'going'
    },
    { returning: 'minimal' }
  );

// Handle duplicate gracefully
if (error?.code === '23505') {
  // Unique constraint violation - user already joined
  console.log('User already in game, treating as success');
  return { success: true };
}
```

**Trade-offs**:
- ✅ Simpler RLS (INSERT policy only)
- ✅ No accidental overwrites
- ❌ Cannot update status if user re-joins
- ❌ Must handle duplicate errors in client code

**Why we chose upsert**: Allows users to "re-join" a game they left, updating their status automatically.

---

### 4. **Explicit Filtering on Delete**

**Best Practice**: Always explicitly filter by both `game_id` AND `user_id` when deleting.

**Implementation**:

```typescript
// ✅ CORRECT - Explicit filters
await supabase
  .from('game_participants')
  .delete()
  .eq('game_id', gameId)
  .eq('user_id', user.id);  // ✅ Explicit user_id filter

// ❌ LESS CLEAR - Relying only on RLS
await supabase
  .from('game_participants')
  .delete()
  .eq('game_id', gameId);
  // ❌ Relies on RLS to filter by user_id
```

**Why**: While RLS will enforce `user_id = auth.uid()`, explicitly including the filter:
1. Makes the intent clear in code
2. Reduces database work (more specific query)
3. Provides better error messages
4. Acts as defense-in-depth if RLS is misconfigured

---

## 📋 RLS Policy Requirements

Based on our client implementation, the following RLS policies are required:

### INSERT Policy for `game_participants`

```sql
CREATE POLICY "Users can join games"
ON game_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id  -- Ensures user can only insert their own ID
);
```

### UPDATE Policy for `game_participants`

```sql
CREATE POLICY "Users can update their own participation"
ON game_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)  -- Can only update own records
WITH CHECK (auth.uid() = user_id);  -- New values must still be own records
```

### DELETE Policy for `game_participants`

```sql
CREATE POLICY "Users can leave games they joined"
ON game_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);  -- Can only delete own records
```

---

## 🔍 Code Locations

### Main Implementation Files:

1. **Service Layer**: `/src/domains/games/services/gameParticipantService.ts`
   - `joinGame()` - Handles game joining with upsert
   - `leaveGame()` - Handles game leaving with explicit filters
   - `isUserInGame()` - Checks participation status

2. **Component Layer**: `/src/domains/games/components/GameDetails.tsx`
   - `handleJoinLeave()` - Checks auth and triggers join/leave
   - `handleQuickJoinSuccess()` - Auto-joins after authentication

3. **Hook Layer**: `/src/domains/games/hooks/useGameJoinToggle.ts`
   - `toggleJoin()` - Centralized join/leave logic with optimistic updates

---

## ✅ Validation Checklist

Use this checklist to ensure compliance with best practices:

- [ ] **Every insert/upsert includes explicit `user_id`**
  - [ ] Check `gameParticipantService.ts::joinGame()`
  - [ ] Check `GameDetails.tsx::handleQuickJoinSuccess()`
  - [ ] Check any other insert operations

- [ ] **Every delete explicitly filters by `user_id`**
  - [ ] Check `gameParticipantService.ts::leaveGame()`
  - [ ] Check any other delete operations

- [ ] **Auth check before every operation**
  - [ ] `supabase.auth.getUser()` called before insert/update/delete
  - [ ] Error handling for unauthenticated state

- [ ] **RLS policies exist for all operations**
  - [ ] INSERT policy checks `auth.uid() = user_id`
  - [ ] UPDATE policy checks `auth.uid() = user_id` (both USING and WITH CHECK)
  - [ ] DELETE policy checks `auth.uid() = user_id`

- [ ] **Authorization headers automatically included**
  - [ ] Using Supabase client (not custom fetch)
  - [ ] JWT token available in session

- [ ] **Error handling for edge cases**
  - [ ] Duplicate join attempts (23505 error code)
  - [ ] Leaving game not joined (PGRST116 error code)
  - [ ] Authentication failures

---

## 🚨 Common Pitfalls to Avoid

### ❌ Pitfall 1: Omitting user_id

```typescript
// ❌ WRONG
await supabase
  .from('game_participants')
  .insert({
    game_id: gameId,
    status: 'going'
    // Missing user_id!
  });
```

**Result**: RLS policy check fails, insert denied.

### ❌ Pitfall 2: Using upsert without UPDATE policy

```typescript
// Code uses upsert
await supabase
  .from('game_participants')
  .upsert({ ... }, { onConflict: 'game_id,user_id' });

// But RLS only has INSERT policy, no UPDATE policy
```

**Result**: New joins work, but re-joins fail with permission error.

### ❌ Pitfall 3: Relying only on RLS for filtering

```typescript
// ❌ UNCLEAR
await supabase
  .from('game_participants')
  .delete()
  .eq('game_id', gameId);
  // Relies on RLS to filter by user_id
```

**Result**: Works, but intent is unclear and harder to debug.

### ❌ Pitfall 4: Not handling duplicate errors

```typescript
// ❌ NO ERROR HANDLING
const { error } = await supabase
  .from('game_participants')
  .insert({ ... });

if (error) {
  throw error;  // Always throws on duplicate!
}
```

**Result**: User sees error when trying to join game they're already in.

---

## 📖 Additional Resources

- [PostgREST Upsert Documentation](https://postgrest.org/en/stable/api.html#upsert)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL UPSERT (INSERT ... ON CONFLICT)](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)

---

## 📝 Testing Recommendations

### Test Case 1: First-time Join
1. User not authenticated → prompted to log in
2. User logs in successfully
3. Auto-joins game
4. Verify `game_participants` row created with correct `user_id`

### Test Case 2: Re-join After Leaving
1. User joins game
2. User leaves game (row deleted)
3. User joins again
4. Verify new `game_participants` row created

### Test Case 3: Duplicate Join Prevention
1. User already in game
2. User clicks Join again
3. Verify no error shown
4. Verify upsert updates existing row (or gracefully handles duplicate)

### Test Case 4: Unauthorized Access
1. Clear auth session
2. Attempt direct API call to join game
3. Verify RLS policy blocks the request

---

## 🎯 Summary

Following these best practices ensures:
- ✅ Security through explicit user_id handling
- ✅ Clear intent in code with explicit filters
- ✅ Proper RLS policy enforcement
- ✅ Graceful handling of edge cases
- ✅ Defense-in-depth security approach

All operations in the TribeUp app now follow these guidelines for consistency and reliability.


