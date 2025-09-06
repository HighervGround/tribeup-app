import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserData() {
  console.log('🔍 Testing user data...\n');

  try {
    // 1. Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }

    if (!session?.user) {
      console.log('⚠️  No active session found');
      console.log('   You need to sign in first to test user data');
      return;
    }

    console.log('✅ Connected to Supabase');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}\n`);

    // 2. Check user profile in database
    console.log('2. Checking user profile...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }

    if (!userProfile) {
      console.log('⚠️  No user profile found in database');
      console.log('   This means the profile creation failed');
      return;
    }

    console.log('✅ User profile found:');
    console.log('   Raw database data:', JSON.stringify(userProfile, null, 2));
    console.log('');

    // 3. Test the transformation function
    console.log('3. Testing data transformation...');
    
    // Simulate the transformUserFromDB function
    const transformedUser = {
      id: userProfile.id,
      name: userProfile.full_name || userProfile.username || 'Unknown User',
      username: userProfile.username || '',
      email: userProfile.email,
      avatar: userProfile.avatar_url || '',
      bio: userProfile.bio || '',
      location: userProfile.location || '',
      preferences: {
        theme: 'auto',
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        colorBlindFriendly: false,
        notifications: {
          push: true,
          email: false,
          gameReminders: true,
          messages: true,
        },
        privacy: {
          locationSharing: true,
          profileVisibility: 'public',
        },
        sports: userProfile.sports_preferences || [],
      },
    };

    console.log('✅ Transformed user data:');
    console.log('   Name:', transformedUser.name);
    console.log('   Username:', transformedUser.username);
    console.log('   Bio:', transformedUser.bio);
    console.log('   Sports:', transformedUser.preferences.sports);
    console.log('');

    // 4. Check if the profile is complete
    console.log('4. Checking profile completeness...');
    const isComplete = !!(transformedUser.name && transformedUser.username);
    console.log(`   Profile complete: ${isComplete ? '✅ Yes' : '❌ No'}`);
    
    if (!isComplete) {
      console.log('   Missing fields:');
      if (!transformedUser.name) console.log('   - Name');
      if (!transformedUser.username) console.log('   - Username');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserData();
