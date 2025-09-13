// Debug script to test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'SET' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test basic connection
supabase.from('games').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Database error:', error);
  } else {
    console.log('✅ Database connected successfully!');
    console.log('Games count:', data);
  }
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
});

// Test join_game RPC function
supabase.rpc('join_game', { game_uuid: 'test-uuid' }).then(({ data, error }) => {
  if (error) {
    console.log('RPC join_game error (expected):', error.message);
  } else {
    console.log('RPC join_game success:', data);
  }
}).catch(err => {
  console.error('RPC join_game failed:', err.message);
});
