#!/usr/bin/env node

/**
 * Diagnose Current State
 * 
 * This script checks what's actually implemented in your database
 * and identifies why it's not working.
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

async function checkUsersTableStructure() {
  console.log('🔍 Checking users table structure...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error checking users table:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      const user = data[0];
      console.log('📊 Users table columns:');
      Object.keys(user).forEach(key => {
        console.log(`   - ${key}: ${typeof user[key]}`);
      });
      
      // Check if auth_user_id exists
      if ('auth_user_id' in user) {
        console.log('✅ auth_user_id column exists');
      } else {
        console.log('❌ auth_user_id column does NOT exist');
      }
    } else {
      console.log('⚠️  No users found in database');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error checking users table structure:', err);
    return false;
  }
}

async function checkCurrentRLSPolicies() {
  console.log('🔍 Checking current RLS policies...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_table_policies', { table_name: 'users' });
    
    if (error) {
      console.log('   ⚠️  Could not check RLS policies directly');
      return true;
    }
    
    console.log('📊 Current RLS policies:');
    data.forEach(policy => {
      console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      console.log(`     Using: ${policy.qual}`);
    });
    
    return true;
  } catch (err) {
    console.log('   ⚠️  Could not check RLS policies');
    return true;
  }
}

async function testUserAccess() {
  console.log('🧪 Testing user access with current setup...');
  
  try {
    // Test if we can access users table
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing users table:', error);
      console.error('   This suggests RLS policies are blocking access');
      return false;
    }
    
    console.log('✅ Users table is accessible');
    return true;
  } catch (err) {
    console.error('❌ Error testing user access:', err);
    return false;
  }
}

async function checkAuthUsers() {
  console.log('🔍 Checking auth.users table...');
  
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
      .select('id, email, auth_user_id');
    
    if (error) {
      console.error('❌ Error checking user mapping:', error);
      return false;
    }
    
    console.log('📊 User mapping status:');
    console.log(`   Total users: ${users.length}`);
    
    if (users.length > 0) {
      const hasAuthUserId = users.filter(u => u.auth_user_id !== null && u.auth_user_id !== undefined).length;
      console.log(`   Users with auth_user_id: ${hasAuthUserId}`);
      console.log(`   Users without auth_user_id: ${users.length - hasAuthUserId}`);
      
      if (hasAuthUserId === 0) {
        console.log('❌ No users have auth_user_id mapped - this is the problem!');
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error checking user mapping:', err);
    return false;
  }
}

async function diagnoseProblem() {
  console.log('🔍 Diagnosing the problem...');
  
  try {
    // Check if the issue is with RLS policies
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID
      .maybeSingle();
    
    if (error) {
      console.log('❌ RLS policies are blocking access - this is likely the issue');
      console.log('   Error:', error.message);
      return 'rls_blocking';
    }
    
    console.log('✅ RLS policies are not blocking access');
    return 'rls_working';
  } catch (err) {
    console.error('❌ Error diagnosing problem:', err);
    return 'unknown';
  }
}

async function main() {
  console.log('🔍 Diagnosing Current State');
  console.log('============================');
  
  // Check 1: Users table structure
  const structureOk = await checkUsersTableStructure();
  if (!structureOk) {
    console.error('❌ Users table structure check failed');
    process.exit(1);
  }
  
  // Check 2: RLS policies
  await checkCurrentRLSPolicies();
  
  // Check 3: User access
  const accessOk = await testUserAccess();
  if (!accessOk) {
    console.log('❌ User access is blocked - this is the main issue');
  }
  
  // Check 4: Auth users
  await checkAuthUsers();
  
  // Check 5: User mapping
  await checkUserMapping();
  
  // Check 6: Diagnose problem
  const problem = await diagnoseProblem();
  
  console.log('\n🎯 DIAGNOSIS SUMMARY');
  console.log('===================');
  
  if (problem === 'rls_blocking') {
    console.log('❌ PROBLEM: RLS policies are blocking access');
    console.log('💡 SOLUTION: Apply the Option A migration to fix RLS policies');
    console.log('📝 ACTION: Run the migration scripts to add auth_user_id column and update RLS policies');
  } else if (problem === 'rls_working') {
    console.log('✅ RLS policies are working');
    console.log('💡 The issue might be elsewhere - check the specific error messages');
  } else {
    console.log('❓ Unknown problem - check the specific error messages above');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. If RLS is blocking: Apply Option A migration');
  console.log('2. If RLS is working: Check specific error messages');
  console.log('3. Run: node apply-option-a-migration.js');
}

main().catch(err => {
  console.error('❌ Diagnosis failed:', err);
  process.exit(1);
});
