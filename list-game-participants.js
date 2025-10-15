import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listGameParticipants() {
  const gameId = '017a2347-f8d4-4a5f-b4f5-2e60d97a0398';
  
  console.log(`🔍 Listing participants for game: ${gameId}\n`);
  
  // List all participants for this game (no user filter)
  console.log('📋 All participants in game_participants table:');
  const { data: allParticipants, error: allError } = await supabase
    .from('game_participants')
    .select('*')
    .eq('game_id', gameId);
    
  if (allError) {
    console.error('❌ Error fetching all participants:', allError);
  } else {
    console.log(`   Found ${allParticipants?.length || 0} participants`);
    allParticipants?.forEach((p, i) => {
      console.log(`   ${i + 1}. User: ${p.user_id}`);
      console.log(`      Status: ${p.status || 'active'}`);
      console.log(`      Joined: ${p.joined_at}`);
      console.log(`      Left: ${p.left_at || 'N/A'}`);
    });
  }
  
  // Check if there are ANY participants in the table
  console.log('\n📋 All participants in entire game_participants table:');
  const { data: globalParticipants, error: globalError } = await supabase
    .from('game_participants')
    .select('*');
    
  if (globalError) {
    console.error('❌ Error fetching global participants:', globalError);
  } else {
    console.log(`   Found ${globalParticipants?.length || 0} total participants across all games`);
    globalParticipants?.forEach((p, i) => {
      console.log(`   ${i + 1}. Game: ${p.game_id}, User: ${p.user_id}, Status: ${p.status || 'active'}`);
    });
  }
  
  // Check the game details again
  console.log('\n🎯 Game details:');
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
    
  if (gameError) {
    console.error('❌ Error fetching game:', gameError);
  } else {
    console.log(`   Title: ${game.title}`);
    console.log(`   Creator: ${game.creator_id}`);
    console.log(`   Current Players: ${game.current_players}`);
    console.log(`   Max Players: ${game.max_players}`);
    console.log(`   Date: ${game.date} ${game.time}`);
  }
  
  // Check if the creator is supposed to be auto-included as a participant
  console.log('\n🤔 Analysis:');
  if (game && (allParticipants?.length || 0) === 0 && game.current_players > 0) {
    console.log('   🚨 ISSUE: Game shows current_players > 0 but no participants in table');
    console.log('   💡 Possible causes:');
    console.log('      1. Creator is auto-counted but not in participants table');
    console.log('      2. RLS policies hiding participants');
    console.log('      3. Participants stored in different table');
    console.log('      4. Data inconsistency');
  }
}

listGameParticipants().catch(console.error);
