// BROWSER CONSOLE SCRIPT: Run this in the browser console to debug connection errors
// Copy and paste this entire script into the browser DevTools console

console.log('🔍 DEBUGGING CONNECTION ERRORS IN BROWSER...');

// Check if Supabase client exists
if (window.supabase) {
  console.log('✅ Supabase client found on window');
} else {
  console.log('❌ Supabase client not found on window');
}

// Check React Query client
if (window.queryClient) {
  console.log('✅ React Query client found');
  
  // Check query cache
  const cache = window.queryClient.getQueryCache();
  const queries = cache.getAll();
  console.log(`📊 Cached queries: ${queries.length}`);
  
  // Show failed queries
  const failedQueries = queries.filter(q => q.state.status === 'error');
  if (failedQueries.length > 0) {
    console.log(`❌ Failed queries: ${failedQueries.length}`);
    failedQueries.forEach(q => {
      console.log('Failed query:', q.queryKey, q.state.error);
    });
  }
  
  // Show loading queries
  const loadingQueries = queries.filter(q => q.state.status === 'loading');
  console.log(`⏳ Loading queries: ${loadingQueries.length}`);
  
} else {
  console.log('❌ React Query client not found');
}

// Test direct Supabase connection
async function testDirectConnection() {
  console.log('\n🧪 Testing direct Supabase connection...');
  
  try {
    // Get the Supabase client from the app
    const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';
    
    // Create a fresh client
    const { createClient } = window.supabase || {};
    if (!createClient) {
      console.log('❌ Cannot create Supabase client - library not loaded');
      return;
    }
    
    const testClient = createClient(supabaseUrl, supabaseKey);
    
    const startTime = performance.now();
    const { data, error } = await testClient
      .from('games')
      .select('count', { count: 'exact', head: true });
    
    const duration = performance.now() - startTime;
    
    if (error) {
      console.log('❌ Direct connection FAILED:', error);
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log(`✅ Direct connection OK (${duration.toFixed(2)}ms)`);
      console.log('Count result:', data);
    }
    
  } catch (error) {
    console.log('💥 Test failed:', error);
  }
}

// Test network connectivity
async function testNetwork() {
  console.log('\n🌐 Testing network connectivity...');
  
  try {
    const response = await fetch('https://alegufnopsminqcokelr.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ'
      }
    });
    
    console.log(`✅ Network OK - Status: ${response.status}`);
    
  } catch (error) {
    console.log('❌ Network FAILED:', error.message);
  }
}

// Check for console errors
console.log('\n📋 Recent console errors:');
// This will show any errors that have occurred

// Run tests
testDirectConnection();
testNetwork();

console.log('\n🎯 NEXT STEPS:');
console.log('1. Check the Network tab in DevTools for failed requests');
console.log('2. Look for any red errors in the Console');
console.log('3. Check if queries are timing out or failing');
console.log('4. Try hard refresh (Cmd+Shift+R) and run this script again');
