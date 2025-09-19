// Clear Service Worker Cache Script
// Run this in browser console to force clear all caches

async function clearAllCaches() {
  console.log('🧹 Starting cache cleanup...');
  
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`Found ${registrations.length} service worker registrations`);
      
      for (const registration of registrations) {
        console.log('Unregistering service worker:', registration.scope);
        await registration.unregister();
      }
    }
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} caches:`, cacheNames);
      
      for (const cacheName of cacheNames) {
        console.log('Deleting cache:', cacheName);
        await caches.delete(cacheName);
      }
    }
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('✅ All caches cleared successfully!');
    console.log('🔄 Reloading page...');
    
    // Force reload without cache
    window.location.reload(true);
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
}

// Auto-run the function
clearAllCaches();
