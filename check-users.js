import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('🔍 Checking users table...');
  
  // Query users table
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, username, email')
    .limit(10);
    
  if (error) {
    console.error('❌ Error querying users:', error);
    console.log('🔍 Trying with RLS bypass (service role)...');
    
    // Try with different approach - maybe RLS is blocking
    const { data: usersRaw, error: rawError } = await supabase
      .from('users')
      .select('*')
      .limit(10);
      
    if (rawError) {
      console.error('❌ Raw query also failed:', rawError);
    } else {
      console.log('✅ Raw query worked:', usersRaw);
    }
  } else {
    console.log('✅ Users found:', users);
  }
  
  // Also check auth.users (Supabase auth table)
  console.log('\n🔍 Checking auth.users table...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Cannot access auth.users (need service role):', authError.message);
  } else {
    console.log('✅ Auth users found:', authUsers.users.length);
    authUsers.users.forEach(user => {
      console.log(`  - ${user.id}: ${user.email} (${user.user_metadata?.full_name || 'no name'})`);
    });
  }
}

checkUsers().catch(console.error);
