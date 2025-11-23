// Environment variable utility for cross-platform compatibility
// Supports Vite (VITE_), Vercel (PUBLIC_), and Next.js (NEXT_PUBLIC_) prefixes

export function getEnvVar(name: string): string | undefined {
  const env = (import.meta as any).env || process.env;
  
  // Try different prefixes in order of preference
  const prefixes = ['VITE_', 'PUBLIC_', 'NEXT_PUBLIC_', ''];
  
  for (const prefix of prefixes) {
    const fullName = prefix + name;
    const value = env[fullName];
    if (value) {
      return value;
    }
  }
  
  return undefined;
}

export function getRequiredEnvVar(name: string): string {
  const value = getEnvVar(name);
  if (!value) {
    throw new Error(`Required environment variable not found: ${name} (tried VITE_${name}, PUBLIC_${name}, NEXT_PUBLIC_${name})`);
  }
  return value;
}

// Specific getters for commonly used environment variables
export const env = {
  // Supabase
  get SUPABASE_URL() { return getRequiredEnvVar('SUPABASE_URL'); },
  get SUPABASE_ANON_KEY() { return getRequiredEnvVar('SUPABASE_ANON_KEY'); },
  
  // Weather API
  get WEATHERAPI_KEY() { return getEnvVar('WEATHERAPI_KEY'); },
  get OPENWEATHER_API_KEY() { return getEnvVar('OPENWEATHER_API_KEY'); },
  
  // Google Maps
  get GOOGLE_MAPS_API_KEY() { return getEnvVar('GOOGLE_MAPS_API_KEY'); },
  get GOOGLE_PLACES_API_KEY() { return getEnvVar('GOOGLE_PLACES_API_KEY'); },
  
  // Push Notifications
  get VAPID_PUBLIC_KEY() { return getEnvVar('VAPID_PUBLIC_KEY'); },
  
  // App Configuration
  get APP_URL() { return getEnvVar('APP_URL') || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'); },
  get APP_VERSION() { return getEnvVar('APP_VERSION') || '1.0.0'; },
  get ENVIRONMENT() { return getEnvVar('ENVIRONMENT') || 'development'; },
  get ENABLE_MOCK_DATA() { return getEnvVar('ENABLE_MOCK_DATA') === 'true'; },
};

// Debug function to show which environment variables are loaded
export function debugEnvVars() {
  console.log('🔧 Environment Variables Debug:');
  console.log('Platform:', typeof window !== 'undefined' ? 'Browser' : 'Server');
  
  const vars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'APP_URL',
    'WEATHERAPI_KEY',
    'GOOGLE_MAPS_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'VAPID_PUBLIC_KEY',
    'APP_VERSION',
    'ENVIRONMENT'
  ];
  
  vars.forEach(varName => {
    const value = getEnvVar(varName);
    console.log(`  ${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
  });
}

// Expose debug function in browser for manual invocation
if (typeof window !== 'undefined') {
  (window as any).debugEnvVars = debugEnvVars;
}
