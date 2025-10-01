// Debug what's ACTUALLY happening in the live app right now
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLiveIssue() {
  console.log('🚨 DEBUGGING LIVE ISSUE - What is ACTUALLY happening?')
  
  try {
    // 1. Check if new orphaned records were created
    console.log('\n1️⃣ Checking for NEW orphaned records...')
    
    const { data: participants, error: partError } = await supabase
      .from('game_participants')
      .select('user_id, game_id')
    
    if (partError) {
      console.log('❌ Participants check failed:', partError.message)
    } else {
      console.log(`Found ${participants?.length || 0} game_participants records`)
      
      if (participants && participants.length > 0) {
        console.log('🚨 NEW ORPHANED RECORDS DETECTED!')
        const userCounts = {}
        participants.forEach(p => {
          userCounts[p.user_id] = (userCounts[p.user_id] || 0) + 1
        })
        
        Object.entries(userCounts).forEach(([userId, count]) => {
          console.log(`  - ${userId}: ${count} participations`)
        })
      }
    }
    
    // 2. Check what the app query is ACTUALLY returning
    console.log('\n2️⃣ Testing EXACT app query...')
    
    const { data: appData, error: appError } = await supabase
      .from('games')
      .select(`
        id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id,
        game_participants!left(user_id)
      `)
      .order('date', { ascending: true })
      .limit(3)
    
    if (appError) {
      console.log('❌ App query FAILED:', appError.message)
    } else {
      console.log(`✅ App query returned ${appData?.length || 0} games`)
      
      appData?.forEach(game => {
        console.log(`\nGame: "${game.title}"`)
        console.log(`  Creator ID: ${game.creator_id}`)
        console.log(`  Participants: ${game.game_participants?.length || 0}`)
        
        // Show what the transform would produce
        const createdBy = `Unknown User (${game.creator_id?.slice(0, 8) || 'No ID'})`
        console.log(`  Would display as: "${createdBy}"`)
        
        // Test initials
        const getInitials = (name) => {
          if (!name) return '?';
          if (name.startsWith('Unknown User')) return '??';
          return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
        };
        
        console.log(`  Avatar initials: "${getInitials(createdBy)}"`)
        
        // Check participants
        if (game.game_participants && game.game_participants.length > 0) {
          console.log('  🚨 HAS PARTICIPANTS - checking if users exist...')
          game.game_participants.forEach(p => {
            console.log(`    - Participant: ${p.user_id}`)
          })
        }
      })
    }
    
    // 3. Check if the dev server is using cached code
    console.log('\n3️⃣ Checking if code changes took effect...')
    
    // Test the simple query that getGames() should be using
    const { data: simpleGames, error: simpleError } = await supabase
      .from('games')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(3)
    
    if (simpleError) {
      console.log('❌ Simple games query failed:', simpleError.message)
    } else {
      console.log(`✅ Simple games query: ${simpleGames?.length || 0} games`)
      
      // This is what the FIXED getGames() should return
      const transformedGames = simpleGames?.map(game => ({
        id: game.id,
        title: game.title,
        createdBy: `Unknown User (${game.creator_id?.slice(0, 8) || 'No ID'})`,
        creatorData: {
          name: `Unknown User (${game.creator_id?.slice(0, 8) || 'No ID'})`
        }
      }))
      
      console.log('\n🔧 What FIXED getGames() should return:')
      transformedGames?.forEach(game => {
        console.log(`  - "${game.title}": "${game.createdBy}"`)
      })
    }
    
    // 4. Check if there are any errors in the browser
    console.log('\n4️⃣ Potential browser issues to check:')
    console.log('- Open browser DevTools Console')
    console.log('- Look for React Query errors')
    console.log('- Check Network tab for failed requests')
    console.log('- Clear browser cache completely')
    console.log('- Hard refresh (Cmd+Shift+R)')
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

debugLiveIssue()
