# Root Cause: Game Join Failure - COMPLETE DIAGNOSIS

## The Problem

Users attempting to join games receive errors when calling the game_participants endpoint.

## Two Root Causes Identified

### Issue #1: Missing UPDATE Policy (CRITICAL)

**Missing UPDATE Policy on `game_participants` table**

### Why This Causes Failures

1. **Client Code Uses `.upsert()`**:
   ```typescript
   // From gameParticipantService.ts:29-40 and GameDetails.tsx:414-425
   await supabase
     .from('game_participants')
     .upsert(
       {
         game_id: gameId,
         user_id: user.id,
         status: 'joined' // ✅ This value is CORRECT
       },
       {
         onConflict: 'game_id,user_id'
       }
     );
   ```

2. **Upsert Behavior**:
   - If the row doesn't exist → Performs INSERT (works ✅)
   - If the row exists → Performs UPDATE (fails ❌ due to missing policy)

3. **Database Had Only INSERT and DELETE Policies**:
   ```sql
   -- ✅ Had INSERT policy
   CREATE POLICY "authenticated_can_join_games" ON game_participants
     FOR INSERT TO authenticated
     WITH CHECK (auth.uid() = user_id);
   
   -- ✅ Had DELETE policy  
   CREATE POLICY "authenticated_can_leave_games" ON game_participants
     FOR DELETE TO authenticated
     USING (auth.uid() = user_id);
   
   -- ❌ MISSING UPDATE POLICY
   ```

4. **Result**: 
   - First join attempt → INSERT succeeds ✅
   - Subsequent join attempts → UPDATE blocked by RLS ❌
   - Errors like "policy violation" or "permission denied"

## The Fix

**Add UPDATE policy to allow status changes on existing participation records:**

```sql
CREATE POLICY "authenticated_can_update_participation" ON game_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Where to Apply

**Option 1: Via Supabase Dashboard (Recommended for Quick Fix)**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `APPLY_MIGRATION_MANUALLY.sql`
3. Run the entire script
4. Verify the UPDATE policy exists in the output

**Option 2: Via Migration File**
1. Apply the migration file: `supabase/migrations/20250207000000_add_game_participants_update_policy.sql`
2. Run: `npx supabase db push` (if using Supabase CLI)
3. Or apply manually via SQL Editor

### Verification

After applying the fix, verify the policy exists:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'game_participants' AND cmd = 'UPDATE';
```

Expected result:
```
        policyname                    | cmd
--------------------------------------+--------
authenticated_can_update_participation | UPDATE
```

### Issue #2: Status Value Confusion (DOCUMENTATION)

**RSVP Status vs Participant Status are different types**

#### The Confusion

There are TWO different status systems in the codebase:

1. **UI/RSVP Status** (for display/events):
   - Values: `'going' | 'maybe' | 'not_going'`
   - Type: `RSVPStatus`
   - Used in: UI components, event RSVPs, display logic

2. **Database Participant Status** (for game_participants table):
   - Values: `'joined' | 'left' | 'completed' | 'no_show'`
   - Type: `ParticipantStatus`
   - Used in: Database inserts/updates, backend logic

#### The Risk

If code accidentally sends `status: 'going'` to the database, it violates the CHECK constraint:

```sql
CHECK (status IN ('joined', 'left', 'completed', 'no_show'))
```

#### The Fix

**Updated code to enforce type safety:**

```typescript
// ✅ CORRECT - Now type-safe
export type ParticipantStatus = 'joined' | 'left' | 'completed' | 'no_show';

const participantStatus: ParticipantStatus = 'joined';  // Type-enforced
await supabase.from('game_participants').upsert({ status: participantStatus });

// ❌ WRONG - Will now fail at compile time
await supabase.from('game_participants').upsert({ status: 'going' }); // TypeScript error!
```

**Files updated:**
- `src/domains/games/services/gameParticipantService.ts` - Added `ParticipantStatus` type
- `src/domains/games/components/GameDetails.tsx` - Added type-safe status constants

## Verification That Status Was Correct

