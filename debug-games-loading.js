// Debug script to identify games loading issues
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://alegufnopsminqcokelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
)

async function debugGamesLoading() {
  console.log('🔍 Starting games loading debug...')
  
  try {
    // Test 1: Check auth status
    console.log('\n1. Testing auth status...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Auth status:', user ? `Authenticated as ${user.id}` : 'Anonymous')
    }
    
    // Test 2: Simple games query (no joins)
    console.log('\n2. Testing simple games query...')
    const { data: simpleGames, error: simpleError } = await supabase
      .from('games')
      .select('id, title, sport, date, time')
      .limit(5)
    
    if (simpleError) {
      console.log('❌ Simple query failed:', simpleError.message)
      console.log('Error details:', simpleError)
    } else {
      console.log('✅ Simple query works:', simpleGames?.length || 0, 'games found')
    }
    
    // Test 3: Complex games query (with joins)
    console.log('\n3. Testing complex games query...')
    const { data: complexGames, error: complexError } = await supabase
      .from('games')
      .select(`
        *,
        game_participants(user_id),
        creator:users!games_creator_id_fkey(
          id,
          full_name,
          username,
          email,
          avatar_url
        )
      `)
      .limit(5)
    
    if (complexError) {
      console.log('❌ Complex query failed:', complexError.message)
      console.log('Error details:', complexError)
      
      // Check if it's RLS policy issue
      if (complexError.message.includes('policy')) {
        console.log('🚨 RLS POLICY ISSUE DETECTED!')
        console.log('The complex query is being blocked by Row Level Security policies')
      }
    } else {
      console.log('✅ Complex query works:', complexGames?.length || 0, 'games found')
    }
    
    // Test 4: Check if user profile exists (if authenticated)
    if (user) {
      console.log('\n4. Testing user profile...')
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.log('❌ Profile query failed:', profileError.message)
        console.log('🚨 USER PROFILE MISSING - This could cause RLS issues!')
      } else {
        console.log('✅ User profile exists:', profile.full_name || profile.username || 'No name')
      }
    }
    
    // Test 5: Check network connectivity
    console.log('\n5. Testing network connectivity...')
    const startTime = performance.now()
    const response = await fetch('https://alegufnopsminqcokelr.supabase.co/rest/v1/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    const responseTime = performance.now() - startTime
    
    console.log('✅ Network test:', response.ok ? 'OK' : 'FAILED', `(${responseTime.toFixed(2)}ms)`)
    
    // Test 6: Check localStorage for cached auth
    console.log('\n6. Checking localStorage...')
    const authToken = localStorage.getItem('supabase.auth.token')
    const tribeupAuth = localStorage.getItem('tribeup-auth')
    
    console.log('Auth tokens in localStorage:')
    console.log('- supabase.auth.token:', authToken ? 'EXISTS' : 'MISSING')
    console.log('- tribeup-auth:', tribeupAuth ? 'EXISTS' : 'MISSING')
    
  } catch (error) {
    console.log('💥 Debug script failed:', error.message)
  }
}

debugGamesLoading()
