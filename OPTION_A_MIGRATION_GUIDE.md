# Option A Migration: auth_user_id Approach (Recommended)

## Overview

**Option A** uses the `auth_user_id` column for RLS policies while keeping the existing primary key structure. This is the **recommended approach** because it's cleaner, safer, and doesn't require FK constraint changes.

## Key Benefits

✅ **No primary key changes** - Keeps existing `users.id` structure  
✅ **No FK constraint changes** - All foreign keys remain intact  
✅ **Cleaner migration** - Less complex than changing primary keys  
✅ **Safer approach** - Minimal risk of data corruption  
✅ **RLS compatibility** - Policies use `auth_user_id = auth.uid()`  

## How It Works

### Before Migration
```sql
-- Users table with random UUIDs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ❌ Random UUIDs
  email TEXT UNIQUE NOT NULL,
  auth_user_id UUID,  -- ✅ This column will be used for RLS
  -- ... other fields
);

-- RLS policies that fail
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);  -- ❌ Never matches
```

### After Migration
```sql
-- Users table with auth_user_id mapping
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- ✅ No DEFAULT, but keeps existing structure
  email TEXT UNIQUE NOT NULL,
  auth_user_id UUID,    -- ✅ Maps to auth.users.id
  -- ... other fields
);

-- RLS policies that work
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth_user_id = auth.uid());  -- ✅ Always matches
```

## Migration Steps

### 1. Prerequisite Mapping
```sql
-- Map existing users to auth.users
UPDATE public.users u 
SET auth_user_id = a.id 
FROM auth.users a 
WHERE lower(a.email) = lower(u.email) 
  AND u.auth_user_id IS DISTINCT FROM a.id;
```

### 2. Remove DEFAULT from users.id
```sql
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
```

### 3. Add Trigger for New Users
```sql
CREATE OR REPLACE FUNCTION ensure_auth_user_id_mapping()
RETURNS TRIGGER AS $$
BEGIN
  NEW.auth_user_id = auth.uid();
  IF NEW.id IS NULL THEN
    NEW.id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER users_auth_id_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_auth_user_id_mapping();
```

### 4. Update RLS Policies
```sql
-- Users table policies (using auth_user_id)
CREATE POLICY "Users can read own profile" ON public.users 
FOR SELECT TO authenticated 
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE TO authenticated 
USING (auth_user_id = auth.uid()) 
WITH CHECK (auth_user_id = auth.uid());
```

## Usage Instructions

### 1. Test the Migration (Safe)
```bash
node apply-option-a-migration.js --dry-run
```

### 2. Run the Migration
```bash
node apply-option-a-migration.js
```

### 3. Verify Results
```bash
node apply-option-a-migration.js --dry-run
```

## What This Solves

### Original Problem
- RLS policies like `auth.uid() = id` were failing
- Random UUIDs from `DEFAULT uuid_generate_v4()` never matched `auth.uid()`
- Users couldn't access their own data due to RLS failures

### Solution
- ✅ **RLS policies use `auth_user_id = auth.uid()`** - Always matches
- ✅ **No primary key changes** - Keeps existing structure
- ✅ **No FK changes** - All foreign keys remain intact
- ✅ **Cleaner approach** - Less complex migration

## Files Created/Modified

### Migration Files
- `supabase/migrations/20250120000009_fix_uuid_auth_mapping.sql` (updated for Option A)
- `supabase/migrations/20250120000010_update_rls_for_auth_ids.sql` (updated for Option A)

### Migration Scripts
- `apply-option-a-migration.js` (Option A migration script)
- `test-uuid-auth-migration.js` (test script)

### Client Code
- `src/lib/supabaseService.ts` (enhanced validation)

## RLS Policy Changes

### Before (Failing)
```sql
-- These policies failed because id != auth.uid()
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);  -- ❌ Never matches
```

### After (Working)
```sql
-- These policies work because auth_user_id = auth.uid()
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth_user_id = auth.uid());  -- ✅ Always matches
```

## Verification

After migration, verify with:

```sql
-- Check that auth_user_id is populated
SELECT COUNT(*) as total_users,
       COUNT(auth_user_id) as mapped_users
FROM users;

-- Test RLS policies
SELECT * FROM users WHERE auth_user_id = auth.uid();
```

## Advantages of Option A

1. **No FK Changes** - All foreign keys remain intact
2. **No Primary Key Changes** - Keeps existing structure
3. **Cleaner Migration** - Less complex than changing primary keys
4. **Safer Approach** - Minimal risk of data corruption
5. **RLS Compatibility** - Policies work correctly
6. **Easier Rollback** - Can be reversed if needed

## Troubleshooting

### Common Issues

1. **"auth_user_id is NULL" Error**
   - Run the prerequisite mapping step
   - Check that users have corresponding auth.users entries

2. **RLS Policy Failures**
   - Verify migration completed successfully
   - Check that auth_user_id is populated
   - Verify policies use `auth_user_id = auth.uid()`

3. **Migration Errors**
   - Run in dry-run mode first
   - Check database permissions
   - Verify environment variables

## Next Steps

1. **Run Prerequisite Mapping**: `UPDATE public.users u SET auth_user_id = a.id FROM auth.users a WHERE lower(a.email) = lower(u.email) AND u.auth_user_id IS DISTINCT FROM a.id;`
2. **Test Migration**: `node apply-option-a-migration.js --dry-run`
3. **Apply Migration**: `node apply-option-a-migration.js`
4. **Verify Results**: Test user creation and RLS policies

---

*Option A is the recommended approach because it's cleaner, safer, and doesn't require FK constraint changes.*
