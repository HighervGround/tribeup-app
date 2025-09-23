import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  console.log('🔍 Checking RLS and schema...');
  
  // Check if user_presence table exists
  const { data: presenceCheck, error: presenceError } = await supabase
    .from('user_presence')
    .select('*')
    .limit(1);
  
  console.log('user_presence table:', presenceCheck !== null ? 'EXISTS' : 'MISSING', 'Error:', presenceError?.message || 'none');
  
  // Check game_participants table
  const { data: participantsCheck, error: participantsError } = await supabase
    .from('game_participants')
    .select('*')
    .limit(1);
  
  console.log('game_participants table:', participantsCheck !== null ? 'EXISTS' : 'MISSING', 'Error:', participantsError?.message || 'none');
  
  // Check games table
  const { data: gamesCheck, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .limit(1);
  
  console.log('games table:', gamesCheck !== null ? 'EXISTS' : 'MISSING', 'Error:', gamesError?.message || 'none');
  
  // Check messages table (if exists)
  const { data: messagesCheck, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);
  
  console.log('messages table:', messagesCheck !== null ? 'EXISTS' : 'MISSING', 'Error:', messagesError?.message || 'none');
}

checkRLS().catch(console.error);
