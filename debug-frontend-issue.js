// BROWSER CONSOLE SCRIPT: Comprehensive frontend debugging
// Run this in browser console to find the exact issue

console.log('🔍 COMPREHENSIVE FRONTEND DEBUG...');

// 1. Check React Query state
console.log('\n1️⃣ React Query Analysis:');
if (window.queryClient) {
  const cache = window.queryClient.getQueryCache();
  const queries = cache.getAll();
  
  console.log(`Total queries: ${queries.length}`);
  
  const byStatus = queries.reduce((acc, q) => {
    acc[q.state.status] = (acc[q.state.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Query status breakdown:', byStatus);
  
  // Show failed queries with details
  const failed = queries.filter(q => q.state.status === 'error');
  if (failed.length > 0) {
    console.log('\n❌ FAILED QUERIES:');
    failed.forEach(q => {
      console.log(`- Key: ${JSON.stringify(q.queryKey)}`);
      console.log(`  Error: ${q.state.error?.message}`);
      console.log(`  Fetch status: ${q.state.fetchStatus}`);
      console.log(`  Error count: ${q.state.errorUpdateCount}`);
    });
  }
  
  // Show loading/pending queries
  const loading = queries.filter(q => q.state.status === 'loading' || q.state.status === 'pending');
  if (loading.length > 0) {
    console.log('\n⏳ LOADING/PENDING QUERIES:');
    loading.forEach(q => {
      console.log(`- Key: ${JSON.stringify(q.queryKey)}`);
      console.log(`  Status: ${q.state.status}`);
      console.log(`  Fetch status: ${q.state.fetchStatus}`);
      console.log(`  Data updated at: ${q.state.dataUpdatedAt}`);
      console.log(`  Error updated at: ${q.state.errorUpdatedAt}`);
      console.log(`  Is fetching: ${q.state.isFetching}`);
      console.log(`  Is loading: ${q.state.isLoading}`);
      console.log(`  Is stale: ${q.state.isStale}`);
    });
  }
  
} else {
  console.log('❌ React Query client not found');
}

// 2. Check auth state
console.log('\n2️⃣ Auth State Analysis:');
try {
  // Check current user from Supabase
  if (window.supabase) {
    window.supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.log('❌ Auth user error:', error.message);
      } else {
        console.log('👤 Current user:', data.user?.id || 'none');
        console.log('📧 User email:', data.user?.email || 'none');
      }
    });
  }
  
  // Check for loading indicators
  const loadingElements = document.querySelectorAll('.animate-spin, [data-loading]');
  console.log(`Loading indicators: ${loadingElements.length}`);
  
  // Check localStorage for auth data
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') || key.includes('supabase') || key.includes('tribeup')
  );
  console.log('Auth-related localStorage keys:', authKeys);
  
  // Check for specific problematic user IDs
  const authToken = localStorage.getItem('sb-alegufnopsminqcokelr-auth-token');
  if (authToken) {
    if (authToken.includes('ca2ee1cc') || authToken.includes('6e9f3e18')) {
      console.log('🚨 FOUND ORPHANED USER IN TOKEN!');
    } else {
      console.log('✅ Auth token looks clean');
    }
  }
  
} catch (error) {
  console.log('Auth check error:', error.message);
}

// 3. Network analysis
console.log('\n3️⃣ Network Analysis:');
if (performance.getEntriesByType) {
  const networkEntries = performance.getEntriesByType('navigation');
  if (networkEntries.length > 0) {
    const nav = networkEntries[0];
    console.log(`Page load time: ${nav.loadEventEnd - nav.fetchStart}ms`);
    console.log(`DNS lookup: ${nav.domainLookupEnd - nav.domainLookupStart}ms`);
    console.log(`Connect time: ${nav.connectEnd - nav.connectStart}ms`);
  }
  
  // Check for failed requests
  const resourceEntries = performance.getEntriesByType('resource');
  const supabaseRequests = resourceEntries.filter(entry => 
    entry.name.includes('supabase.co')
  );
  
  console.log(`Supabase requests: ${supabaseRequests.length}`);
  
  const slowRequests = supabaseRequests.filter(entry => entry.duration > 5000);
  if (slowRequests.length > 0) {
    console.log('\n🐌 SLOW SUPABASE REQUESTS (>5s):');
    slowRequests.forEach(entry => {
      console.log(`- ${entry.name}: ${entry.duration.toFixed(2)}ms`);
    });
  }
}

// 4. Console error analysis
console.log('\n4️⃣ Console Error Analysis:');
// Store original console.error to capture future errors
const originalError = console.error;
const errors = [];

console.error = function(...args) {
  errors.push(args);
  originalError.apply(console, args);
};

// Check for React errors
const reactErrors = errors.filter(error => 
  error.some(arg => 
    typeof arg === 'string' && (
      arg.includes('React') || 
      arg.includes('ProtectedRoute') ||
      arg.includes('useAuth')
    )
  )
);

if (reactErrors.length > 0) {
  console.log('React-related errors found:', reactErrors.length);
}

// 5. Supabase client analysis
console.log('\n5️⃣ Supabase Client Analysis:');
if (window.supabase) {
  console.log('✅ Supabase client available');
  
  // Test basic connection with timeout
  console.log('🔧 Testing basic Supabase query...');
  const testPromise = window.supabase.from('games').select('count', { count: 'exact', head: true });
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Test query timeout')), 5000)
  );
  
  Promise.race([testPromise, timeoutPromise])
    .then(result => {
      if (result.error) {
        console.log('❌ Supabase test failed:', result.error.message);
      } else {
        console.log('✅ Supabase connection OK, count:', result.count);
      }
    })
    .catch(error => {
      console.log('❌ Supabase test error:', error.message);
    });
} else {
  console.log('❌ Supabase client not available on window');
}

// 6. Component state analysis
console.log('\n6️⃣ Component State Analysis:');
const suspenseElements = document.querySelectorAll('[data-suspense], .suspense');
console.log(`Suspense boundaries: ${suspenseElements.length}`);

const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
console.log(`Error boundaries: ${errorBoundaries.length}`);

// 7. Manual query testing
console.log('\n7️⃣ Manual Query Testing:');
if (window.queryClient) {
  const queries = window.queryClient.getQueryCache().getAll();
  const pendingQueries = queries.filter(q => q.state.status === 'pending');
  
  if (pendingQueries.length > 0) {
    console.log('🔧 Found pending queries. Testing manual fetch...');
    pendingQueries.forEach(async (query, index) => {
      console.log(`🔧 Testing query ${index + 1}:`, query.queryKey);
      try {
        const result = await query.fetch();
        console.log(`✅ Query ${index + 1} succeeded:`, result);
      } catch (error) {
        console.log(`❌ Query ${index + 1} failed:`, error.message);
      }
    });
  }
}

// 8. Recommendations
console.log('\n🎯 NEXT STEPS:');
console.log('1. Check the pending query details above');
console.log('2. Look for manual query test results');
console.log('3. Check if auth state is stuck in loading');
console.log('4. Clear localStorage if auth keys look corrupted');
console.log('5. Hard refresh (Cmd+Shift+R) and run this script again');

console.log('\n✅ Frontend debug complete!');
