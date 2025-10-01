// Debug the REAL issue: Connection errors after refresh
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE7NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugConnectionErrors() {
  console.log('🔍 DEBUGGING CONNECTION ERRORS AFTER REFRESH...')
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic Supabase connection...')
    const startTime = performance.now()
    
    const { data, error } = await supabase
      .from('games')
      .select('count', { count: 'exact', head: true })
    
    const duration = performance.now() - startTime
    
    if (error) {
      console.log('❌ BASIC CONNECTION FAILED:', error)
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return
    }
    
    console.log(`✅ Basic connection OK (${duration.toFixed(2)}ms)`)
    
    // Test 2: The exact query that's failing on refresh
    console.log('\n2️⃣ Testing the EXACT query that fails on refresh...')
    const queryStart = performance.now()
    
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select(`
        id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id,
        game_participants!left(user_id)
      `)
      .order('date', { ascending: true })
    
    const queryDuration = performance.now() - queryStart
    
    if (gamesError) {
      console.log('❌ GAMES QUERY FAILED:', gamesError)
      console.log('Query duration before failure:', queryDuration.toFixed(2) + 'ms')
      console.log('Error details:', {
        code: gamesError.code,
        message: gamesError.message,
        details: gamesError.details,
        hint: gamesError.hint
      })
      
      // Check if it's a timeout
      if (queryDuration > 10000) {
        console.log('🐌 TIMEOUT DETECTED - Query took >10s')
      }
      
      // Check if it's a connection error
      if (gamesError.message?.includes('connection') || 
          gamesError.message?.includes('network') ||
          gamesError.message?.includes('timeout')) {
        console.log('🌐 CONNECTION ERROR DETECTED')
      }
      
      return
    }
    
    console.log(`✅ Games query OK (${queryDuration.toFixed(2)}ms)`)
    console.log(`Found ${gamesData?.length || 0} games`)
    
    // Test 3: Rapid successive queries (simulate refresh behavior)
    console.log('\n3️⃣ Testing rapid successive queries (refresh simulation)...')
    
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        supabase
          .from('games')
          .select('id, title')
          .limit(10)
      )
    }
    
    const rapidStart = performance.now()
    const results = await Promise.allSettled(promises)
    const rapidDuration = performance.now() - rapidStart
    
    console.log(`Rapid queries completed in ${rapidDuration.toFixed(2)}ms`)
    
    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      console.log(`❌ ${failures.length}/5 rapid queries FAILED`)
      failures.forEach((failure, index) => {
        console.log(`  Query ${index + 1}:`, failure.reason)
      })
    } else {
      console.log('✅ All rapid queries succeeded')
    }
    
    // Test 4: Connection with different configurations
    console.log('\n4️⃣ Testing connection with different configurations...')
    
    // Test with realtime disabled
    const supabaseNoRealtime = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    })
    
    const { data: noRealtimeData, error: noRealtimeError } = await supabaseNoRealtime
      .from('games')
      .select('id')
      .limit(1)
    
    if (noRealtimeError) {
      console.log('❌ No-realtime connection failed:', noRealtimeError.message)
    } else {
      console.log('✅ No-realtime connection OK')
    }
    
    // Test 5: Check auth state
    console.log('\n5️⃣ Checking auth state...')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session check failed:', sessionError.message)
    } else {
      console.log('Auth status:', session?.session ? 'AUTHENTICATED' : 'ANONYMOUS')
    }
    
    // Test 6: Network diagnostics
    console.log('\n6️⃣ Network diagnostics...')
    
    try {
      const networkStart = performance.now()
      const response = await fetch('https://alegufnopsminqcokelr.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey
        }
      })
      const networkDuration = performance.now() - networkStart
      
      console.log(`Network latency: ${networkDuration.toFixed(2)}ms`)
      console.log(`Response status: ${response.status}`)
      
      if (networkDuration > 5000) {
        console.log('🐌 HIGH LATENCY DETECTED - Network is slow')
      }
      
    } catch (networkError) {
      console.log('❌ Network test failed:', networkError.message)
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

debugConnectionErrors()
