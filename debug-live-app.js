import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLiveApp() {
  console.log('🔍 Debugging live app state...')
  
  try {
    // Check current database state
    console.log('\n1️⃣ Current database state...')
    
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(5)
    
    if (gamesError) {
      console.log('❌ Games error:', gamesError.message)
    } else {
      console.log(`✅ Games in database: ${games?.length || 0}`)
      games?.forEach(game => {
        console.log(`  - ${game.id}: ${game.title} (creator: ${game.creator_id})`)
      })
    }
    
    // Check game participants
    const { data: participants, error: partError } = await supabase
      .from('game_participants')
      .select('*')
      .limit(10)
    
    if (partError) {
      console.log('❌ Participants error:', partError.message)
    } else {
      console.log(`✅ Game participants: ${participants?.length || 0}`)
      participants?.forEach(p => {
        console.log(`  - Game ${p.game_id}: User ${p.user_id}`)
      })
    }
    
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10)
    
    if (usersError) {
      console.log('❌ Users error:', usersError.message)
    } else {
      console.log(`✅ Users in database: ${users?.length || 0}`)
      users?.forEach(user => {
        console.log(`  - ${user.id}: ${user.full_name || user.username || 'no name'}`)
      })
    }
    
    // Test the exact query the app uses
    console.log('\n2️⃣ Testing app query...')
    const { data: appQuery, error: appError } = await supabase
      .from('games')
      .select(`
        id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id,
        game_participants!left(user_id)
      `)
      .order('date', { ascending: true })
      .limit(5)
    
    if (appError) {
      console.log('❌ App query error:', appError.message)
    } else {
      console.log(`✅ App query results: ${appQuery?.length || 0}`)
      appQuery?.forEach(game => {
        console.log(`  - ${game.title}: ${game.game_participants?.length || 0} participants`)
        game.game_participants?.forEach(p => {
          console.log(`    → User: ${p.user_id}`)
        })
      })
    }
    
    // Check what the transform function would produce
    console.log('\n3️⃣ Testing transform logic...')
    if (appQuery && appQuery.length > 0) {
      const testGame = appQuery[0]
      const createdBy = testGame.creator?.full_name || testGame.creator?.username || `Unknown User (${testGame.creator_id?.slice(0, 8) || 'No ID'})`
      console.log(`Game "${testGame.title}" would show creator as: "${createdBy}"`)
      
      // Test initials
      const getInitials = (name) => {
        if (!name) return '?';
        if (name.startsWith('Unknown User')) return '??';
        return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
      };
      
      const initials = getInitials(createdBy)
      console.log(`Avatar initials would be: "${initials}"`)
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error)
  }
}

debugLiveApp()
