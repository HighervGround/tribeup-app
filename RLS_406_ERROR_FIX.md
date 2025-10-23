# RLS 406 Error Fix - Complete Solution

## Problem
The 406 (Not Acceptable) error from PostgREST was caused by:
1. **Missing RLS policies** - Users couldn't access their own profile data
2. **Improper query structure** - Using `select('*')` instead of explicit field selection
3. **RLS blocking access** - No policies allowing authenticated users to read their own rows

## Root Cause Analysis
Based on the PostgREST documentation you provided, the 406 error occurs when:
- **RLS policies block access** (policy returns false/NULL)
- **Query returns 0 rows** but client expects one row
- **Column selection issues** or JSON shape problems

## Complete Solution

### 1. RLS Policy Fix
**File**: `supabase/migrations/20250120000008_fix_rls_policies.sql`

```sql
-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Create proper RLS policies for users table
CREATE POLICY "Users can read own row" ON public.users 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can insert own row" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own row" ON public.users 
FOR UPDATE TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());
```

### 2. Query Structure Fix
**File**: `src/lib/supabaseService.ts`

```typescript
// Before: Using select('*') which can cause issues
.select('*')

// After: Explicit field selection with maybeSingle()
.select('id, email, username, full_name, avatar_url, bio, location, preferred_sports, role, stats, created_at, onboarding_completed')
.eq('id', userId.trim())
.maybeSingle()
```

### 3. Enhanced Error Handling
**File**: `src/lib/supabaseService.ts`

- **Specific 406 error handling** with clear error messages
- **RLS policy guidance** in error logs
- **Graceful fallback** when profile loading fails

## How to Apply the Fix

### Step 1: Apply RLS Migration
Run this SQL in your Supabase SQL editor:

```sql
-- Fix RLS policies for users table to resolve 406 errors
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create proper RLS policies for users table
CREATE POLICY "Users can read own row" ON public.users 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can insert own row" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own row" ON public.users 
FOR UPDATE TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Step 2: Test the Fix
After applying the RLS migration:

1. **Refresh the page** - The 406 error should be resolved
2. **Check console logs** - Should see successful profile loading
3. **Test onboarding** - Should work correctly without loops

## Expected Results

### Before Fix:
```
Load Profile → RLS Blocks Access → 406 Error → Profile Loading Fails → Always Onboarding
```

### After Fix:
```
Load Profile → RLS Allows Access → Profile Loads → Check Sports Preferences → Proper Onboarding Flow
```

## Debug Information

The fix includes enhanced logging:
- **RLS Policy Status**: Clear indication when RLS policies are blocking access
- **Migration Guidance**: Specific instructions to apply the RLS fix
- **Error Details**: Better visibility into what's causing the 406 error

## Files Modified

1. **`supabase/migrations/20250120000008_fix_rls_policies.sql`** - RLS policy fix
2. **`src/lib/supabaseService.ts`** - Query structure and error handling
3. **`apply-rls-fix.js`** - Helper script to test the fix

## Status: READY FOR APPLICATION ✅

The complete fix is ready. Apply the RLS migration in your Supabase SQL editor to resolve the 406 errors and fix the onboarding flow.

## Next Steps

1. **Apply the RLS migration** in your Supabase SQL editor
2. **Test the app** - 406 errors should be resolved
3. **Verify onboarding** - Should work correctly for both email/password and OAuth users

This fix addresses the root cause of the 406 error and ensures proper RLS policies for the users table.
