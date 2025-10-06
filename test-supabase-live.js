// Test Supabase connection on live deployment
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://alegufnopsminqcokelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...')
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ Basic connection failed:', error.message)
      console.log('Error details:', error)
      return
    }
    
    console.log('✅ Basic connection works')
    
    // Test 2: Try to create a user profile
    console.log('2. Testing user profile creation...')
    const testUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser'
    }
    
    const { data: createData, error: createError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
    
    if (createError) {
      console.log('❌ Profile creation failed:', createError.message)
      console.log('Error details:', createError)
      
      // Check if it's RLS policy issue
      if (createError.message.includes('policy')) {
        console.log('🚨 RLS POLICY ISSUE - This is likely the problem!')
      }
    } else {
      console.log('✅ Profile creation works')
      
      // Clean up test user
      await supabase.from('users').delete().eq('id', testUser.id)
    }
    
  } catch (error) {
    console.log('💥 Connection test failed:', error.message)
  }
}

testConnection()
