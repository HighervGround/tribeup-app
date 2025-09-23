// Quick database debug script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDatabase() {
  console.log('🔍 Checking authentication and users...');
  
  // Check current auth session
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session:', session?.session?.user?.id || 'none', 'Error:', sessionError);
  
  // Check auth.users (this should work without RLS)
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  console.log('Auth user:', authUser?.user?.id || 'none', 'Error:', authError);
  
  // Try to check users table with different approach
  const { data: usersCount, error: countError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });
    
  console.log('Users table count:', usersCount, 'Error:', countError);
  
  // Check if we can access any data at all
  const { data: anyData, error: anyError } = await supabase
    .from('users')
    .select('id')
    .limit(1);
    
  console.log('Any user data accessible:', anyData, 'Error:', anyError);
  
  // Check RLS policies
  const { data: policies, error: policyError } = await supabase
    .rpc('get_dev_users');
    
  console.log('Dev users function result:', policies, 'Error:', policyError);
}

debugDatabase().catch(console.error);
