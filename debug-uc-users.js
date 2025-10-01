import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugUserAccess() {
  console.log('🔍 Debugging UC user issue...')
  
  try {
    // 1. Check users table count and access
    console.log('\n1️⃣ Testing users table access...')
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      
    if (countError) {
      console.log('❌ Count error:', countError.message)
      console.log('Full error:', JSON.stringify(countError, null, 2))
    } else {
      console.log(`✅ Users table count: ${count}`)
    }
    
    // 2. Check if we can access users without RLS
    console.log('\n2️⃣ Testing users table direct access...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, username, email')
      .limit(10)
      
    if (usersError) {
      console.log('❌ Users access error:', usersError.message)
      console.log('Error code:', usersError.code)
    } else {
      console.log(`✅ Users accessible: ${users?.length || 0}`)
      users?.forEach(user => {
        console.log(`  - ${user.id}: ${user.full_name || user.username || user.email || 'no name'}`)
      })
    }
    
    // 3. Check profiles table
    console.log('\n3️⃣ Testing profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
      
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message)
    } else {
      console.log(`✅ Profiles found: ${profiles?.length || 0}`)
      profiles?.forEach(p => {
        console.log(`  - ${p.id}: ${p.full_name || p.username || 'no name'}`)
      })
    }
    
    // 4. Check orphaned game_participants
    console.log('\n4️⃣ Checking orphaned game_participants...')
    const { data: orphanedParticipants, error: orphanError } = await supabase
      .from('game_participants')
      .select(`
        user_id,
        game_id,
        created_at
      `)
      .limit(20)
      
    if (orphanError) {
      console.log('❌ Orphaned check error:', orphanError.message)
    } else {
      console.log(`✅ Game participants found: ${orphanedParticipants?.length || 0}`)
      
      // Group by user_id to see the pattern
      const userCounts = {}
      orphanedParticipants?.forEach(p => {
        userCounts[p.user_id] = (userCounts[p.user_id] || 0) + 1
      })
      
      console.log('User participation counts:')
      Object.entries(userCounts).forEach(([userId, count]) => {
        console.log(`  - ${userId}: ${count} games`)
      })
    }
    
    // 5. Test the actual join that's failing
    console.log('\n5️⃣ Testing the failing join...')
    const { data: joinTest, error: joinError } = await supabase
      .from('game_participants')
      .select(`
        user_id,
        users(id, full_name, username, email)
      `)
      .limit(5)
      
    if (joinError) {
      console.log('❌ Join test error:', joinError.message)
      console.log('Error details:', JSON.stringify(joinError, null, 2))
    } else {
      console.log(`✅ Join test successful: ${joinTest?.length || 0} results`)
      joinTest?.forEach(result => {
        const user = result.users
        console.log(`  - ${result.user_id}: ${user ? (user.full_name || user.username || user.email || 'no name') : 'USER NOT FOUND'}`)
      })
    }
    
    // 6. Check auth status
    console.log('\n6️⃣ Auth status...')
    const { data: session } = await supabase.auth.getSession()
    console.log('Session:', session?.session ? 'Authenticated' : 'Anonymous')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

debugUserAccess()
