# Child Tables with Foreign Keys to users.id

## Complete List of Tables with FKs to users.id

Based on the database schema analysis, here are all the child tables that reference `users.id`:

### 1. **games** table
- **Column**: `creator_id`
- **FK Constraint**: `games_creator_id_fkey`
- **Action**: `ON DELETE CASCADE`

### 2. **game_participants** table  
- **Column**: `user_id`
- **FK Constraint**: `game_participants_user_id_fkey`
- **Action**: `ON DELETE CASCADE`

### 3. **chat_messages** table
- **Column**: `user_id` 
- **FK Constraint**: `chat_messages_user_id_fkey`
- **Action**: `ON DELETE CASCADE`

### 4. **notifications** table
- **Column**: `user_id`
- **FK Constraint**: `notifications_user_id_fkey` 
- **Action**: `ON DELETE CASCADE`

### 5. **game_reviews** table
- **Column**: `reviewer_id`
- **FK Constraint**: `game_reviews_reviewer_id_fkey`
- **Action**: `ON DELETE CASCADE`
- **Column**: `reviewee_id`
- **FK Constraint**: `game_reviews_reviewee_id_fkey`
- **Action**: `ON DELETE CASCADE`

### 6. **user_permissions** table
- **Column**: `user_id`
- **FK Constraint**: `user_permissions_user_id_fkey`
- **Action**: `ON DELETE CASCADE`
- **Column**: `granted_by`
- **FK Constraint**: `user_permissions_granted_by_fkey`
- **Action**: `ON DELETE SET NULL` (nullable)

### 7. **admin_users** table
- **Column**: `admin_id`
- **FK Constraint**: `admin_users_admin_id_fkey`
- **Action**: `ON DELETE CASCADE`

### 8. **user_stats** table (if exists)
- **Column**: `user_id`
- **FK Constraint**: `user_stats_user_id_fkey`
- **Action**: `ON DELETE CASCADE`

### 9. **user_presence** table (if exists)
- **Column**: `user_id`
- **FK Constraint**: `user_presence_user_id_fkey`
- **Action**: `ON DELETE CASCADE`

## Required UPDATE Statements

For each table, you'll need UPDATE statements like this:

```sql
-- Update games table
UPDATE games 
SET creator_id = auth_users.id 
FROM auth.users auth_users
WHERE games.creator_id = old_user_id 
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update game_participants table  
UPDATE game_participants
SET user_id = auth_users.id
FROM auth.users auth_users  
WHERE game_participants.user_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update chat_messages table
UPDATE chat_messages
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE chat_messages.user_id = old_user_id  
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update notifications table
UPDATE notifications
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE notifications.user_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update game_reviews table (reviewer_id)
UPDATE game_reviews
SET reviewer_id = auth_users.id
FROM auth.users auth_users
WHERE game_reviews.reviewer_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update game_reviews table (reviewee_id)  
UPDATE game_reviews
SET reviewee_id = auth_users.id
FROM auth.users auth_users
WHERE game_reviews.reviewee_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update user_permissions table (user_id)
UPDATE user_permissions
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE user_permissions.user_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update user_permissions table (granted_by)
UPDATE user_permissions
SET granted_by = auth_users.id
FROM auth.users auth_users
WHERE user_permissions.granted_by = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update admin_users table
UPDATE admin_users
SET admin_id = auth_users.id
FROM auth.users auth_users
WHERE admin_users.admin_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update user_stats table (if exists)
UPDATE user_stats
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE user_stats.user_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);

-- Update user_presence table (if exists)
UPDATE user_presence
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE user_presence.user_id = old_user_id
  AND auth_users.email = (SELECT email FROM users WHERE id = old_user_id);
```

## Safe FK Drop/Recreate Statements

For each table, you'll need to:

1. **Drop the FK constraint**
2. **Update the data** 
3. **Recreate the FK constraint**

```sql
-- Example for games table:
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_creator_id_fkey;
-- ... run UPDATE statement ...
ALTER TABLE games ADD CONSTRAINT games_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;

-- Example for game_participants table:
ALTER TABLE game_participants DROP CONSTRAINT IF EXISTS game_participants_user_id_fkey;
-- ... run UPDATE statement ...
ALTER TABLE game_participants ADD CONSTRAINT game_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Example for chat_messages table:
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
-- ... run UPDATE statement ...
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Example for notifications table:
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
-- ... run UPDATE statement ...
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Example for game_reviews table (both FKs):
ALTER TABLE game_reviews DROP CONSTRAINT IF EXISTS game_reviews_reviewer_id_fkey;
ALTER TABLE game_reviews DROP CONSTRAINT IF EXISTS game_reviews_reviewee_id_fkey;
-- ... run UPDATE statements ...
ALTER TABLE game_reviews ADD CONSTRAINT game_reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE game_reviews ADD CONSTRAINT game_reviews_reviewee_id_fkey
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE;

-- Example for user_permissions table (both FKs):
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey;
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_granted_by_fkey;
-- ... run UPDATE statements ...
ALTER TABLE user_permissions ADD CONSTRAINT user_permissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_permissions ADD CONSTRAINT user_permissions_granted_by_fkey
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Example for admin_users table:
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_admin_id_fkey;
-- ... run UPDATE statement ...
ALTER TABLE admin_users ADD CONSTRAINT admin_users_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
```

## Migration Order

Execute in this order to avoid FK constraint violations:

1. **Drop all FK constraints** (all tables)
2. **Update users table** (set id = auth.uid())
3. **Update all child tables** (in any order)
4. **Recreate all FK constraints** (all tables)

## Verification Queries

After migration, verify with:

```sql
-- Check for any remaining mismatched IDs
SELECT 'games' as table_name, COUNT(*) as mismatched_count
FROM games g
LEFT JOIN auth.users au ON g.creator_id = au.id
WHERE au.id IS NULL
UNION ALL
SELECT 'game_participants', COUNT(*)
FROM game_participants gp  
LEFT JOIN auth.users au ON gp.user_id = au.id
WHERE au.id IS NULL
UNION ALL
SELECT 'chat_messages', COUNT(*)
FROM chat_messages cm
LEFT JOIN auth.users au ON cm.user_id = au.id  
WHERE au.id IS NULL
UNION ALL
SELECT 'notifications', COUNT(*)
FROM notifications n
LEFT JOIN auth.users au ON n.user_id = au.id
WHERE au.id IS NULL;
```

This should return 0 mismatched records for all tables.
