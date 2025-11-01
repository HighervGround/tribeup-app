# RLS Diagnostic: Other User Profile Access

## Resources Being Queried

### Primary Resource: `user_public_profile` VIEW
- **Role**: `authenticated` (user is logged in)
- **Query Pattern**: 
  ```sql
  SELECT id, display_name, avatar_url, username, bio, location 
  FROM user_public_profile 
  WHERE id = $userId
  ```
  OR
  ```sql
  SELECT id, display_name, avatar_url, username, bio, location 
  FROM user_public_profile 
  WHERE id IN ($userId)
  ```
- **Use Case**: Fetching other users' public profiles when clicking on game participants
- **Current Status**: This view works successfully in `getGameParticipants()` (batch queries), but single-user queries fail

### Fallback Resource: `users` TABLE
- **Role**: `authenticated`
- **Query Pattern**:
  ```sql
  SELECT id, full_name, username, avatar_url, bio, location, auth_user_id 
  FROM users 
  WHERE id = $userId OR auth_user_id = $userId
  ```
- **Use Case**: Fallback if view doesn't exist or has RLS issues

## Required Columns

### From `user_public_profile` view:
- `id` (UUID)
- `display_name` (TEXT)
- `avatar_url` (TEXT)
- `username` (TEXT)
- `bio` (TEXT)
- `location` (TEXT)

### From `users` table (fallback):
- `id` (UUID)
- `full_name` (TEXT) - maps to `display_name` in view
- `username` (TEXT)
- `avatar_url` (TEXT)
- `bio` (TEXT)
- `location` (TEXT)
- `auth_user_id` (UUID) - for matching purposes

## Diagnostic Queries

### Test 1: Check if view exists and is accessible
```sql
-- Check if view exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'user_public_profile';

-- Test view accessibility (as authenticated user)
SELECT id, display_name, avatar_url, username, bio, location 
FROM user_public_profile 
WHERE id = '654fbc89-0211-4c1e-9977-21f42084b918'
LIMIT 1;
```

### Test 2: Check users table RLS
```sql
-- Check current RLS policies on users table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test users table access (as authenticated user)
SELECT id, full_name, username, avatar_url, bio, location, auth_user_id 
FROM users 
WHERE id = '654fbc89-0211-4c1e-9977-21f42084b918'
LIMIT 1;
```

### Test 3: Check if user exists in database
```sql
-- Check if user exists at all
SELECT id, full_name, username, email, auth_user_id 
FROM users 
WHERE id = '654fbc89-0211-4c1e-9977-21f42084b918' 
   OR auth_user_id = '654fbc89-0211-4c1e-9977-21f42084b918';

-- Check in auth.users (if auth_user_id is used)
SELECT id, email 
FROM auth.users 
WHERE id = '654fbc89-0211-4c1e-9977-21f42084b918';
```

## Required RLS Policies

### For `user_public_profile` VIEW:
```sql
-- Policy: Allow authenticated users to read all public profiles
CREATE POLICY "authenticated_users_read_public_profiles" 
ON user_public_profile 
FOR SELECT 
TO authenticated 
USING (true);
```

### For `users` TABLE (if view doesn't work):
```sql
-- Policy: Allow authenticated users to read basic profile info of other users
CREATE POLICY "authenticated_users_read_other_profiles" 
ON users 
FOR SELECT 
TO authenticated 
USING (
  -- Allow reading own profile
  auth.uid() = auth_user_id 
  OR 
  auth.uid() = id::text
  OR
  -- Allow reading other users' public fields (if view not available)
  true
);
```

## Current Issue

The userId `654fbc89-0211-4c1e-9977-21f42084b918` is being passed from `game_participants.user_id`, but queries to fetch that user's profile are failing with "User not found".

**Likely Causes:**
1. `user_public_profile` view doesn't exist or has restrictive RLS
2. `users` table RLS only allows reading own row
3. The userId format doesn't match between `game_participants.user_id` and `users.id` or `users.auth_user_id`

**Next Steps:**
1. Run diagnostic queries above
2. Check if `user_public_profile` view exists and its definition
3. Verify RLS policies on both view and table
4. Create/update policies to allow authenticated users to read other users' public profiles

