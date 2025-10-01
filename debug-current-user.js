// Debug current user identity in browser console
// Copy and paste this into your browser console while logged in

console.log('🔍 Debugging current user identity...');

// Get current auth session
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.log('❌ Session error:', error);
    return;
  }
  
  if (!session) {
    console.log('❌ No active session');
    return;
  }
  
  console.log('✅ Current auth user:', {
    id: session.user.id,
    email: session.user.email,
    provider: session.user.app_metadata?.provider,
    oauth_email: session.user.user_metadata?.email,
    full_name: session.user.user_metadata?.full_name,
    avatar_url: session.user.user_metadata?.avatar_url,
    created_at: session.user.created_at
  });
  
  // Check if this user exists in public.users table
  supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()
    .then(({ data: publicUser, error: publicError }) => {
      if (publicError) {
        console.log('❌ NOT found in public.users:', publicError.message);
        console.log('🔧 This is the problem! Auth user exists but no profile record.');
      } else {
        console.log('✅ Found in public.users:', {
          id: publicUser.id,
          email: publicUser.email,
          username: publicUser.username,
          full_name: publicUser.full_name,
          created_at: publicUser.created_at
        });
        
        // Check if emails match
        if (session.user.email !== publicUser.email) {
          console.log('⚠️ EMAIL MISMATCH!');
          console.log('  Auth email:', session.user.email);
          console.log('  Profile email:', publicUser.email);
        }
      }
    });
});

// Also check what the app store thinks the current user is
if (window.useAppStore) {
  const appUser = window.useAppStore.getState().user;
  console.log('📱 App store user:', appUser);
}
