import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getGameDetails() {
  console.log('🔍 Getting game details...\n');
  
  // Get games
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*');
    
  if (gamesError) {
    console.error('❌ Error fetching games:', gamesError);
    return;
  }
  
  console.log(`📊 Found ${games?.length || 0} games:`);
  games?.forEach(game => {
    console.log(`  🎯 Game ID: ${game.id}`);
    console.log(`     Title: "${game.title}"`);
    console.log(`     Creator: ${game.creator_id}`);
    console.log(`     Date: ${game.date} ${game.time}`);
    console.log(`     Players: ${game.current_players}/${game.max_players}`);
    console.log('');
  });
  
  // Get participants
  const { data: participants, error: participantsError } = await supabase
    .from('game_participants')
    .select('*');
    
  if (participantsError) {
    console.error('❌ Error fetching participants:', participantsError);
    return;
  }
  
  console.log(`👥 Found ${participants?.length || 0} participants:`);
  participants?.forEach(participant => {
    console.log(`  🏃 Game ID: ${participant.game_id}`);
    console.log(`     User ID: ${participant.user_id}`);
    console.log(`     Status: ${participant.status || 'active'}`);
    console.log(`     Joined: ${participant.joined_at}`);
    console.log('');
  });
  
  // Get users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');
    
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }
  
  console.log(`👤 Found ${users?.length || 0} users:`);
  users?.forEach(user => {
    console.log(`  👤 User ID: ${user.id}`);
    console.log(`     Name: ${user.full_name || user.username || 'No name'}`);
    console.log(`     Email: ${user.email}`);
    console.log('');
  });
}

getGameDetails().catch(console.error);
