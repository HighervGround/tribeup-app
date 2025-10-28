/**
 * Shared Google Maps API Loader
 * Ensures the API is loaded only once with consistent library configuration
 */

import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Get or create a singleton Google Maps Loader instance
 * All components should use this to ensure consistent configuration
 */
export function getGoogleMapsLoader(apiKey: string): Loader {
  // If loader already exists, return it
  if (loaderInstance) {
    return loaderInstance;
  }

  // Create loader with standard configuration
  loaderInstance = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'], // Always include both for consistency
  });

  return loaderInstance;
}

/**
 * Load Google Maps API (thread-safe, will only load once)
 */
export async function loadGoogleMapsApi(apiKey: string): Promise<void> {
  // If already loading or loaded, return existing promise
  if (loadPromise) {
    return loadPromise;
  }

  // Check if already loaded
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  // Start loading
  const loader = getGoogleMapsLoader(apiKey);
  loadPromise = loader.load();

  try {
    await loadPromise;
    console.log('✅ Google Maps API loaded successfully');
  } catch (error) {
    // Reset promise on error so it can be retried
    loadPromise = null;
    throw error;
  }

  return loadPromise;
}

/**
 * Check if Google Maps API is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && !!(window as any).google?.maps;
}

