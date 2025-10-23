# Onboarding Migration Instructions

## Manual Migration Required

Due to API key limitations, please run the following SQL commands manually in your Supabase SQL editor:

### Step 1: Add the onboarding_completed field

```sql
-- Add onboarding_completed field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
```

### Step 2: Create index for performance

```sql
-- Create index for better performance when checking onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);
```

### Step 3: Update existing users

```sql
-- Update existing users to have onboarding_completed = true if they have sports preferences
-- This prevents existing users from being forced through onboarding again
UPDATE users 
SET onboarding_completed = TRUE 
WHERE preferred_sports IS NOT NULL 
  AND array_length(preferred_sports, 1) > 0
  AND onboarding_completed IS NULL;
```

### Step 4: Verify the migration

```sql
-- Check that the field was added successfully
SELECT id, email, onboarding_completed, preferred_sports 
FROM users 
LIMIT 5;
```

## How to Run These Commands

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each SQL command above
4. Run them one by one
5. Verify the results

## After Migration

Once the migration is complete, you can test the onboarding flow:

```bash
node test-onboarding-flow.js
```

## Expected Results

After running the migration:
- All existing users with sports preferences will have `onboarding_completed = true`
- New users will have `onboarding_completed = false` by default
- The onboarding flow will work correctly for both email/password and OAuth users
