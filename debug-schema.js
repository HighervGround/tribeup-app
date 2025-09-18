const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://alegufnopsminqcokelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
);

async function getSchemaInfo() {
  console.log('🔍 Getting schema information...');
  
  try {
    // Get a sample game to see structure
    const { data: sampleGames, error: sampleError } = await supabase
      .from('games')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error getting games:', sampleError.message);
    } else {
      console.log('✅ Sample game structure:');
      if (sampleGames && sampleGames.length > 0) {
        console.log('Columns:', Object.keys(sampleGames[0]));
        console.log('Sample data:', JSON.stringify(sampleGames[0], null, 2));
      } else {
        console.log('No games found');
      }
    }
    
    // Check users table
    const { data: sampleUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError.message);
    } else {
      console.log('✅ Users table check:');
      if (sampleUsers && sampleUsers.length > 0) {
        console.log('User columns:', Object.keys(sampleUsers[0]));
        console.log('Sample user:', JSON.stringify(sampleUsers[0], null, 2));
      } else {
        console.log('No users found in database');
      }
    }
    
    // Test the problematic query
    console.log('🔍 Testing the actual query that might be failing...');
    const { data: gamesWithCreator, error: joinError } = await supabase
      .from('games')
      .select(`
        *,
        creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
      `)
      .limit(2);
    
    if (joinError) {
      console.error('❌ Join query failed:', joinError.message);
      console.error('Full error:', joinError);
    } else {
      console.log('✅ Join query worked! Found games:', gamesWithCreator?.length || 0);
      if (gamesWithCreator && gamesWithCreator.length > 0) {
        console.log('Sample game with creator:', JSON.stringify(gamesWithCreator[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

getSchemaInfo();
