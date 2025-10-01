// Test connection without aggressive timeouts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWithoutTimeouts() {
  console.log('🧪 Testing connection WITHOUT aggressive timeouts...')
  
  try {
    // Test 1: Simple query - let it complete naturally
    console.log('\n1️⃣ Simple query (no timeout)...')
    const startTime = performance.now()
    
    const { data, error } = await supabase
      .from('games')
      .select('count', { count: 'exact', head: true })
    
    const duration = performance.now() - startTime
    
    if (error) {
      console.log('❌ Simple query FAILED:', error.message)
      return
    }
    
    console.log(`✅ Simple query SUCCESS: ${duration.toFixed(2)}ms`)
    
    // Test 2: Complex query that might take longer
    console.log('\n2️⃣ Complex query (no timeout)...')
    const complexStart = performance.now()
    
    const { data: complexData, error: complexError } = await supabase
      .from('games')
      .select(`
        id, title, sport, date, time, location, cost, max_players, current_players, description, image_url, creator_id,
        game_participants!left(user_id)
      `)
      .order('date', { ascending: true })
    
    const complexDuration = performance.now() - complexStart
    
    if (complexError) {
      console.log('❌ Complex query FAILED:', complexError.message)
      console.log('Duration before failure:', complexDuration.toFixed(2) + 'ms')
    } else {
      console.log(`✅ Complex query SUCCESS: ${complexDuration.toFixed(2)}ms`)
      console.log(`Found ${complexData?.length || 0} games`)
    }
    
    // Test 3: Multiple rapid queries (simulate refresh)
    console.log('\n3️⃣ Rapid queries (refresh simulation)...')
    const rapidStart = performance.now()
    
    const promises = Array.from({ length: 3 }, () =>
      supabase
        .from('games')
        .select('id, title')
        .limit(5)
    )
    
    const results = await Promise.allSettled(promises)
    const rapidDuration = performance.now() - rapidStart
    
    const successes = results.filter(r => r.status === 'fulfilled').length
    const failures = results.filter(r => r.status === 'rejected').length
    
    console.log(`Rapid queries: ${successes}/${results.length} succeeded in ${rapidDuration.toFixed(2)}ms`)
    
    if (failures > 0) {
      console.log('❌ Some rapid queries failed:')
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.log(`  Query ${index + 1}:`, result.reason.message)
        }
      })
    }
    
    console.log('\n🎯 CONCLUSION:')
    if (successes === results.length) {
      console.log('✅ ALL QUERIES SUCCEEDED WITHOUT TIMEOUTS!')
      console.log('✅ The connection issue was caused by aggressive timeouts')
      console.log('✅ Refresh should now work properly')
    } else {
      console.log('⚠️ Some queries still failing - may be a different issue')
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testWithoutTimeouts()
