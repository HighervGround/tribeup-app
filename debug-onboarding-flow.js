const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOnboardingFlow() {
  console.log('🔍 Debugging Onboarding Flow Issues\n');
  
  try {
    // 1. Check current auth state
    console.log('1️⃣ Checking current auth state...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError);
      return;
    }
    
    if (!user) {
      console.log('ℹ️ No authenticated user - this explains why onboarding always triggers');
      return;
    }
    
    console.log('✅ Authenticated user found:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    });
    
    // 2. Check if user profile exists in database
    console.log('\n2️⃣ Checking user profile in database...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.log('❌ Profile query error:', profileError);
      return;
    }
    
    if (!profile) {
      console.log('❌ No profile found in database - this is the root cause!');
      console.log('🔧 User needs profile creation during OAuth sign-in');
      return;
    }
    
    console.log('✅ Profile found:', {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      username: profile.username,
      preferred_sports: profile.preferred_sports,
      onboarding_completed: profile.onboarding_completed,
      created_at: profile.created_at
    });
    
    // 3. Analyze onboarding requirements
    console.log('\n3️⃣ Analyzing onboarding requirements...');
    const hasSportsPreferences = profile.preferred_sports && profile.preferred_sports.length > 0;
    const hasBasicInfo = profile.full_name && profile.full_name.trim().length > 0;
    const hasUsername = profile.username && profile.username.trim().length > 0;
    const hasCompletedOnboarding = profile.onboarding_completed === true;
    
    console.log('📋 Onboarding analysis:', {
      hasSportsPreferences,
      hasBasicInfo,
      hasUsername,
      hasCompletedOnboarding,
      sportsArray: profile.preferred_sports,
      sportsLength: profile.preferred_sports?.length || 0
    });
    
    // 4. Determine what needs onboarding
    const needsOnboarding = !hasSportsPreferences && !hasCompletedOnboarding;
    
    console.log(`\n🎯 Result: User ${needsOnboarding ? 'NEEDS' : 'DOES NOT NEED'} onboarding`);
    
    if (needsOnboarding) {
      console.log('🔍 Reasons for needing onboarding:');
      if (!hasSportsPreferences) console.log('  - Missing sports preferences');
      if (!hasCompletedOnboarding) console.log('  - onboarding_completed is not true');
    }
    
    // 5. Check localStorage backup
    console.log('\n4️⃣ Checking localStorage backup...');
    const localStorageKey = `onboarding_completed_${user.id}`;
    const localStorageValue = 'localStorage not accessible from Node.js';
    console.log(`localStorage key: ${localStorageKey}`);
    console.log('Note: localStorage can only be checked from browser console');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugOnboardingFlow();
