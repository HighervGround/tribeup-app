// Test the fixed SupabaseService.getGames() method
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simulate the fixed getGames method
async function testFixedGetGames() {
  console.log('🧪 Testing fixed getGames method...')
  
  try {
    const startTime = performance.now()
    
    const { data: gamesData, error } = await supabase
      .from('games')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(50)
    
    if (error) {
      console.log('❌ Query failed:', error.message)
      return
    }
    
    // Transform to the format the UI expects (with proper display names)
    const games = (gamesData || []).map((game) => ({
      id: game.id,
      title: game.title,
      sport: game.sport,
      date: game.date,
      time: game.time,
      location: game.location,
      latitude: game.latitude,
      longitude: game.longitude,
      cost: game.cost,
      maxPlayers: game.max_players,
      currentPlayers: game.current_players,
      description: game.description,
      imageUrl: game.image_url || '',
      sportColor: '#6B7280',
      isJoined: false,
      createdBy: `Unknown User (${game.creator_id?.slice(0, 8) || 'No ID'})`, // Fixed!
      creatorId: game.creator_id,
      creatorData: {
        id: game.creator_id,
        name: `Unknown User (${game.creator_id?.slice(0, 8) || 'No ID'})`, // Fixed!
        avatar: ''
      },
      createdAt: game.created_at,
    }))
    
    const totalTime = performance.now() - startTime
    
    console.log(`✅ Fixed getGames took: ${totalTime.toFixed(2)}ms`)
    console.log(`📦 Returned ${games.length} games`)
    
    // Test what the UI will see
    console.log('\n🎨 UI Display Test:')
    games.slice(0, 3).forEach(game => {
      console.log(`Game: "${game.title}"`)
      console.log(`  Creator: "${game.createdBy}"`)
      console.log(`  Creator Data: "${game.creatorData.name}"`)
      
      // Test avatar initials
      const getInitials = (name) => {
        if (!name) return '?';
        if (name.startsWith('Unknown User')) return '??';
        return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
      };
      
      const initials = getInitials(game.creatorData.name)
      console.log(`  Avatar Initials: "${initials}"`)
      console.log('')
    })
    
    return games
    
  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

testFixedGetGames()
