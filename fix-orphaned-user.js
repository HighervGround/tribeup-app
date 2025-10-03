// Quick fix for orphaned user issue
// Run this in browser console to create missing user profile

async function fixOrphanedUser() {
  console.log('🔧 Fixing orphaned user...');
  
  // Get current user from Supabase auth
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('❌ No authenticated user found:', error);
    return;
  }
  
  console.log('👤 Current user:', user.id, user.email);
  
  // Check if user profile exists
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profile) {
    console.log('✅ User profile already exists');
    return;
  }
  
  console.log('🚨 No profile found, creating one...');
  
  // Create user profile
  const { data: newProfile, error: createError } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${Math.random().toString(36).substring(2, 10)}`,
      avatar: user.user_metadata?.avatar_url || '',
      bio: '',
      location: '',
      role: 'user',
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
        },
        privacy: {
          locationSharing: true,
          profileVisibility: 'public',
        },
        sports: []
      }
    })
    .select()
    .single();
    
  if (createError) {
    console.error('❌ Failed to create profile:', createError);
    return;
  }
  
  console.log('✅ Profile created successfully!', newProfile);
  console.log('🔄 Please refresh the page');
}

// Run the fix
fixOrphanedUser();