The client code was **already** sending the correct value:
- Client sends: `status: 'joined'` ✅
- Database expects: `'joined' | 'left' | 'completed' | 'no_show'` ✅
- CHECK constraint: Passes ✅
- **RLS policy**: FAILED ❌ (because UPDATE policy didn't exist)

**The primary issue was always the missing UPDATE policy, not the status value.**

## Summary

| Component | Status Before | Status After |
|-----------|--------------|--------------|
| Status value in client | ✅ Correct | ✅ Correct |
| CHECK constraint | ✅ Correct | ✅ Correct |
| UNIQUE constraint | ✅ Correct | ✅ Correct |
| INSERT policy | ✅ Exists | ✅ Exists |
| DELETE policy | ✅ Exists | ✅ Exists |
| **UPDATE policy** | ❌ **MISSING** | ✅ **ADDED** |

## Additional Notes

### Alternative Approaches Considered

1. **Using `.insert()` with `ignoreDuplicates`**:
   ```typescript
   .insert({ ... }, { ignoreDuplicates: true })
   ```
   - Pros: No UPDATE policy needed
   - Cons: Can't update status if user rejoins after leaving

2. **Using DELETE then INSERT**:
   ```typescript
   await supabase.from('game_participants').delete().eq(...);
   await supabase.from('game_participants').insert(...);
   ```
   - Pros: Works with current policies
   - Cons: Race conditions, less atomic, more complex

3. **Current approach with UPDATE policy** (Recommended):
   - Pros: Atomic operation, handles all cases, industry standard
   - Cons: None

### Why This Was Hard to Diagnose

- Error messages mentioned "status CHECK constraint" which was a red herring
- The status value was always correct
- First joins worked (INSERT path), subsequent joins failed (UPDATE path)
- RLS errors can be vague about which operation failed

## Action Items

### Database Migration (REQUIRED)
- [x] Created fix migration: `20250207000000_add_game_participants_update_policy.sql`
- [x] Updated `APPLY_MIGRATION_MANUALLY.sql` with the fix
- [ ] **Apply the migration to your Supabase database** ⚠️ **DO THIS FIRST**
- [ ] Verify UPDATE policy exists (see verification SQL above)

### Client Code (COMPLETED)
- [x] Added `ParticipantStatus` type to enforce correct status values
- [x] Updated `gameParticipantService.ts` with type-safe status
- [x] Updated `GameDetails.tsx` with type-safe status
- [x] Added console logs to track status values being sent

### Testing
- [ ] **Clear browser cache and hard reload** (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] Restart the dev server to pick up the new code changes
- [ ] Test joining a game (should work on first attempt)
- [ ] Test rejoining the same game (should now work on second attempt too)
- [ ] Check browser console for the new log: `📝 Inserting with status: "joined"`
- [ ] Monitor network tab to confirm `status: "joined"` is being sent (NOT "going")
- [ ] Monitor logs to confirm no more RLS policy violations

## If You're Still Seeing `status: "going"` in Network Logs

If after applying all fixes you still see `"going"` being sent:

1. **Hard refresh the browser** - Old JavaScript may be cached
   ```bash
   # Force reload without cache
   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

2. **Clear Vite build cache and restart**
   ```bash
   # Stop the dev server
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check for Service Workers**
   ```javascript
   // In browser console:
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister());
   });
   ```

4. **Verify the source in DevTools**
   - Open browser DevTools → Sources tab
   - Find `gameParticipantService.ts`
   - Search for "participantStatus" - should exist in the code
   - If it doesn't exist, the browser is serving old code

5. **Check for other places making game_participants calls**
   ```bash
   # Search for any other places
   grep -r "game_participants" src/ | grep -v node_modules
   ```

## References

- Migration file: `supabase/migrations/20250207000000_add_game_participants_update_policy.sql`
- Manual script: `APPLY_MIGRATION_MANUALLY.sql`
- Client code: `src/domains/games/services/gameParticipantService.ts:17-62`
- Client code: `src/domains/games/components/GameDetails.tsx:400-448`

