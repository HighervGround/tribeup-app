// BROWSER CONSOLE SCRIPT - Run this in the browser console to clear all caches
// Copy and paste this entire script into the browser console and press Enter

console.log('🧹 Clearing all caches...');

// 1. Clear localStorage
console.log('Clearing localStorage...');
const localStorageKeys = Object.keys(localStorage);
localStorageKeys.forEach(key => {
  if (key.includes('tribeup') || key.includes('react-query') || key.includes('supabase')) {
    console.log(`  - Removing: ${key}`);
    localStorage.removeItem(key);
  }
});

// 2. Clear sessionStorage
console.log('Clearing sessionStorage...');
const sessionStorageKeys = Object.keys(sessionStorage);
sessionStorageKeys.forEach(key => {
  if (key.includes('tribeup') || key.includes('react-query') || key.includes('supabase')) {
    console.log(`  - Removing: ${key}`);
    sessionStorage.removeItem(key);
  }
});

// 3. Clear React Query cache if available
console.log('Clearing React Query cache...');
if (window.queryClient) {
  window.queryClient.clear();
  console.log('  ✅ React Query cache cleared');
} else {
  console.log('  ⚠️ React Query client not found on window');
}

// 4. Clear IndexedDB (if used)
console.log('Clearing IndexedDB...');
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name && (db.name.includes('tribeup') || db.name.includes('supabase'))) {
        console.log(`  - Deleting database: ${db.name}`);
        indexedDB.deleteDatabase(db.name);
      }
    });
  });
}

// 5. Force reload after clearing
console.log('🔄 Forcing page reload in 2 seconds...');
setTimeout(() => {
  window.location.reload(true);
}, 2000);

console.log('✅ Cache clearing initiated!');
