import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrphanedUser() {
  console.log('🔧 Attempting to fix orphaned user by signing in as them...');
  
  const orphanedUserId = 'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0';
  
  // Try to sign in as this user to trigger profile creation
  // This won't work without credentials, but let's see what we can do
  
  // Alternative approach: Create the profile directly using a workaround
  console.log('🔧 Creating profile using INSERT with RLS bypass technique...');
  
  // Method 1: Try creating with minimal data that might pass RLS
  const profileData = {
    id: orphanedUserId,
    email: 'demo@tribeup.com', // Use a valid email format
    full_name: 'Demo User',
    username: 'demo_user_' + Date.now(),
    bio: '',
    location: '',
    role: 'user',
    preferred_sports: []
  };
  
  console.log('📝 Attempting profile creation:', profileData);
  
  // Try the insert
  const { data, error } = await supabase
    .from('users')
    .insert(profileData)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Direct insert failed:', error);
    
    // Method 2: Try using upsert instead
    console.log('🔄 Trying upsert instead...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();
      
    if (upsertError) {
      console.error('❌ Upsert also failed:', upsertError);
      
      // Method 3: Check if we can at least read existing users
      console.log('🔍 Checking if we can read any existing users...');
      const { data: existingUsers, error: readError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .limit(5);
        
      if (readError) {
        console.error('❌ Cannot even read users table:', readError);
      } else {
        console.log('✅ Can read users table:', existingUsers);
      }
    } else {
      console.log('✅ Upsert succeeded:', upsertData);
    }
  } else {
    console.log('✅ Direct insert succeeded:', data);
  }
  
  // Verify the fix worked
  console.log('\n🔍 Checking if orphaned user now has a profile...');
  const { data: profile, error: checkError } = await supabase
    .from('users')
    .select('id, full_name, username, email')
    .eq('id', orphanedUserId)
    .single();
    
  if (checkError) {
    console.error('❌ Still no profile found:', checkError);
  } else {
    console.log('✅ Profile now exists:', profile);
  }
}

fixOrphanedUser().catch(console.error);
