import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuth() {
  console.log('🔍 Checking auth status...');
  
  // Check current session
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log('Session:', session?.session?.user?.id || 'NONE');
  console.log('Session error:', sessionError?.message || 'none');
  
  // Check current user
  const { data: user, error: userError } = await supabase.auth.getUser();
  console.log('User:', user?.user?.id || 'NONE');
  console.log('User error:', userError?.message || 'none');
  
  // Test authenticated query
  const { data: testData, error: testError } = await supabase
    .from('games')
    .select('id, title')
    .limit(1);
    
  console.log('Test query result:', testData ? 'SUCCESS' : 'FAILED');
  console.log('Test error:', testError?.message || 'none');
  console.log('Test error code:', testError?.code || 'none');
}

checkAuth();
