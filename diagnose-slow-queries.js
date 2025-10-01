import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://alegufnopsminqcokelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
)

async function diagnoseSlowQueries() {
  console.log('🔍 DIAGNOSING SLOW QUERY ISSUE...')
  
  try {
    // Test 1: Basic connection speed
    console.log('\n1️⃣ Basic connection test...')
    const start1 = performance.now()
    const { data: basic, error: basicError } = await supabase
      .from('games')
      .select('id')
      .limit(1)
    const duration1 = performance.now() - start1
    
    if (basicError) {
      console.log('❌ BASIC CONNECTION FAILED:', basicError.message)
      return
    }
    console.log(`Basic query: ${duration1.toFixed(2)}ms`)
    
    // Test 2: RLS policy check
    console.log('\n2️⃣ RLS policy test...')
    const start2 = performance.now()
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    const duration2 = performance.now() - start2
    
    if (usersError) {
      console.log('❌ RLS BLOCKING:', usersError.message)
      console.log('🚨 RLS POLICIES ARE THE PROBLEM!')
    } else {
      console.log(`Users query: ${duration2.toFixed(2)}ms`)
    }
    
    // Test 3: The problematic join
    console.log('\n3️⃣ JOIN query test...')
    const start3 = performance.now()
    const { data: join, error: joinError } = await supabase
      .from('games')
      .select('id, title, game_participants!left(user_id)')
      .limit(3)
    const duration3 = performance.now() - start3
    
    if (joinError) {
      console.log('❌ JOIN FAILED:', joinError.message)
    } else {
      console.log(`Join query: ${duration3.toFixed(2)}ms`)
    }
    
    console.log('\n🎯 DIAGNOSIS:')
    if (duration1 > 2000) {
      console.log('🚨 BASIC QUERIES ARE SLOW - Database/network issue')
    }
    if (usersError) {
      console.log('🚨 RLS POLICIES ARE BROKEN - This is the root cause!')
    }
    if (duration3 > 5000) {
      console.log('🚨 JOIN QUERIES ARE SLOW - RLS or missing indexes')
    }
    
    if (duration1 < 500 && !usersError && duration3 < 1000) {
      console.log('✅ All queries are fast - issue might be elsewhere')
    }
    
  } catch (error) {
    console.error('💥 Diagnosis failed:', error.message)
  }
}

diagnoseSlowQueries()
