import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugRefreshQueries() {
  console.log('🔍 Debugging queries after refresh...')
  
  try {
    // Test the exact queries the app makes on refresh
    console.log('\n1️⃣ Testing basic games query (what useGames does)...')
    const startTime = performance.now()
    
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(`
        id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id,
        game_participants!left(user_id)
      `)
      .order('date', { ascending: true })
    
    const duration = performance.now() - startTime
    
    if (gamesError) {
      console.log('❌ Games query FAILED:', gamesError)
      console.log('Error details:', {
        code: gamesError.code,
        message: gamesError.message,
        details: gamesError.details,
        hint: gamesError.hint
      })
    } else {
      console.log(`✅ Games query SUCCESS: ${games?.length || 0} games in ${duration.toFixed(2)}ms`)
    }
    
    // Test the join with users table (this might be failing)
    console.log('\n2️⃣ Testing games with creator join...')
    const startTime2 = performance.now()
    
    const { data: gamesWithCreator, error: creatorError } = await supabase
      .from('games')
      .select(`
        *,
        creator:users!games_creator_id_fkey(id, full_name, username, email, avatar_url)
      `)
      .limit(5)
    
    const duration2 = performance.now() - startTime2
    
    if (creatorError) {
      console.log('❌ Creator join FAILED:', creatorError)
      console.log('Error details:', {
        code: creatorError.code,
        message: creatorError.message,
        details: creatorError.details,
        hint: creatorError.hint
      })
    } else {
      console.log(`✅ Creator join SUCCESS: ${gamesWithCreator?.length || 0} games in ${duration2.toFixed(2)}ms`)
      gamesWithCreator?.forEach(game => {
        console.log(`  - ${game.title}: creator = ${game.creator ? 'FOUND' : 'NULL'}`)
      })
    }
    
    // Test participants query (this is what was failing before)
    console.log('\n3️⃣ Testing game participants query...')
    if (games && games.length > 0) {
      const testGameId = games[0].id
      const startTime3 = performance.now()
      
      const { data: participants, error: partError } = await supabase
        .from('game_participants')
        .select(`
          user_id,
          users!inner(id, full_name, username, email, avatar_url)
        `)
        .eq('game_id', testGameId)
      
      const duration3 = performance.now() - startTime3
      
      if (partError) {
        console.log('❌ Participants query FAILED:', partError)
        console.log('Error details:', {
          code: partError.code,
          message: partError.message,
          details: partError.details,
          hint: partError.hint
        })
      } else {
        console.log(`✅ Participants query SUCCESS: ${participants?.length || 0} participants in ${duration3.toFixed(2)}ms`)
      }
    }
    
    // Test RLS policies by checking different access levels
    console.log('\n4️⃣ Testing RLS policy access...')
    
    // Test anonymous access to games
    const { data: anonGames, error: anonError } = await supabase
      .from('games')
      .select('id, title')
      .limit(1)
    
    if (anonError) {
      console.log('❌ Anonymous games access FAILED:', anonError.message)
    } else {
      console.log(`✅ Anonymous games access SUCCESS: ${anonGames?.length || 0} games`)
    }
    
    // Test users table access (this might be blocked by RLS)
    const { data: usersTest, error: usersTestError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (usersTestError) {
      console.log('❌ Users table access FAILED:', usersTestError.message)
      console.log('This might be the root cause - RLS blocking user access')
    } else {
      console.log(`✅ Users table access SUCCESS: ${usersTest?.length || 0} users`)
    }
    
    // Test auth status
    console.log('\n5️⃣ Testing auth status...')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session check FAILED:', sessionError.message)
    } else {
      console.log('Auth status:', session?.session ? 'AUTHENTICATED' : 'ANONYMOUS')
      if (session?.session) {
        console.log('User ID:', session.session.user.id)
      }
    }
    
    // Test what happens with a slow query (simulate refresh scenario)
    console.log('\n6️⃣ Testing slow query scenario...')
    const slowStart = performance.now()
    
    // This simulates the complex query that might timeout on refresh
    const { data: complexQuery, error: complexError } = await supabase
      .from('games')
      .select(`
        *,
        creator:users!games_creator_id_fkey(id, full_name, username, email, avatar_url),
        game_participants!left(
          user_id,
          users!inner(id, full_name, username, email, avatar_url)
        )
      `)
      .order('date', { ascending: true })
    
    const slowDuration = performance.now() - slowStart
    
    if (complexError) {
      console.log('❌ Complex query FAILED:', complexError.message)
      console.log(`Duration before failure: ${slowDuration.toFixed(2)}ms`)
      
      if (slowDuration > 5000) {
        console.log('🐌 Query took >5s - this could cause timeout issues on refresh')
      }
    } else {
      console.log(`✅ Complex query SUCCESS in ${slowDuration.toFixed(2)}ms`)
      
      if (slowDuration > 2000) {
        console.log('⚠️ Query took >2s - might cause stale cache issues')
      }
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error)
  }
}

debugRefreshQueries()
