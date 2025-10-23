// Debug script to diagnose OAuth hanging issues
// Run this in the browser console during OAuth flow

console.log('🔍 OAuth Debug Script Started');

// Check if we're on the auth callback page
if (window.location.pathname.includes('/auth/callback')) {
  console.log('📍 On auth callback page');
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  console.log('🔗 URL Parameters:', Object.fromEntries(urlParams.entries()));
  
  // Check for hash parameters (OAuth often uses hash)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  console.log('🔗 Hash Parameters:', Object.fromEntries(hashParams.entries()));
  
  // Check for Supabase session
  if (window.supabase) {
    console.log('✅ Supabase client found');
    
    // Try to get current session
    window.supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('❌ Session error:', error);
      } else {
        console.log('✅ Session data:', data);
      }
    });
  } else {
    console.error('❌ Supabase client not found');
  }
  
  // Check for any JavaScript errors
  window.addEventListener('error', (e) => {
    console.error('🚨 JavaScript Error:', e.error);
  });
  
  // Check for unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Unhandled Promise Rejection:', e.reason);
  });
  
} else {
  console.log('📍 Not on auth callback page');
  console.log('Current URL:', window.location.href);
}

// Check network requests
console.log('🌐 Network requests in progress:');
const requests = performance.getEntriesByType('resource');
requests.forEach(req => {
  if (req.name.includes('supabase') || req.name.includes('auth')) {
    console.log('  📡 Auth-related request:', req.name, req.duration + 'ms');
  }
});

// Monitor for new network requests
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('supabase') || entry.name.includes('auth')) {
      console.log('  📡 New auth request:', entry.name, entry.duration + 'ms');
    }
  });
});
observer.observe({ entryTypes: ['resource'] });

console.log('🔍 OAuth Debug Script Complete - monitoring for issues...');
