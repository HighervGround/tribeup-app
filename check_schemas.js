import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchemas() {
  console.log('🔍 Checking exact column names...\n');
  
  try {
    // Check user_presence columns
    const { data: presence, error: presenceError } = await supabase
      .from('user_presence')
      .select('*')
      .limit(1);
    
    if (presence && presence.length > 0) {
      console.log('📋 user_presence columns:', Object.keys(presence[0]));
    } else {
      console.log('📋 user_presence: empty table, checking via error...');
      // Try to insert to see column structure
      const { error } = await supabase
        .from('user_presence')
        .insert({ test: 'test' });
      console.log('user_presence error (shows expected columns):', error?.message);
    }
    
    // Check game_participants columns  
    const { data: participants, error: participantsError } = await supabase
      .from('game_participants')
      .select('*')
      .limit(1);
      
    if (participants && participants.length > 0) {
      console.log('📋 game_participants columns:', Object.keys(participants[0]));
    } else {
      const { error } = await supabase
        .from('game_participants')
        .insert({ test: 'test' });
      console.log('game_participants error:', error?.message);
    }
    
    // Check games columns
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(1);
      
    if (games && games.length > 0) {
      console.log('📋 games columns:', Object.keys(games[0]));
    } else {
      const { error } = await supabase
        .from('games')
        .insert({ test: 'test' });
      console.log('games error:', error?.message);
    }
    
  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkSchemas();
