#!/usr/bin/env node

/**
 * UUID to Auth User ID Migration Script
 * 
 * This script safely migrates from random UUIDs to auth user IDs
 * to ensure RLS policies work correctly.
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

async function checkMigrationStatus() {
  console.log('🔍 Checking current migration status...');
  
  try {
    const { data, error } = await supabase
      .from('migration_status')
      .select('*');
    
    if (error) {
      console.error('❌ Error checking migration status:', error);
      return false;
    }
    
    console.log('📊 Current Status:');
    data.forEach(row => {
      console.log(`   ${row.metric}: ${row.count}`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Error checking status:', err);
    return false;
  }
}

async function analyzeUserMapping() {
  console.log('🔍 Analyzing user-to-auth mapping...');
  
  try {
    const { data, error } = await supabase
      .rpc('reconcile_user_auth_mapping');
    
    if (error) {
      console.error('❌ Error analyzing mapping:', error);
      return false;
    }
    
    console.log('📊 User Mapping Analysis:');
    console.log(`   Total users analyzed: ${data.length}`);
    
    const needsUpdate = data.filter(u => !u.has_auth_user);
    const hasAuthUser = data.filter(u => u.has_auth_user);
    
    console.log(`   Users with auth accounts: ${hasAuthUser.length}`);
    console.log(`   Users needing updates: ${needsUpdate.length}`);
    
    if (needsUpdate.length > 0) {
      console.log('⚠️  Users that need attention:');
      needsUpdate.forEach(user => {
        console.log(`     - ${user.email} (ID: ${user.user_id})`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error analyzing mapping:', err);
    return false;
  }
}

async function executeMigration() {
  console.log('🚀 Executing UUID to Auth ID migration...');
  
  try {
    // Step 1: Update user mappings
    console.log('   Step 1: Updating user auth mappings...');
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_user_auth_mapping');
    
    if (updateError) {
      console.error('❌ Error updating user mappings:', updateError);
      return false;
    }
    
    console.log(`   ✅ Updated ${updateResult} user mappings`);
    
    // Step 2: Clean up orphaned users
    console.log('   Step 2: Cleaning up orphaned users...');
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_orphaned_users');
    
    if (cleanupError) {
      console.error('❌ Error cleaning up orphaned users:', cleanupError);
      return false;
    }
    
    console.log(`   ✅ Cleaned up ${cleanupResult} orphaned users`);
    
    return true;
  } catch (err) {
    console.error('❌ Error executing migration:', err);
    return false;
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration results...');
  
  try {
    // Check that all users now have proper auth mappings
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_user_id, email')
      .is('auth_user_id', null);
    
    if (usersError) {
      console.error('❌ Error verifying users:', usersError);
      return false;
    }
    
    if (users.length > 0) {
      console.log('⚠️  Found users without auth_user_id:');
      users.forEach(user => {
        console.log(`     - ${user.email} (ID: ${user.id})`);
      });
      return false;
    }
    
    // Check that RLS policies work
    console.log('   Testing RLS policies...');
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (testError) {
      console.error('❌ RLS test failed:', testError);
      return false;
    }
    
    console.log('   ✅ RLS policies are working correctly');
    
    return true;
  } catch (err) {
    console.error('❌ Error verifying migration:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting UUID to Auth User ID Migration');
  console.log('==========================================');
  
  // Step 1: Check current status
  const statusOk = await checkMigrationStatus();
  if (!statusOk) {
    console.error('❌ Failed to check migration status');
    process.exit(1);
  }
  
  // Step 2: Analyze user mapping
  const analysisOk = await analyzeUserMapping();
  if (!analysisOk) {
    console.error('❌ Failed to analyze user mapping');
    process.exit(1);
  }
  
  // Ask for confirmation
  console.log('\n⚠️  This migration will:');
  console.log('   1. Update user IDs to match auth.users.id');
  console.log('   2. Update all related records (games, participants, etc.)');
  console.log('   3. Remove users without auth accounts');
  console.log('   4. Ensure RLS policies work correctly');
  
  console.log('\n🔄 Proceeding with migration...');
  
  // Step 3: Execute migration
  const migrationOk = await executeMigration();
  if (!migrationOk) {
    console.error('❌ Migration failed');
    process.exit(1);
  }
  
  // Step 4: Verify results
  const verificationOk = await verifyMigration();
  if (!verificationOk) {
    console.error('❌ Migration verification failed');
    process.exit(1);
  }
  
  console.log('\n✅ Migration completed successfully!');
  console.log('🎉 All users now have proper auth user ID mappings');
  console.log('🔒 RLS policies are working correctly');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('UUID to Auth User ID Migration Script');
  console.log('');
  console.log('Usage: node apply-uuid-auth-migration.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --dry-run      Analyze without making changes');
  console.log('');
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
  console.log('==========================================');
  
  checkMigrationStatus()
    .then(() => analyzeUserMapping())
    .then(() => {
      console.log('\n✅ Dry run completed - no changes made');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Dry run failed:', err);
      process.exit(1);
    });
} else {
  main().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}
