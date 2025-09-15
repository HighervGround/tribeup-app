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

async function testOnboarding() {
  console.log('🧪 Testing Onboarding Flow...\n');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }

    if (!session?.user) {
      console.log('⚠️  No active session found');
      console.log('   You need to sign in first to test onboarding');
      return;
    }

    console.log('✅ Connected to database');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}\n`);

    // 2. Test profile creation with correct schema
    console.log('2. Testing profile creation...');
    const testProfile = {
      id: session.user.id,
      email: session.user.email,
      full_name: 'Test User',
      username: 'test_user',
      bio: 'Test bio',
      location: 'Test City',
      preferred_sports: ['Basketball', 'Soccer'], // Using correct column name
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
    console.log('   Sports:', createdProfile.preferred_sports);

    // 3. Clean up
    console.log('\n3. Cleaning up test profile...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', session.user.id);

    if (deleteError) {
      console.error('❌ Profile cleanup failed:', deleteError);
      return;
    }

    console.log('✅ Test profile cleaned up successfully');
    console.log('\n🎉 Onboarding flow should work now!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOnboarding();



