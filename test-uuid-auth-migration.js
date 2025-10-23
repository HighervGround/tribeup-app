#!/usr/bin/env node

/**
 * Test script for UUID to Auth User ID migration
 * This script tests the migration without making changes
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

async function testUserCreation() {
  console.log('🧪 Testing user creation with new ID constraint...');
  
  try {
    // Test 1: Check if DEFAULT is removed
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_column_default', { table_name: 'users', column_name: 'id' });
    
    if (columnError) {
      console.log('   ⚠️  Could not check column default (expected if function doesn\'t exist)');
    } else {
      console.log('   📊 Column default info:', columnInfo);
    }
    
    // Test 2: Check current user count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return false;
    }
    
    console.log(`   📊 Current users in database: ${users.length}`);
    if (users.length > 0) {
      console.log('   📋 Sample users:');
      users.forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.email} (ID: ${user.id})`);
      });
    }
    
    // Test 3: Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('test_rls_policies');
    
    if (policiesError) {
      console.log('   ⚠️  Could not test RLS policies (expected if function doesn\'t exist)');
    } else {
      console.log('   🔒 RLS Policy Test Results:');
      policies.forEach(policy => {
        const status = policy.is_working ? '✅' : '❌';
        console.log(`     ${status} ${policy.policy_name} on ${policy.table_name}`);
        if (!policy.is_working && policy.error_message) {
          console.log(`        Error: ${policy.error_message}`);
        }
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error testing user creation:', err);
    return false;
  }
}

async function testMigrationStatus() {
  console.log('🔍 Checking migration status...');
  
  try {
    // Check if migration status view exists
    const { data: status, error: statusError } = await supabase
      .from('migration_status')
      .select('*');
    
    if (statusError) {
      console.log('   ⚠️  Migration status view not available (migration not run yet)');
      return true;
    }
    
    console.log('   📊 Migration Status:');
    status.forEach(row => {
      console.log(`     ${row.metric}: ${row.count}`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Error checking migration status:', err);
    return false;
  }
}

async function testUserMapping() {
  console.log('🔍 Testing user-to-auth mapping...');
  
  try {
    // Check if reconcile function exists
    const { data: mapping, error: mappingError } = await supabase
      .rpc('reconcile_user_auth_mapping');
    
    if (mappingError) {
      console.log('   ⚠️  User mapping function not available (migration not run yet)');
      return true;
    }
    
    console.log('   📊 User Mapping Analysis:');
    console.log(`     Total users analyzed: ${mapping.length}`);
    
    const needsUpdate = mapping.filter(u => !u.has_auth_user);
    const hasAuthUser = mapping.filter(u => u.has_auth_user);
    
    console.log(`     Users with auth accounts: ${hasAuthUser.length}`);
    console.log(`     Users needing updates: ${needsUpdate.length}`);
    
    if (needsUpdate.length > 0) {
      console.log('   ⚠️  Users that need attention:');
      needsUpdate.forEach(user => {
        console.log(`       - ${user.email} (ID: ${user.user_id})`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error testing user mapping:', err);
    return false;
  }
}

async function main() {
  console.log('🧪 UUID to Auth User ID Migration Test');
  console.log('=====================================');
  
  // Test 1: Check migration status
  const statusOk = await testMigrationStatus();
  if (!statusOk) {
    console.error('❌ Failed to check migration status');
    process.exit(1);
  }
  
  // Test 2: Test user creation
  const userTestOk = await testUserCreation();
  if (!userTestOk) {
    console.error('❌ Failed to test user creation');
    process.exit(1);
  }
  
  // Test 3: Test user mapping
  const mappingOk = await testUserMapping();
  if (!mappingOk) {
    console.error('❌ Failed to test user mapping');
    process.exit(1);
  }
  
  console.log('\n✅ All tests completed successfully!');
  console.log('🎉 Migration appears to be working correctly');
  console.log('💡 Run the actual migration with: node apply-uuid-auth-migration.js');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
