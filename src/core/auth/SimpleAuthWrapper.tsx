import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from './ui/loading-spinner';
import { supabase } from '../lib/supabase';

interface SimpleAuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function SimpleAuthWrapper({ children, requireAuth = true }: SimpleAuthWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { user: appUser } = useAppStore();
  const [ready, setReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    started?: number;
    step?: string;
    sessionValid?: boolean;
    sessionExpired?: boolean;
    clearedSession?: boolean;
    corruptedSession?: boolean;
    sessionError?: string;
    completed?: number;
    duration?: number;
    success?: boolean;
    error?: string;
  }>({});

  // Debug and clean corrupted sessions on mount
  useEffect(() => {
    const debugAndCleanAuth = async () => {
      const startTime = Date.now();
      setDebugInfo({ started: startTime, step: 'checking_localStorage' });

      try {
        // Debug localStorage auth items
        const authKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
        console.log('🔍 Auth items in localStorage:', authKeys);

        // Check for corrupted session data
        const authKey = Object.keys(localStorage).find(k => k.includes('auth-token') || k.includes('tribeup-auth'));
        if (authKey) {
          try {
            const sessionData = localStorage.getItem(authKey);
            const session = JSON.parse(sessionData || '{}');
            const hasToken = !!session.access_token;
            const isExpired = session.expires_at ? new Date(session.expires_at * 1000) < new Date() : true;
            
            console.log('🔍 Session debug:', {
              hasToken,
              isExpired,
              expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : 'unknown'
            });

            setDebugInfo(prev => ({ ...prev, sessionValid: hasToken, sessionExpired: isExpired }));

            // Clear expired or corrupted sessions
            if (!hasToken || isExpired) {
              console.log('🧹 Clearing corrupted/expired session');
              await supabase.auth.signOut();
              setDebugInfo(prev => ({ ...prev, clearedSession: true }));
            }
          } catch (parseError) {
            console.log('🚨 Corrupted session data detected, clearing:', parseError);
            localStorage.removeItem(authKey);
            await supabase.auth.signOut();
            setDebugInfo(prev => ({ ...prev, corruptedSession: true, clearedSession: true }));
          }
        }

        // Verify current session with Supabase
        setDebugInfo(prev => ({ ...prev, step: 'verifying_session' }));
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('🚨 Auth session error, clearing:', error);
          await supabase.auth.signOut();
          setDebugInfo(prev => ({ ...prev, sessionError: error.message, clearedSession: true }));
        } else if (session && new Date(session.expires_at * 1000) < new Date()) {
          console.log('🧹 Session expired, clearing');
          await supabase.auth.signOut();
          setDebugInfo(prev => ({ ...prev, sessionExpired: true, clearedSession: true }));
        }

        setDebugInfo(prev => ({ 
          ...prev, 
          completed: Date.now(),
          duration: Date.now() - startTime,
          success: true 
        }));

      } catch (error) {
        console.error('🚨 Auth cleanup error:', error);
        setDebugInfo(prev => ({ 
          ...prev, 
          completed: Date.now(),
          duration: Date.now() - startTime,
          error: error.message 
        }));
        
        // Nuclear option - clear everything if there's an error
        try {
          localStorage.clear();
          await supabase.auth.signOut();
          console.log('🧹 Nuclear cleanup completed');
        } catch (nuclearError) {
          console.error('🚨 Nuclear cleanup failed:', nuclearError);
        }
      }
    };

    debugAndCleanAuth();
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkAuth = () => {
      try {
        console.log('SimpleAuthWrapper: Checking auth', {
          authLoading,
          hasUser: !!user,
          hasAppUser: !!appUser,
          requireAuth,
          pathname: location.pathname
        });

        // Still loading auth
        if (authLoading) {
          return;
        }

        // Auth loaded, now decide what to do
        if (requireAuth) {
          if (!user) {
            // Need auth but no user - redirect to login
            console.log('SimpleAuthWrapper: No user, redirecting to auth');
            navigate('/auth', { replace: true });
            return;
          }

          // If user exists but appUser isn't hydrated yet, only redirect
          // when onboarding_completed is explicitly false. Otherwise allow.
          if (user && !appUser) {
            let cancelled = false;
            (async () => {
              try {
                const { data, error } = await supabase
                  .from('users')
                  .select('onboarding_completed')
                  .eq('id', user.id)
                  .maybeSingle();

                if (cancelled) return;

                if (!error && data && data.onboarding_completed === false) {
                  console.log('SimpleAuthWrapper: onboarding_completed=false, redirecting to onboarding');
                  navigate('/onboarding', { replace: true });
                  return;
                }

                console.log('SimpleAuthWrapper: No explicit onboarding=false, allowing access');
                setReady(true);
              } catch (e) {
                if (cancelled) return;
                console.log('SimpleAuthWrapper: Error checking onboarding, allowing access');
                setReady(true);
              }
            })();

            return () => { cancelled = true; };
          }

          // User and profile exist (or already hydrated) - allow access
          console.log('SimpleAuthWrapper: User and profile exist, allowing access');
          setReady(true);
        } else {
          // No auth required
          if (user && location.pathname === '/auth') {
            // User is logged in but on auth page - redirect to home
            console.log('SimpleAuthWrapper: User on auth page, redirecting home');
            navigate('/', { replace: true });
            return;
          }
          
          console.log('SimpleAuthWrapper: No auth required, allowing access');
          setReady(true);
        }
      } catch (error) {
        console.error('SimpleAuthWrapper: Error in checkAuth:', error);
        // On error, just allow access
        setReady(true);
      }
    };

    // Check immediately
    checkAuth();

    // Force ready after 5 seconds to prevent infinite loading
    timeoutId = setTimeout(() => {
      console.log('SimpleAuthWrapper: Force ready timeout');
      setReady(true);
    }, 5000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [authLoading, user, appUser, requireAuth, navigate, location.pathname]);

  // Show debug info in console
  useEffect(() => {
    if (Object.keys(debugInfo).length > 0) {
      console.log('🔍 Auth Debug Info:', debugInfo);
    }
  }, [debugInfo]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" text="Loading..." />
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground max-w-md mx-auto">
              <div>Auth Loading: {authLoading ? 'Yes' : 'No'}</div>
              <div>Has User: {user ? 'Yes' : 'No'}</div>
              <div>Has App User: {appUser ? 'Yes' : 'No'}</div>
              <div>Require Auth: {requireAuth ? 'Yes' : 'No'}</div>
              {debugInfo.step && <div>Step: {debugInfo.step}</div>}
              {debugInfo.duration && <div>Duration: {debugInfo.duration}ms</div>}
              {debugInfo.error && <div className="text-red-500">Error: {debugInfo.error}</div>}
              {debugInfo.clearedSession && <div className="text-yellow-500">Cleared corrupted session</div>}
            </div>
          )}
          
          {/* Emergency escape after 10 seconds */}
          <div className="text-xs text-muted-foreground">
            If this takes too long, try refreshing the page
          </div>
          
          {/* Nuclear option for testing */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                console.log('🧹 Nuclear option: Clearing all localStorage');
                localStorage.clear();
                window.location.reload();
              }}
              className="text-xs text-red-500 underline hover:text-red-700"
            >
              Clear All Data & Refresh (Dev Only)
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
