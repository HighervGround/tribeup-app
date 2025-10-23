/**
 * Apply the onboarding_completed field migration directly
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://alegufnopsminqcokelr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzQ4NzEsImV4cCI6MjA0MDMxMDg3MX0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Applying onboarding_completed field migration...');
  console.log('================================================');

  try {
    // Step 1: Add the column
    console.log('\n1. Adding onboarding_completed column...');
    const { data: alterData, error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      `
    });

    if (alterError) {
      console.log('❌ Failed to add column:', alterError.message);
      // Try alternative approach
      console.log('🔄 Trying alternative approach...');
      
      // Check if column already exists
      const { data: checkData, error: checkError } = await supabase
        .from('users')
        .select('onboarding_completed')
        .limit(1);
      
      if (checkError && checkError.message.includes('column "onboarding_completed" does not exist')) {
        console.log('❌ Column does not exist and cannot be added via RPC');
        console.log('📝 Please run this SQL manually in your Supabase SQL editor:');
        console.log(`
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

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
    } else {
      console.log('✅ Column added successfully');
    }

    // Step 2: Create index
    console.log('\n2. Creating index...');
    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);
      `
    });

    if (indexError) {
      console.log('⚠️ Index creation failed (may already exist):', indexError.message);
    } else {
      console.log('✅ Index created successfully');
    }

    // Step 3: Update existing users
    console.log('\n3. Updating existing users...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .not('preferred_sports', 'is', null)
      .neq('preferred_sports', '{}')
      .select();

    if (updateError) {
      console.log('⚠️ Update failed:', updateError.message);
    } else {
      console.log(`✅ Updated ${updateData?.length || 0} existing users`);
    }

    // Step 4: Verify the migration
    console.log('\n4. Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('id, onboarding_completed, preferred_sports')
      .limit(5);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Migration verified successfully');
      console.log('Sample data:', verifyData);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: node test-onboarding-flow.js');
    console.log('2. Test the frontend onboarding flow');

  } catch (error) {
    console.error('❌ Migration failed:', error);
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

// Run the migration
applyMigration();
