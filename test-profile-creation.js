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

async function testProfileCreation() {
  console.log('🔍 Testing profile creation...\n');

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
      console.log('   You need to sign in first to test profile creation');
      return;
    }

    console.log('✅ Connected to Supabase');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}\n`);

    // 2. Check if user profile already exists
    console.log('2. Checking existing profile...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Profile check error:', profileError);
      return;
    }

    if (existingProfile) {
      console.log('✅ User profile already exists:');
      console.log('   Name:', existingProfile.full_name);
      console.log('   Username:', existingProfile.username);
      console.log('   Bio:', existingProfile.bio);
      return;
    }

    console.log('⚠️  No user profile found - this is expected for new users\n');

    // 3. Test profile creation
    console.log('3. Testing profile creation...');
    const testProfile = {
      id: session.user.id,
      email: session.user.email,
      full_name: 'Test User',
      username: 'test_user',
      bio: 'Test bio',
      location: 'Test City',
      sports_preferences: ['Basketball', 'Soccer'],
      stats: {}
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('users')
      .insert(testProfile)
      .select()
      .single();

    if (createError) {
      console.error('❌ Profile creation failed:', createError);
      return;
    }

    console.log('✅ Profile created successfully:');
    console.log('   Name:', createdProfile.full_name);
    console.log('   Username:', createdProfile.username);
    console.log('   Bio:', createdProfile.bio);

    // 4. Clean up - delete the test profile
    console.log('\n4. Cleaning up test profile...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', session.user.id);

    if (deleteError) {
      console.error('❌ Profile cleanup failed:', deleteError);
      return;
    }

    console.log('✅ Test profile cleaned up successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfileCreation();



