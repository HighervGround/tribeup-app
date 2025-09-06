// Direct Supabase connection test
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test 1: Basic connection
    console.time('Basic connection test')
    const { data, error } = await supabase.from('games').select('count', { count: 'exact', head: true })
    console.timeEnd('Basic connection test')
    
    if (error) {
      console.error('❌ Connection failed:', error)
      return
    }
    
    console.log('✅ Connection successful. Games count:', data)
    
    // Test 2: Get games query (what the app uses)
    console.time('Get games query')
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(`
        id,title,sport,date,time,location,cost,max_players,current_players,description,image_url,creator_id,
        game_participants!left(user_id)
      `)
      .order('date', { ascending: true })
      .limit(20)
    console.timeEnd('Get games query')
    
    if (gamesError) {
      console.error('❌ Games query failed:', gamesError)
      return
    }
    
    console.log('✅ Games query successful. Found', games?.length, 'games')
    console.log('Games:', games)
    
    // Test 3: Auth session check
    console.time('Session check')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    console.timeEnd('Session check')
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError)
    } else {
      console.log('✅ Session check:', session?.session ? 'Authenticated' : 'Anonymous')
    }
    
    // Test 4: Realtime connection
    console.log('🔄 Testing realtime connection...')
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload) => {
        console.log('📡 Realtime event received:', payload)
      })
      .subscribe((status) => {
        console.log('📡 Realtime status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connection successful')
          setTimeout(() => {
            channel.unsubscribe()
            console.log('🔌 Realtime connection closed')
          }, 2000)
        }
      })
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testConnection()
