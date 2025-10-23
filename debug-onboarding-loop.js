#!/usr/bin/env node

/**
 * Debug Onboarding Loop
 * 
 * This script diagnoses why the onboarding loop is happening
 * and provides a quick fix.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersTable() {
  console.log('🔍 Checking users table structure...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing users table:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      const user = data[0];
      console.log('📊 Users table columns:');
      Object.keys(user).forEach(key => {
        console.log(`   - ${key}: ${user[key]}`);
      });
      
      // Check if auth_user_id exists
      if ('auth_user_id' in user) {
        console.log('✅ auth_user_id column exists');
      } else {
        console.log('❌ auth_user_id column does NOT exist - this is the problem!');
      }
    } else {
      console.log('⚠️  No users found in database');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error checking users table:', err);
    return false;
  }
}

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies...');
  
  try {
    // Try to access users table as if we were a regular user
    const { data, error } = await supabase
      .from('users')
      .select('id, email, onboarding_completed')
      .limit(1);
    
    if (error) {
      console.error('❌ RLS is blocking access:', error);
      console.log('💡 This is why onboarding keeps looping!');
      return false;
    }
    
    console.log('✅ RLS policies are working');
    return true;
  } catch (err) {
    console.error('❌ Error checking RLS policies:', err);
    return false;
  }
}

async function checkAuthUsers() {
  console.log('🔍 Checking auth.users...');
  
  try {
    const { data, error } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(3);
    
    if (error) {
      console.error('❌ Error accessing auth.users:', error);
      return false;
    }
    
    console.log('📊 Auth users found:');
    data.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Error checking auth.users:', err);
    return false;
  }
}

async function checkUserMapping() {
  console.log('🔍 Checking user mapping...');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, auth_user_id, onboarding_completed');
    
    if (error) {
      console.error('❌ Error checking user mapping:', error);
      return false;
    }
    
    console.log('📊 User mapping status:');
    console.log(`   Total users: ${users.length}`);
    
    if (users.length > 0) {
      const hasAuthUserId = users.filter(u => u.auth_user_id !== null && u.auth_user_id !== undefined).length;
      const completedOnboarding = users.filter(u => u.onboarding_completed === true).length;
      
      console.log(`   Users with auth_user_id: ${hasAuthUserId}`);
      console.log(`   Users with completed onboarding: ${completedOnboarding}`);
      
      if (hasAuthUserId === 0) {
        console.log('❌ No users have auth_user_id mapped - this is the problem!');
      }
      
      // Show sample users
      users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.email}: auth_user_id=${user.auth_user_id}, onboarding_completed=${user.onboarding_completed}`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error checking user mapping:', err);
    return false;
  }
}

async function applyQuickFix() {
  console.log('🔧 Applying quick fix...');
  
  try {
    // Step 1: Add auth_user_id column
    console.log('   Step 1: Adding auth_user_id column...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS auth_user_id UUID;
      `
    });
    
    if (addColumnError) {
      console.error('❌ Error adding auth_user_id column:', addColumnError);
      return false;
    }
    
    // Step 2: Populate auth_user_id mapping
    console.log('   Step 2: Populating auth_user_id mapping...');
    const { error: mappingError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.users u 
        SET auth_user_id = a.id 
        FROM auth.users a 
        WHERE lower(a.email) = lower(u.email) 
          AND u.auth_user_id IS DISTINCT FROM a.id;
      `
    });
    
    if (mappingError) {
      console.error('❌ Error populating auth_user_id mapping:', mappingError);
      return false;
    }
    
    // Step 3: Update RLS policies
    console.log('   Step 3: Updating RLS policies...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can read own row" ON public.users;
        DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
        DROP POLICY IF EXISTS "Users can update own row" ON public.users;
        
        -- Create new policies using auth_user_id
        CREATE POLICY "Users can read own profile" ON public.users 
        FOR SELECT TO authenticated 
        USING (auth_user_id = auth.uid());
        
        CREATE POLICY "Users can insert own profile" ON public.users 
        FOR INSERT TO authenticated 
        WITH CHECK (auth_user_id = auth.uid());
        
        CREATE POLICY "Users can update own profile" ON public.users 
        FOR UPDATE TO authenticated 
        USING (auth_user_id = auth.uid()) 
        WITH CHECK (auth_user_id = auth.uid());
      `
    });
    
    if (rlsError) {
      console.error('❌ Error updating RLS policies:', rlsError);
      return false;
    }
    
    console.log('✅ Quick fix applied successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error applying quick fix:', err);
    return false;
  }
}

async function main() {
  console.log('🔍 Debugging Onboarding Loop');
  console.log('============================');
  
  // Check 1: Users table structure
  const structureOk = await checkUsersTable();
  if (!structureOk) {
    console.error('❌ Users table structure check failed');
    process.exit(1);
  }
  
  // Check 2: RLS policies
  const rlsOk = await checkRLSPolicies();
  if (!rlsOk) {
    console.log('❌ RLS policies are blocking access - this is why onboarding loops!');
  }
  
  // Check 3: Auth users
  await checkAuthUsers();
  
  // Check 4: User mapping
  await checkUserMapping();
  
  console.log('\n🎯 DIAGNOSIS SUMMARY');
  console.log('===================');
  
  if (!rlsOk) {
    console.log('❌ PROBLEM: RLS policies are blocking access to users table');
    console.log('💡 CAUSE: auth_user_id column doesn\'t exist or RLS policies are wrong');
    console.log('🔧 SOLUTION: Apply the Option A fix to resolve RLS issues');
    
    console.log('\n🚀 APPLYING QUICK FIX...');
    const fixOk = await applyQuickFix();
    
    if (fixOk) {
      console.log('\n✅ Quick fix applied! Onboarding loop should be resolved.');
      console.log('🔄 Refresh your app and try again.');
    } else {
      console.log('\n❌ Quick fix failed. Run the full Option A migration instead.');
    }
  } else {
    console.log('✅ RLS policies are working - the issue might be elsewhere');
  }
}

main().catch(err => {
  console.error('❌ Debug failed:', err);
  process.exit(1);
});
