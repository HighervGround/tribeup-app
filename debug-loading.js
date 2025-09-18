const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://alegufnopsminqcokelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
);

async function debugLoading() {
  console.log('🔍 Debug: Testing what the app should be loading...');
  
  try {
    // Test the exact query the app uses for non-authenticated users
    console.log('\n1. Testing games query (non-authenticated path)...');
    const { data: gamesData, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
      `)
      // Filter out games that are fully in the past (date + time has passed)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('❌ Games query failed:', error.message);
      console.error('Full error:', error);
    } else {
      console.log(`✅ Games query successful! Found ${gamesData?.length || 0} games`);
      
      if (gamesData && gamesData.length > 0) {
        console.log('\nGames that should appear in app:');
        gamesData.forEach((game, index) => {
          console.log(`${index + 1}. "${game.title}" - ${game.sport} on ${game.date} at ${game.time}`);
          console.log(`   Creator: ${game.creator?.full_name || 'No creator data'}`);
        });
      } else {
        console.log('❌ No games found that match current date filter');
        
        // Check what games exist without date filter
        console.log('\n2. Checking all games (no date filter)...');
        const { data: allGames } = await supabase
          .from('games')
          .select('id, title, date, time')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (allGames && allGames.length > 0) {
          console.log('All games in database:');
          allGames.forEach((game, index) => {
            const gameDate = new Date(game.date);
            const today = new Date();
            const isToday = gameDate.toDateString() === today.toDateString();
            const isFuture = gameDate > today;
            console.log(`${index + 1}. "${game.title}" - ${game.date} ${isToday ? '(TODAY)' : isFuture ? '(FUTURE)' : '(PAST)'}`);
          });
        }
      }
    }
    
    // Test auth status
    console.log('\n3. Testing auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ User is authenticated:', user.email);
    } else {
      console.log('ℹ️ User is anonymous (expected)');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLoading();
