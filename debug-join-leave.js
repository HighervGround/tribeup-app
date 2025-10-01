// Debug join/leave functionality
// Run this in browser console while on a game page

console.log('🔍 Debugging join/leave functionality...');

// Check current user
const appUser = window.useAppStore?.getState()?.user;
console.log('👤 Current app user:', appUser);

// Check auth session
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('🔐 Auth session user:', session?.user?.id);
  console.log('🔐 Auth email:', session?.user?.email);
});

// Check if join/leave buttons exist
const joinButtons = document.querySelectorAll('button');
console.log('🔘 Found buttons:', joinButtons.length);

joinButtons.forEach((btn, i) => {
  if (btn.textContent?.includes('Join') || btn.textContent?.includes('Leave')) {
    console.log(`🔘 Button ${i}:`, btn.textContent, 'disabled:', btn.disabled);
    
    // Add click listener to debug
    btn.addEventListener('click', (e) => {
      console.log('🖱️ Button clicked:', btn.textContent);
      console.log('🖱️ Event:', e);
    });
  }
});

// Check React Query cache for games
if (window.queryClient) {
  const gamesCache = window.queryClient.getQueryData(['games']);
  console.log('📦 Games in cache:', gamesCache);
  
  if (gamesCache && gamesCache.length > 0) {
    console.log('📦 First game isJoined:', gamesCache[0].isJoined);
    console.log('📦 First game participants:', gamesCache[0].currentPlayers);
  }
}
