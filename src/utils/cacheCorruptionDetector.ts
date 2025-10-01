/**
 * Browser Cache Corruption Detection and Recovery
 * 
 * This addresses the root cause: corrupted browser storage that causes
 * infinite loading by serving bad cached responses to React Query.
 */

export class CacheCorruptionDetector {
  private static readonly CORRUPTION_MARKERS = {
    LAST_SUCCESSFUL_LOAD: 'tribeup_last_successful_load',
    CORRUPTION_COUNT: 'tribeup_corruption_count',
    FORCE_CLEAN_FLAG: 'tribeup_force_clean',
    APP_VERSION: 'tribeup_app_version'
  };

  private static readonly MAX_CORRUPTION_COUNT = 3;
  private static readonly CORRUPTION_TIMEOUT = 30000; // 30 seconds
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * Detect if browser cache is corrupted based on loading behavior
   */
  static async detectCorruption(): Promise<boolean> {
    console.log('🔍 [CacheCorruption] Starting corruption detection...');

    const indicators = {
      hasForceCleanFlag: this.hasForceCleanFlag(),
      hasVersionMismatch: this.hasVersionMismatch(),
      hasRepeatedFailures: this.hasRepeatedFailures(),
      hasStaleAuthTokens: await this.hasStaleAuthTokens(),
      hasCorruptedStorage: this.hasCorruptedStorage()
    };

    console.log('📊 [CacheCorruption] Indicators:', indicators);

    // If any major indicator is true, we have corruption
    const isCorrupted = Object.values(indicators).some(Boolean);
    
    if (isCorrupted) {
      console.warn('🚨 [CacheCorruption] Cache corruption detected!');
      this.incrementCorruptionCount();
    } else {
      console.log('✅ [CacheCorruption] No corruption detected');
      this.resetCorruptionCount();
    }

    return isCorrupted;
  }

  /**
   * Clean all browser storage and caches
   */
  static async cleanAllCaches(): Promise<void> {
    console.log('🧹 [CacheCorruption] Starting comprehensive cache cleanup...');

    try {
      // 1. Clear localStorage (Supabase auth, app data)
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('supabase') || key.startsWith('tribeup') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage: ${key}`);
        }
      });

      // 2. Clear sessionStorage
      sessionStorage.clear();
      console.log('🗑️ Cleared sessionStorage');

      // 3. Clear IndexedDB (if accessible)
      try {
        if ('indexedDB' in window) {
          // Clear common IndexedDB databases
          const dbNames = ['supabase-cache', 'workbox-precache', 'tribeup-cache'];
          for (const dbName of dbNames) {
            try {
              indexedDB.deleteDatabase(dbName);
              console.log(`🗑️ Cleared IndexedDB: ${dbName}`);
            } catch (e) {
              console.warn(`⚠️ Could not clear IndexedDB ${dbName}:`, e);
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ IndexedDB cleanup failed:', e);
      }

      // 4. Clear Service Worker caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(async (cacheName) => {
              await caches.delete(cacheName);
              console.log(`🗑️ Cleared cache: ${cacheName}`);
            })
          );
        } catch (e) {
          console.warn('⚠️ Service Worker cache cleanup failed:', e);
        }
      }

      // 5. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(async (registration) => {
              await registration.unregister();
              console.log('🗑️ Unregistered Service Worker');
            })
          );
        } catch (e) {
          console.warn('⚠️ Service Worker unregistration failed:', e);
        }
      }

      // 6. Set markers for successful cleanup
      this.markSuccessfulLoad();
      this.setAppVersion();
      
      console.log('✅ [CacheCorruption] Cache cleanup completed');

    } catch (error) {
      console.error('❌ [CacheCorruption] Cache cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Check if force clean flag is set
   */
  private static hasForceCleanFlag(): boolean {
    return localStorage.getItem(this.CORRUPTION_MARKERS.FORCE_CLEAN_FLAG) === 'true';
  }

  /**
   * Check if app version has changed (indicates potential cache conflicts)
   */
  private static hasVersionMismatch(): boolean {
    const storedVersion = localStorage.getItem(this.CORRUPTION_MARKERS.APP_VERSION);
    return storedVersion !== null && storedVersion !== this.CURRENT_VERSION;
  }

  /**
   * Check if we've had repeated loading failures
   */
  private static hasRepeatedFailures(): boolean {
    const count = parseInt(localStorage.getItem(this.CORRUPTION_MARKERS.CORRUPTION_COUNT) || '0');
    return count >= this.MAX_CORRUPTION_COUNT;
  }

  /**
   * Check if Supabase auth tokens are stale or corrupted
   */
  private static async hasStaleAuthTokens(): Promise<boolean> {
    try {
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase') || key.startsWith('sb-')
      );

      for (const key of authKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            // Check for malformed auth data
            if (parsed.access_token && typeof parsed.access_token !== 'string') {
              return true;
            }
            if (parsed.expires_at && isNaN(new Date(parsed.expires_at * 1000).getTime())) {
              return true;
            }
          } catch (e) {
            // JSON parse error indicates corruption
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.warn('⚠️ Auth token check failed:', error);
      return true; // Assume corruption if we can't check
    }
  }

  /**
   * Check for general localStorage corruption
   */
  private static hasCorruptedStorage(): boolean {
    try {
      // Test localStorage functionality
      const testKey = 'tribeup_storage_test';
      const testValue = 'test_value_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved !== testValue;
    } catch (error) {
      console.warn('⚠️ Storage corruption test failed:', error);
      return true;
    }
  }

  /**
   * Mark successful app load
   */
  private static markSuccessfulLoad(): void {
    localStorage.setItem(this.CORRUPTION_MARKERS.LAST_SUCCESSFUL_LOAD, Date.now().toString());
  }

  /**
   * Set current app version
   */
  private static setAppVersion(): void {
    localStorage.setItem(this.CORRUPTION_MARKERS.APP_VERSION, this.CURRENT_VERSION);
  }

  /**
   * Increment corruption count
   */
  private static incrementCorruptionCount(): void {
    const current = parseInt(localStorage.getItem(this.CORRUPTION_MARKERS.CORRUPTION_COUNT) || '0');
    localStorage.setItem(this.CORRUPTION_MARKERS.CORRUPTION_COUNT, (current + 1).toString());
  }

  /**
   * Reset corruption count on successful operation
   */
  private static resetCorruptionCount(): void {
    localStorage.removeItem(this.CORRUPTION_MARKERS.CORRUPTION_COUNT);
  }

  /**
   * Force cache cleanup on next load
   */
  static forceCleanOnNextLoad(): void {
    localStorage.setItem(this.CORRUPTION_MARKERS.FORCE_CLEAN_FLAG, 'true');
    console.log('🚨 [CacheCorruption] Force clean flag set for next load');
  }

  /**
   * Clear force clean flag
   */
  private static clearForceCleanFlag(): void {
    localStorage.removeItem(this.CORRUPTION_MARKERS.FORCE_CLEAN_FLAG);
  }

  /**
   * Auto-detect and clean if corruption is found
   */
  static async autoDetectAndClean(): Promise<boolean> {
    const isCorrupted = await this.detectCorruption();
    
    if (isCorrupted) {
      console.warn('🚨 [CacheCorruption] Auto-cleaning corrupted cache...');
      await this.cleanAllCaches();
      this.clearForceCleanFlag();
      return true;
    }
    
    return false;
  }
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).cacheCorruptionDetector = CacheCorruptionDetector;
  (window as any).forceCleanCache = () => CacheCorruptionDetector.forceCleanOnNextLoad();
}
