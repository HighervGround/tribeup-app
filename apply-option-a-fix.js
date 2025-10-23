#!/usr/bin/env node

/**
 * Apply Option A Fix
 * 
 * This script applies the Option A fix step by step to resolve the RLS issues.
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

async function step1_addAuthUserIdColumn() {
  console.log('🔧 Step 1: Adding auth_user_id column...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS auth_user_id UUID;
      `
    });
    
    if (error) {
      console.error('❌ Error adding auth_user_id column:', error);
      return false;
    }
    
    console.log('✅ auth_user_id column added');
    return true;
  } catch (err) {
    console.error('❌ Error in step 1:', err);
    return false;
  }
}

async function step2_populateAuthUserId() {
  console.log('🔧 Step 2: Populating auth_user_id mapping...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.users u 
        SET auth_user_id = a.id 
        FROM auth.users a 
        WHERE lower(a.email) = lower(u.email) 
          AND u.auth_user_id IS DISTINCT FROM a.id;
      `
    });
    
    if (error) {
      console.error('❌ Error populating auth_user_id:', error);
      return false;
    }
    
    console.log('✅ auth_user_id mapping populated');
    return true;
  } catch (err) {
    console.error('❌ Error in step 2:', err);
    return false;
  }
}

async function step3_createIndex() {
  console.log('🔧 Step 3: Creating performance index...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_auth_user_id 
        ON public.users(auth_user_id);
      `
    });
    
    if (error) {
      console.error('❌ Error creating index:', error);
      return false;
    }
    
    console.log('✅ Performance index created');
    return true;
  } catch (err) {
    console.error('❌ Error in step 3:', err);
    return false;
  }
}

async function step4_updateRLSPolicies() {
  console.log('🔧 Step 4: Updating RLS policies...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
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
    
    if (error) {
      console.error('❌ Error updating RLS policies:', error);
      return false;
    }
    
    console.log('✅ RLS policies updated to use auth_user_id');
    return true;
  } catch (err) {
    console.error('❌ Error in step 4:', err);
    return false;
  }
}

async function step5_addTrigger() {
  console.log('🔧 Step 5: Adding trigger for new users...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create function to ensure auth_user_id is set
        CREATE OR REPLACE FUNCTION ensure_auth_user_id_mapping()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.auth_user_id = auth.uid();
          IF NEW.id IS NULL THEN
            NEW.id = auth.uid();
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Create trigger
        DROP TRIGGER IF EXISTS users_auth_id_trigger ON public.users;
        CREATE TRIGGER users_auth_id_trigger
          BEFORE INSERT OR UPDATE ON public.users
          FOR EACH ROW
          EXECUTE FUNCTION ensure_auth_user_id_mapping();
      `
    });
    
    if (error) {
      console.error('❌ Error adding trigger:', error);
      return false;
    }
    
    console.log('✅ Trigger added for new users');
    return true;
  } catch (err) {
    console.error('❌ Error in step 5:', err);
    return false;
  }
}

async function step6_verify() {
  console.log('🔧 Step 6: Verifying the fix...');
  
  try {
    // Check if auth_user_id column exists and has data
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, auth_user_id')
      .limit(5);
    
    if (error) {
      console.error('❌ Error verifying fix:', error);
      return false;
    }
    
    console.log('📊 Verification results:');
    console.log(`   Total users checked: ${users.length}`);
    
    const mappedUsers = users.filter(u => u.auth_user_id !== null).length;
    console.log(`   Users with auth_user_id: ${mappedUsers}`);
    
    if (mappedUsers === 0) {
      console.log('❌ No users have auth_user_id mapped - fix failed');
      return false;
    }
    
    console.log('✅ Fix verification successful');
    return true;
  } catch (err) {
    console.error('❌ Error verifying fix:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Option A Fix');
  console.log('========================');
  
  // Step 1: Add auth_user_id column
  const step1Ok = await step1_addAuthUserIdColumn();
  if (!step1Ok) {
    console.error('❌ Step 1 failed');
    process.exit(1);
  }
  
  // Step 2: Populate auth_user_id mapping
  const step2Ok = await step2_populateAuthUserId();
  if (!step2Ok) {
    console.error('❌ Step 2 failed');
    process.exit(1);
  }
  
  // Step 3: Create index
  const step3Ok = await step3_createIndex();
  if (!step3Ok) {
    console.error('❌ Step 3 failed');
    process.exit(1);
  }
  
  // Step 4: Update RLS policies
  const step4Ok = await step4_updateRLSPolicies();
  if (!step4Ok) {
    console.error('❌ Step 4 failed');
    process.exit(1);
  }
  
  // Step 5: Add trigger
  const step5Ok = await step5_addTrigger();
  if (!step5Ok) {
    console.error('❌ Step 5 failed');
    process.exit(1);
  }
  
  // Step 6: Verify
  const step6Ok = await step6_verify();
  if (!step6Ok) {
    console.error('❌ Step 6 failed');
    process.exit(1);
  }
  
  console.log('\n✅ Option A Fix Applied Successfully!');
  console.log('🎉 RLS policies should now work correctly');
  console.log('🔒 Users can access their own data');
  console.log('📊 auth_user_id mapping is in place');
  console.log('⚡ Performance index is created');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Test your application - 406 errors should be resolved');
  console.log('2. Check that users can access their profiles');
  console.log('3. Verify onboarding flow works correctly');
}

main().catch(err => {
  console.error('❌ Fix application failed:', err);
  process.exit(1);
});
