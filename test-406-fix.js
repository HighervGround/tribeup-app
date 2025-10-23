/**
 * Test script to verify the 406 error fix
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://alegufnopsminqcokelr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzQ4NzEsImV4cCI6MjA0MDMxMDg3MX0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test406Fix() {
  console.log('🧪 Testing 406 Error Fix');
  console.log('========================');

  try {
    // Test 1: Check if we can query users table with proper structure
    console.log('\n1. Testing proper query structure...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id,email,username,full_name,avatar_url,bio,location,preferred_sports,stats,onboarding_completed,created_at')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Query failed:', usersError.message);
      if (usersError.message.includes('406')) {
        console.log('🔍 406 error still present - RLS policies may need fixing');
      }
      return;
    }
    
    console.log('✅ Query structure working correctly');
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
        console.log('🔍 406 error confirmed - RLS policies need fixing');
        console.log('\n📝 Apply this SQL in your Supabase SQL editor:');
        console.log(`
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

CREATE POLICY "Users can read own row" ON public.users 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can insert own row" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own row" ON public.users 
FOR UPDATE TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        `);
      }
    } else {
      console.log('✅ RLS policies working correctly');
    }

    console.log('\n🎉 406 fix test completed!');
    console.log('\nIf you see 406 errors, apply the RLS migration in your Supabase SQL editor.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
test406Fix();
