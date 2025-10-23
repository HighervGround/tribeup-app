/**
 * Apply RLS fix migration to resolve 406 errors
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://alegufnopsminqcokelr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzQ4NzEsImV4cCI6MjA0MDMxMDg3MX0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyRLSFix() {
  console.log('🚀 Applying RLS Fix for 406 Errors');
  console.log('==================================');

  try {
    // Test current RLS policies
    console.log('\n1. Testing current RLS policies...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ RLS test failed:', testError.message);
      if (testError.message.includes('406')) {
        console.log('🔍 406 error confirmed - RLS policies need fixing');
      }
    } else {
      console.log('✅ RLS policies working correctly');
      console.log('Sample data:', testData);
    }

    console.log('\n📝 Manual RLS Fix Required');
    console.log('============================');
    console.log('Please run this SQL in your Supabase SQL editor:');
    console.log(`
-- Fix RLS policies for users table to resolve 406 errors
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create proper RLS policies for users table
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

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    `);

    console.log('\n🎯 After applying the RLS fix:');
    console.log('1. The 406 errors should be resolved');
    console.log('2. Users will be able to access their own profiles');
    console.log('3. Onboarding flow should work correctly');

  } catch (error) {
    console.error('❌ RLS fix test failed:', error);
  }
}

// Run the RLS fix
applyRLSFix();
