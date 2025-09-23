import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMissingColumns() {
  console.log('🔍 Checking for name/avatar columns in user_presence...\n');
  
  // Try to select name and avatar columns
  const { data, error } = await supabase
    .from('user_presence')
    .select('user_id, name, avatar, last_seen')
    .limit(1);
    
  if (error) {
    console.log('❌ Missing columns in user_presence:', error.message);
    console.log('📝 Need to add: name, avatar columns');
  } else {
    console.log('✅ user_presence has name/avatar columns');
  }
  
  // Check game_participants structure
  const { data: participants, error: partError } = await supabase
    .from('game_participants')
    .select('*')
    .limit(1);
    
  if (participants && participants.length > 0) {
    console.log('📋 game_participants columns:', Object.keys(participants[0]));
  } else if (partError) {
    console.log('game_participants error:', partError.message);
  } else {
    console.log('📋 game_participants: empty table');
  }
}

checkMissingColumns();
