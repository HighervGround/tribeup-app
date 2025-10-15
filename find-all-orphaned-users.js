import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllOrphanedUsers() {
  console.log('🔍 Finding ALL orphaned users in the system...\n');
  
  // Get all unique user IDs referenced in games (creators)
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('creator_id, title');
    
  if (gamesError) {
    console.error('❌ Error fetching games:', gamesError);
    return;
  }
  
  // Get all unique user IDs referenced in game_participants
  const { data: participants, error: participantsError } = await supabase
    .from('game_participants')
    .select('user_id');
    
  if (participantsError) {
    console.error('❌ Error fetching participants:', participantsError);
    return;
  }
  
  // Collect all referenced user IDs
  const gameCreatorIds = games.map(g => g.creator_id).filter(Boolean);
  const participantIds = participants.map(p => p.user_id).filter(Boolean);
  const allReferencedIds = [...new Set([...gameCreatorIds, ...participantIds])];
  
  console.log(`📊 Found ${allReferencedIds.length} unique user IDs referenced in database:`);
  allReferencedIds.forEach(id => {
    console.log(`  - ${id.slice(0, 8)}...`);
  });
  
  // Check which ones exist in users table
  const { data: existingUsers, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, username, email');
    
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }
  
  console.log(`\n👥 Found ${existingUsers.length} users in users table:`);
  existingUsers.forEach(user => {
    console.log(`  - ${user.id.slice(0, 8)}: ${user.full_name || user.username || user.email}`);
  });
  
  // Find orphaned IDs
  const existingUserIds = existingUsers.map(u => u.id);
  const orphanedIds = allReferencedIds.filter(id => !existingUserIds.includes(id));
  
  if (orphanedIds.length === 0) {
    console.log('\n✅ No orphaned users found! All referenced users have profiles.');
    return;
  }
  
  console.log(`\n🚨 Found ${orphanedIds.length} ORPHANED user IDs:`);
  
  for (const orphanedId of orphanedIds) {
    console.log(`\n📋 Orphaned User: ${orphanedId}`);
    console.log(`   Short ID: ${orphanedId.slice(0, 8)}`);
    
    // Count games created by this orphaned user
    const createdGames = games.filter(g => g.creator_id === orphanedId);
    console.log(`   Games Created: ${createdGames.length}`);
    createdGames.forEach(game => {
      console.log(`     • "${game.title}"`);
    });
    
    // Count games participated in by this orphaned user
    const participatedGames = participants.filter(p => p.user_id === orphanedId);
    console.log(`   Games Participated: ${participatedGames.length}`);
    
    console.log(`   Display Name: "Unknown User (${orphanedId.slice(0, 8)})"`);
  }
  
  console.log(`\n🔧 To fix these orphaned users:`);
  console.log(`1. They need to sign in again (will trigger profile creation)`);
  console.log(`2. Or use the "Fix Profile" button when they visit the site`);
  console.log(`3. Or manually create profiles for them in the database`);
}

findAllOrphanedUsers().catch(console.error);
