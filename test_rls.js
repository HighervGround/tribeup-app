import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
  console.log('🔍 Testing RLS policies...');
  
  // Test without auth (should fail for authenticated-only policies)
  const { data: anonData, error: anonError } = await supabase
    .from('game_participants')
    .select('*')
    .limit(1);
    
  console.log('Anonymous access:', anonData ? 'SUCCESS' : 'BLOCKED');
  console.log('Error:', anonError?.message || 'none');
  
  // Test user_presence
  const { data: presenceData, error: presenceError } = await supabase
    .from('user_presence')
    .select('*')
    .limit(1);
    
  console.log('Presence access:', presenceData ? 'SUCCESS' : 'BLOCKED');
  console.log('Error:', presenceError?.message || 'none');
}

testRLS();
