import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIzNTAyMiwiZXhwIjoyMDcxODExMDIyfQ.Vr9qhHSvOqIEQdGNZJYGTKKxKdU6Yt2Wy8JQhJlNhYg'; // Service role key

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMissingProfile() {
  console.log('🔧 Creating missing profile for orphaned user...');
  
  const userId = 'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0';
  
  // Create profile using service role (bypasses RLS)
  const profileData = {
    id: userId,
    email: 'demo@tribeup.com',
    full_name: 'Demo User',
    username: 'demo_user',
    bio: 'Demo account for sample games',
    location: 'Gainesville, FL',
    role: 'user',
    preferred_sports: ['basketball', 'soccer', 'pickleball', 'baseball']
  };
  
  console.log('📝 Creating profile with service role:', profileData);
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(profileData)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Profile creation failed:', error);
  } else {
    console.log('✅ Profile created successfully:', data);
  }
  
  // Verify with regular client
  console.log('\n🔍 Verifying profile is visible to regular client...');
  const regularClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ');
  
  const { data: profile, error: fetchError } = await regularClient
    .from('users')
    .select('id, full_name, username, email')
    .eq('id', userId)
    .single();
    
  if (fetchError) {
    console.error('❌ Could not fetch profile with regular client:', fetchError);
  } else {
    console.log('✅ Profile visible to regular client:', profile);
  }
}

createMissingProfile().catch(console.error);
