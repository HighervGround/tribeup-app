import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrphanedUsers() {
  console.log('🔍 Checking for orphaned user references...');
  
  // Get all unique creator IDs from games
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('creator_id');
    
  if (gamesError) {
    console.error('❌ Error fetching games:', gamesError);
    return;
  }
  
  const creatorIds = [...new Set(games.map(g => g.creator_id))];
  console.log(`📊 Found ${creatorIds.length} unique creator IDs:`, creatorIds);
  
  // Check which creators exist in users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, username, email')
    .in('id', creatorIds);
    
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }
  
  console.log(`👥 Found ${users.length} users in users table:`, users);
  
  // Find orphaned creator IDs
  const existingUserIds = users.map(u => u.id);
  const orphanedCreators = creatorIds.filter(id => !existingUserIds.includes(id));
  
  if (orphanedCreators.length > 0) {
    console.log(`🚨 Found ${orphanedCreators.length} orphaned creator IDs:`, orphanedCreators);
    
    // Count games for each orphaned creator
    for (const creatorId of orphanedCreators) {
      const { data: orphanedGames, error } = await supabase
        .from('games')
        .select('id, title')
        .eq('creator_id', creatorId);
        
      if (!error) {
        console.log(`  - ${creatorId.slice(0, 8)}: ${orphanedGames.length} games`);
        orphanedGames.forEach(game => {
          console.log(`    • "${game.title}"`);
        });
      }
    }
  } else {
    console.log('✅ No orphaned creator IDs found');
  }
  
  // Also check game_participants for orphaned user_ids
  const { data: participants, error: participantsError } = await supabase
    .from('game_participants')
    .select('user_id');
    
  if (!participantsError && participants.length > 0) {
    const participantIds = [...new Set(participants.map(p => p.user_id))];
    console.log(`📊 Found ${participantIds.length} unique participant IDs`);
    
    const orphanedParticipants = participantIds.filter(id => !existingUserIds.includes(id));
    if (orphanedParticipants.length > 0) {
      console.log(`🚨 Found ${orphanedParticipants.length} orphaned participant IDs:`, orphanedParticipants);
    }
  }
}

debugOrphanedUsers().catch(console.error);
