-- Add onboarding_completed field to users table
-- This field tracks whether a user has completed the onboarding process

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for better performance when checking onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Update existing users to have onboarding_completed = true if they have sports preferences
-- This prevents existing users from being forced through onboarding again
UPDATE users 
SET onboarding_completed = TRUE 
WHERE preferred_sports IS NOT NULL 
  AND array_length(preferred_sports, 1) > 0
  AND onboarding_completed IS NULL;
