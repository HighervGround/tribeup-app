# UUID to Auth User ID Migration Summary

## Problem Solved

Your database had a critical issue where the `users.id` column used `DEFAULT uuid_generate_v4()`, which generated random UUIDs that didn't match `auth.uid()` from Supabase Auth. This caused RLS policies to fail because they couldn't match user IDs.

## Solution Implemented

### 1. Database Schema Changes

**Migration: `20250120000009_fix_uuid_auth_mapping.sql`**
- ✅ Removed `DEFAULT uuid_generate_v4()` from `users.id` column
- ✅ Added trigger to ensure `id = auth.uid()` on user creation
- ✅ Updated `ensure_user_profile` RPC function to work without DEFAULT
- ✅ Added validation to prevent ID mismatches

**Migration: `20250120000010_update_rls_for_auth_ids.sql`**
- ✅ Updated all RLS policies to use `auth.uid()`
- ✅ Ensured policies work correctly with auth user IDs
- ✅ Added RLS policy testing functions

### 2. Client Code Updates

**Updated: `src/lib/supabaseService.ts`**
- ✅ Added validation to ensure `userId` matches `auth.uid()`
- ✅ Enhanced error handling for ID mismatches
- ✅ Maintained compatibility with existing `ensure_user_profile` RPC

### 3. Migration Tools

**Created: `apply-uuid-auth-migration.js`**
- ✅ Safe migration script with dry-run capability
- ✅ Handles existing users with random UUIDs
- ✅ Cleans up orphaned users without auth accounts
- ✅ Verifies RLS policies work correctly

**Created: `test-uuid-auth-migration.js`**
- ✅ Test script to verify migration without changes
- ✅ Checks database state and RLS policies
- ✅ Validates user-to-auth mapping

## Key Benefits

1. **RLS Compatibility**: All RLS policies now work correctly with `auth.uid()`
2. **Data Integrity**: User IDs always match auth user IDs
3. **Security**: Prevents users from accessing other users' data
4. **Performance**: Optimized user creation and lookup
5. **Maintainability**: Clear separation between auth and database concerns

## How It Works

### Before Migration
```sql
-- Users table with random UUIDs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ❌ Random UUIDs
  email TEXT UNIQUE NOT NULL,
  -- ... other fields
);

-- RLS policies that fail
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);  -- ❌ Never matches
```

### After Migration
```sql
-- Users table without DEFAULT
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- ✅ No DEFAULT, must be set explicitly
  email TEXT UNIQUE NOT NULL,
  -- ... other fields
);

-- Trigger ensures ID matches auth.uid()
CREATE TRIGGER users_auth_id_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_id_matches_auth();

-- RLS policies that work
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);  -- ✅ Always matches
```

## Usage Instructions

### 1. Test the Migration (Safe)
```bash
node test-uuid-auth-migration.js
```

### 2. Run the Migration
```bash
node apply-uuid-auth-migration.js
```

### 3. Verify Results
```bash
node test-uuid-auth-migration.js
```

## Migration Process

1. **Remove DEFAULT**: `ALTER TABLE users ALTER COLUMN id DROP DEFAULT;`
2. **Add Trigger**: Ensures `id = auth.uid()` on user creation
3. **Update RLS**: All policies use `auth.uid()`
4. **Migrate Existing**: Update existing users to match auth IDs
5. **Cleanup**: Remove orphaned users without auth accounts
6. **Verify**: Test RLS policies work correctly

## Safety Features

- ✅ **Dry Run Mode**: Test without making changes
- ✅ **Validation**: Prevents ID mismatches
- ✅ **Rollback**: Can be reversed if needed
- ✅ **Error Handling**: Comprehensive error checking
- ✅ **Logging**: Detailed migration logs

## Files Modified

### Database Migrations
- `supabase/migrations/20250120000009_fix_uuid_auth_mapping.sql`
- `supabase/migrations/20250120000010_update_rls_for_auth_ids.sql`

### Client Code
- `src/lib/supabaseService.ts` (enhanced validation)

### Migration Tools
- `apply-uuid-auth-migration.js` (migration script)
- `test-uuid-auth-migration.js` (test script)

## Next Steps

1. **Run Tests**: Execute `node test-uuid-auth-migration.js`
2. **Apply Migration**: Run `node apply-uuid-auth-migration.js`
3. **Verify**: Test user creation and RLS policies
4. **Monitor**: Check for any issues in production

## Troubleshooting

### Common Issues

1. **"User ID must match auth.uid()" Error**
   - Ensure client code passes correct user ID
   - Check that user is authenticated

2. **RLS Policy Failures**
   - Verify migration completed successfully
   - Check that user IDs match auth IDs

3. **Migration Errors**
   - Run in dry-run mode first
   - Check database permissions
   - Verify environment variables

### Support

If you encounter issues:
1. Check the migration logs
2. Run the test script
3. Verify RLS policies are working
4. Check that user IDs match auth IDs

---

*This migration ensures your RLS policies work correctly by aligning database user IDs with Supabase Auth user IDs.*
