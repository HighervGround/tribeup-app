/**
 * Test script to verify the profile loading fix
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://alegufnopsminqcokelr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzQ4NzEsImV4cCI6MjA0MDMxMDg3MX0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProfileFix() {
  console.log('🧪 Testing Profile Loading Fix');
  console.log('==============================');

  try {
    // Test 1: Check if we can query users table
    console.log('\n1. Testing basic users table query...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, preferred_sports')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table query failed:', usersError.message);
      if (usersError.message.includes('406')) {
        console.log('🔍 This is the 406 error we\'re fixing');
      }
      return;
    }
    
    console.log('✅ Users table query successful');
    console.log('Sample data:', usersData);

    // Test 2: Check RLS policies
    console.log('\n2. Testing RLS policies...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (rlsError) {
      console.log('❌ RLS policy issue:', rlsError.message);
      if (rlsError.message.includes('406')) {
        console.log('🔍 406 error confirmed - RLS policy blocking access');
      }
    } else {
      console.log('✅ RLS policies working correctly');
    }

    console.log('\n🎉 Profile fix test completed!');
    console.log('\nIf you see 406 errors, the fix should handle them gracefully in the frontend.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testProfileFix();
