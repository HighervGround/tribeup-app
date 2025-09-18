const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://alegufnopsminqcokelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
);

async function testRLSFix() {
  console.log('🔍 Testing RLS policy fix...');
  
  try {
    // Test 1: Can we query users without infinite recursion?
    console.log('\n1. Testing basic users query...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users query failed:', usersError.message);
    } else {
      console.log(`✅ Users query successful! Found ${users?.length || 0} users`);
      if (users && users.length > 0) {
        console.log('Sample users:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.full_name || user.username || user.email} (${user.id})`);
        });
      }
    }
    
    // Test 2: Test the games query with creator join (this was failing before)
    console.log('\n2. Testing games with creator join...');
    const { data: gamesWithCreators, error: gamesError } = await supabase
      .from('games')
      .select(`
        id,
        title,
        sport,
        creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
      `)
      .limit(3);
    
    if (gamesError) {
      console.error('❌ Games with creator query failed:', gamesError.message);
    } else {
      console.log(`✅ Games with creator query successful! Found ${gamesWithCreators?.length || 0} games`);
      if (gamesWithCreators && gamesWithCreators.length > 0) {
        console.log('Sample games with creators:');
        gamesWithCreators.forEach((game, index) => {
          const creatorName = game.creator?.full_name || game.creator?.username || 'No creator data';
          console.log(`${index + 1}. "${game.title}" by ${creatorName}`);
        });
      }
    }
    
    // Test 3: Check current auth status
    console.log('\n3. Testing auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ No authenticated user (expected for anon key)');
    } else if (user) {
      console.log('✅ Authenticated user found:', user.email);
    } else {
      console.log('ℹ️ No authenticated user');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRLSFix();
