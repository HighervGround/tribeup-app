import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  oauthStartTime: number;
  oauthEndTime: number;
  profileCreationTime: number;
  totalTime: number;
  steps: string[];
}

export function OAuthPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when debug flag is set
    const isDebug = process.env.NODE_ENV === 'development' || 
                   localStorage.getItem('DEBUG_OAUTH_PERFORMANCE') === 'true';
    
    if (!isDebug) return;

    // Monitor OAuth performance
    const startTime = performance.now();
    let profileStartTime = 0;
    let profileEndTime = 0;
    const steps: string[] = [];

    // Track OAuth start
    const originalSignInWithOAuth = window.supabase?.auth?.signInWithOAuth;
    if (originalSignInWithOAuth) {
      window.supabase.auth.signInWithOAuth = async (...args: any[]) => {
        steps.push(`OAuth initiation started at ${new Date().toISOString()}`);
        const result = await originalSignInWithOAuth.apply(window.supabase.auth, args);
        steps.push(`OAuth redirect initiated at ${new Date().toISOString()}`);
        return result;
      };
    }

    // Track profile creation
    const originalGetUserProfile = window.SupabaseService?.getUserProfile;
    if (originalGetUserProfile) {
      window.SupabaseService.getUserProfile = async (...args: any[]) => {
        profileStartTime = performance.now();
        steps.push(`Profile lookup started at ${new Date().toISOString()}`);
        const result = await originalGetUserProfile.apply(window.SupabaseService, args);
        profileEndTime = performance.now();
        steps.push(`Profile lookup completed at ${new Date().toISOString()}`);
        return result;
      };
    }

    // Track auth state changes
    const authStateListener = (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        setMetrics({
          oauthStartTime: startTime,
          oauthEndTime: endTime,
          profileCreationTime: profileEndTime - profileStartTime,
          totalTime,
          steps: [...steps, `Authentication completed at ${new Date().toISOString()}`]
        });
        setIsVisible(true);
      }
    };

    // Listen for auth changes
    if (window.supabase?.auth?.onAuthStateChange) {
      const { data: { subscription } } = window.supabase.auth.onAuthStateChange(authStateListener);
      
      return () => {
        subscription.unsubscribe();
        // Restore original functions
        if (originalSignInWithOAuth) {
          window.supabase.auth.signInWithOAuth = originalSignInWithOAuth;
        }
        if (originalGetUserProfile) {
          window.SupabaseService.getUserProfile = originalGetUserProfile;
        }
      };
    }
  }, []);

  if (!isVisible || !metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">OAuth Performance</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Total Time:</span>
          <span className="ml-2 font-mono">
            {metrics.totalTime.toFixed(2)}ms
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Profile Creation:</span>
          <span className="ml-2 font-mono">
            {metrics.profileCreationTime.toFixed(2)}ms
          </span>
        </div>
        
        <div className="text-xs text-gray-400">
          <div>Steps:</div>
          {metrics.steps.map((step, index) => (
            <div key={index} className="ml-2">
              {index + 1}. {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Extend window object for type safety
declare global {
  interface Window {
    supabase?: any;
    SupabaseService?: any;
  }
}
