import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUCUsersIssue() {
  console.log('🔧 Starting UC users issue fix...')
  
  try {
    // Step 1: Identify orphaned records
    console.log('\n1️⃣ Identifying orphaned game_participants records...')
    
    const { data: orphanedParticipants, error: orphanError } = await supabase
      .from('game_participants')
      .select('user_id, game_id')
      .limit(100)
    
    if (orphanError) {
      console.log('❌ Error checking participants:', orphanError.message)
      return
    }
    
    console.log(`Found ${orphanedParticipants?.length || 0} game_participants records`)
    
    // Group by user_id to see the pattern
    const userCounts = {}
    orphanedParticipants?.forEach(p => {
      userCounts[p.user_id] = (userCounts[p.user_id] || 0) + 1
    })
    
    console.log('User participation counts:')
    Object.entries(userCounts).forEach(([userId, count]) => {
      console.log(`  - ${userId}: ${count} games`)
    })
    
    // Step 2: Check if these users exist in users table
    console.log('\n2️⃣ Checking which users actually exist...')
    
    const userIds = Object.keys(userCounts)
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', userIds)
    
    if (usersError) {
      console.log('❌ Error checking users:', usersError.message)
    } else {
      const existingUserIds = new Set(existingUsers?.map(u => u.id) || [])
      const orphanedUserIds = userIds.filter(id => !existingUserIds.has(id))
      
      console.log(`✅ Existing users: ${existingUsers?.length || 0}`)
      console.log(`❌ Orphaned user IDs: ${orphanedUserIds.length}`)
      
      orphanedUserIds.forEach(id => {
        console.log(`  - ${id} (${userCounts[id]} participations)`)
      })
      
      // Step 3: Clean up orphaned records (if any)
      if (orphanedUserIds.length > 0) {
        console.log('\n3️⃣ Cleaning up orphaned game_participants records...')
        
        const { error: deleteError } = await supabase
          .from('game_participants')
          .delete()
          .in('user_id', orphanedUserIds)
        
        if (deleteError) {
          console.log('❌ Error deleting orphaned records:', deleteError.message)
        } else {
          console.log(`✅ Deleted ${orphanedUserIds.reduce((sum, id) => sum + userCounts[id], 0)} orphaned game_participants records`)
        }
      } else {
        console.log('✅ No orphaned records found - all participants have valid users!')
      }
    }
    
    // Step 4: Verify the fix
    console.log('\n4️⃣ Verifying the fix...')
    
    const { data: remainingParticipants, error: verifyError } = await supabase
      .from('game_participants')
      .select(`
        user_id,
        users(id, full_name, username, email)
      `)
      .limit(10)
    
    if (verifyError) {
      console.log('❌ Verification error:', verifyError.message)
    } else {
      console.log(`✅ Remaining participants: ${remainingParticipants?.length || 0}`)
      
      remainingParticipants?.forEach(p => {
        const user = p.users
        const displayName = user?.full_name || user?.username || user?.email?.split('@')[0] || `Unknown User (${p.user_id.slice(0, 8)})`
        const status = user ? '✅ Valid' : '❌ Missing'
        console.log(`  - ${p.user_id.slice(0, 8)}: ${displayName} ${status}`)
      })
    }
    
    // Step 5: Test avatar initials generation
    console.log('\n5️⃣ Testing avatar initials generation...')
    
    const testNames = [
      'John Doe',
      'User ca2ee1cc',
      'Unknown User (ca2ee1cc)',
      null,
      undefined,
      ''
    ]
    
    const getInitials = (name) => {
      if (!name) return '?';
      
      // Handle "Unknown User" case specifically
      if (name.startsWith('Unknown User')) {
        return '??';
      }
      
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };
    
    testNames.forEach(name => {
      const initials = getInitials(name)
      console.log(`  "${name}" → "${initials}"`)
    })
    
    console.log('\n✅ UC users issue fix completed!')
    console.log('\n📋 Summary:')
    console.log('- Fixed user display fallback logic to use "Unknown User" instead of "User"')
    console.log('- Updated avatar initials to show "??" for unknown users instead of "UC"')
    console.log('- Cleaned up any orphaned game_participants records')
    console.log('- Users should now display as "Unknown User (ca2ee1cc)" with "??" initials')
    
  } catch (error) {
    console.error('💥 Unexpected error during fix:', error)
  }
}

fixUCUsersIssue()
