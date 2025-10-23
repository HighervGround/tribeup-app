// OAuth Configuration Diagnostic Script
// Run this in the browser console to check OAuth setup

console.log('🔍 OAuth Configuration Diagnostic');

// Check if Supabase client is properly initialized
if (typeof window.supabase !== 'undefined') {
  console.log('✅ Supabase client found');
  
  // Check Supabase configuration
  const config = window.supabase.supabaseUrl;
  console.log('🔗 Supabase URL:', config);
  
  // Test basic Supabase connection
  window.supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connection successful');
      console.log('📊 Current session:', data.session ? 'Active' : 'None');
    }
  });
  
} else {
  console.error('❌ Supabase client not found - check imports');
}

// Check current URL and parameters
console.log('📍 Current URL:', window.location.href);
console.log('🔗 Pathname:', window.location.pathname);
console.log('🔗 Search params:', window.location.search);
console.log('🔗 Hash:', window.location.hash);

// Check for OAuth callback parameters
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));

console.log('📋 URL Parameters:', Object.fromEntries(urlParams.entries()));
console.log('📋 Hash Parameters:', Object.fromEntries(hashParams.entries()));

// Check for common OAuth errors
const error = urlParams.get('error') || hashParams.get('error');
const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

if (error) {
  console.error('🚨 OAuth Error:', error);
  console.error('📝 Error Description:', errorDescription);
}

// Check for OAuth success parameters
const code = urlParams.get('code') || hashParams.get('code');
const accessToken = hashParams.get('access_token');

if (code) {
  console.log('✅ Authorization code received:', code.substring(0, 20) + '...');
} else if (accessToken) {
  console.log('✅ Access token received:', accessToken.substring(0, 20) + '...');
} else {
  console.log('⏳ No OAuth parameters found - may still be processing');
}

// Monitor for network requests
console.log('🌐 Monitoring network requests...');
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('supabase') || entry.name.includes('auth')) {
      console.log('📡 Auth request:', entry.name, entry.duration + 'ms');
    }
  });
});
observer.observe({ entryTypes: ['resource'] });

// Check for JavaScript errors
window.addEventListener('error', (e) => {
  console.error('🚨 JavaScript Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 Unhandled Promise Rejection:', e.reason);
});

console.log('🔍 Diagnostic complete - check console for issues');
