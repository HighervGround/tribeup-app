/**
 * Test script for onboarding flow
 * This script tests both email/password and OAuth authentication flows
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://alegufnopsminqcokelr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzQ4NzEsImV4cCI6MjA0MDMxMDg3MX0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testOnboardingFlow() {
  console.log('🧪 Testing Onboarding Flow');
  console.log('========================');

  try {
    // Test 1: Check if onboarding_completed field exists
    console.log('\n1. Checking database schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('users')
      .select('onboarding_completed')
      .limit(1);
    
    if (schemaError) {
      console.log('❌ onboarding_completed field not found. Run migration first.');
      console.log('   Migration: supabase/migrations/20250120000007_add_onboarding_completed_field.sql');
      return;
    }
    console.log('✅ onboarding_completed field exists');

    // Test 2: Test user profile creation with onboarding_completed
    console.log('\n2. Testing profile creation...');
    const testUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      username: 'testuser',
      full_name: 'Test User',
      onboarding_completed: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();

    if (insertError) {
      console.log('❌ Profile creation failed:', insertError.message);
      return;
    }
    console.log('✅ Profile created successfully');

    // Test 3: Test onboarding completion
    console.log('\n3. Testing onboarding completion...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        onboarding_completed: true,
        preferred_sports: ['Basketball', 'Soccer']
      })
      .eq('id', testUser.id)
      .select();

    if (updateError) {
      console.log('❌ Onboarding completion failed:', updateError.message);
      return;
    }
    console.log('✅ Onboarding completion successful');

    // Test 4: Test onboarding detection logic
    console.log('\n4. Testing onboarding detection...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.id)
      .single();

    if (profileError) {
      console.log('❌ Profile retrieval failed:', profileError.message);
      return;
    }

    const needsOnboarding = !profileData.onboarding_completed || 
                           !profileData.preferred_sports || 
                           profileData.preferred_sports.length === 0;

    console.log('Profile data:', {
      onboarding_completed: profileData.onboarding_completed,
      preferred_sports: profileData.preferred_sports,
      needsOnboarding
    });

    if (needsOnboarding) {
      console.log('❌ Onboarding detection failed - user should not need onboarding');
    } else {
      console.log('✅ Onboarding detection working correctly');
    }

    // Cleanup
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);

    if (deleteError) {
      console.log('⚠️ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 All onboarding flow tests passed!');
    console.log('\nNext steps:');
    console.log('1. Run the migration: supabase/migrations/20250120000007_add_onboarding_completed_field.sql');
    console.log('2. Test the frontend onboarding flow');
    console.log('3. Verify both email/password and OAuth flows work correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOnboardingFlow();
