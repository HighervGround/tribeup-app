const { createClient } = require('@supabase/supabase-js');

// Use the correct credentials from your NEXT_PUBLIC_ variables
const supabase = createClient(
  'https://alegufnopsminqcokelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
);

async function testRealDatabase() {
  console.log('🔍 Testing connection to your actual database...');
  
  try {
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('games')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Get all games
    const { data: allGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(10);
    
    if (gamesError) {
      console.error('❌ Games query failed:', gamesError.message);
    } else {
      console.log(`✅ Found ${allGames?.length || 0} games in database`);
      if (allGames && allGames.length > 0) {
        console.log('Sample games:');
        allGames.forEach((game, index) => {
          console.log(`${index + 1}. "${game.title}" - ${game.sport} on ${game.date} at ${game.time}`);
        });
      }
    }
    
    // Check users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users query failed:', usersError.message);
    } else {
      console.log(`✅ Found ${allUsers?.length || 0} users in database`);
      if (allUsers && allUsers.length > 0) {
        console.log('Sample users:');
        allUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.full_name || user.username || user.email} (${user.id})`);
        });
      }
    }
    
    // Test the exact query your app uses
    console.log('\n🔍 Testing the exact query your app uses...');
    const { data: appQuery, error: appError } = await supabase
      .from('games')
      .select(`
        *,
        creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (appError) {
      console.error('❌ App query failed:', appError.message);
    } else {
      console.log(`✅ App query successful! Found ${appQuery?.length || 0} games`);
      if (appQuery && appQuery.length > 0) {
        console.log('Sample game with creator info:');
        console.log(JSON.stringify(appQuery[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealDatabase();
