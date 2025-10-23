/**
 * Apply the onboarding_completed migration directly via SQL
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://alegufnopsminqcokelr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzQ4NzEsImV4cCI6MjA0MDMxMDg3MX0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigrationDirect() {
  console.log('🚀 Applying onboarding_completed migration directly...');
  console.log('=====================================================');

  try {
    // Step 1: Check if column already exists
    console.log('\n1. Checking if onboarding_completed column exists...');
    const { data: checkData, error: checkError } = await supabase
      .from('users')
      .select('onboarding_completed')
      .limit(1);
    
    if (checkError && checkError.message.includes('column "onboarding_completed" does not exist')) {
      console.log('❌ Column does not exist - migration needed');
      console.log('\n📝 Please run this SQL manually in your Supabase SQL editor:');
      console.log(`
-- Add onboarding_completed field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for better performance when checking onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Update existing users to have onboarding_completed = true if they have sports preferences
UPDATE users 
SET onboarding_completed = TRUE 
WHERE preferred_sports IS NOT NULL 
  AND array_length(preferred_sports, 1) > 0
  AND onboarding_completed IS NULL;
      `);
      return;
    } else if (checkError) {
      console.log('❌ Error checking column:', checkError.message);
      return;
    } else {
      console.log('✅ Column already exists');
    }

    // Step 2: Check current users
    console.log('\n2. Checking current users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, onboarding_completed, preferred_sports')
      .limit(10);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`✅ Found ${usersData.length} users`);
    usersData.forEach(user => {
      console.log(`  - ${user.email}: onboarding_completed=${user.onboarding_completed}, sports=${user.preferred_sports?.length || 0}`);
    });

    console.log('\n🎉 Migration check completed!');
    console.log('\nIf you see this message, the onboarding_completed field exists and the migration is working.');

  } catch (error) {
    console.error('❌ Migration check failed:', error);
    console.log('\n📝 Manual migration required. Please run this SQL in your Supabase SQL editor:');
    console.log(`
-- Add onboarding_completed field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for better performance when checking onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Update existing users to have onboarding_completed = true if they have sports preferences
UPDATE users 
SET onboarding_completed = TRUE 
WHERE preferred_sports IS NOT NULL 
  AND array_length(preferred_sports, 1) > 0
  AND onboarding_completed IS NULL;
    `);
  }
}

// Run the migration check
applyMigrationDirect();
