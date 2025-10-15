import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileCreation() {
  console.log('🧪 Testing profile creation for orphaned user...');
  
  const userId = 'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0';
  
  // Try to create a profile for the orphaned user
  const profileData = {
    id: userId,
    email: 'test@example.com',
    full_name: 'Test User',
    username: 'test_user',
    bio: 'Test profile for orphaned games',
    location: 'Test Location',
    role: 'user',
    preferred_sports: ['basketball', 'soccer']
  };
  
  console.log('📝 Attempting to create profile:', profileData);
  
  const { data, error } = await supabase
    .from('users')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();
    
  if (error) {
    console.error('❌ Profile creation failed:', error);
    console.log('🔍 Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
  } else {
    console.log('✅ Profile created successfully:', data);
  }
  
  // Verify it was created
  console.log('\n🔍 Verifying profile exists...');
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (fetchError) {
    console.error('❌ Could not fetch created profile:', fetchError);
  } else {
    console.log('✅ Profile verified:', profile);
  }
}

testProfileCreation().catch(console.error);
