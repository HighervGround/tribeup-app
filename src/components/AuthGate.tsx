import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './ui/loading-spinner';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const checkInProgressRef = useRef(false);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    // Timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ [AuthGate] Loading timeout, forcing completion');
        setLoading(false);
        checkInProgressRef.current = false;
      }
    }, 3000);

    const checkAuth = async () => {
      // Prevent multiple simultaneous checks
      if (checkInProgressRef.current) {
        console.log('🔐 [AuthGate] Auth check already in progress, skipping');
        if (isMounted) setLoading(false);
        return;
      }

      // Debounce rapid auth checks (within 500ms)
      const now = Date.now();
      if (now - lastCheckRef.current < 500) {
        console.log('🔐 [AuthGate] Debouncing rapid auth check');
        if (isMounted) setLoading(false);
        return;
      }
      lastCheckRef.current = now;
      checkInProgressRef.current = true;

      try {
        console.log('🔐 [AuthGate] Checking authentication...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // Only redirect to login if we're not already there
          if (location.pathname !== '/login') {
            console.log('🔐 [AuthGate] No session found, redirecting to login');
            navigate('/login', { replace: true });
          }
          if (isMounted) setLoading(false);
          checkInProgressRef.current = false;
          return;
        }

        const user = session.user;
        console.log('🔐 [AuthGate] User found:', user.id);

        // Profile creation is handled by SimpleAuthProvider/ensure_user_profile RPC
        // RLS policy (auth.uid() = id) ensures we only get current user's row
        console.log('🔐 [AuthGate] Checking onboarding status...');
        const { data: userRow, error: selErr } = await supabase
          .from('users')
          .select('onboarding_completed,id,auth_user_id')
          .or(`id.eq.${user.id},auth_user_id.eq.${user.id}`)
          .maybeSingle();

        if (selErr) {
          console.error('❌ [AuthGate] Error reading onboarding status:', selErr);
          // Profile might not exist yet - let SimpleAuthProvider create it
          // Don't block navigation, just assume onboarding not done
          console.log('⚠️ [AuthGate] Profile may not exist yet, allowing navigation');
        }

        const onboardingDone = userRow?.onboarding_completed === true;
        console.log('🔐 [AuthGate] Onboarding status:', { 
          onboardingDone, 
          userRow 
        });

        // Only redirect when we have an explicit false; if row missing, don't force onboarding here
        if (userRow && !onboardingDone) {
          // Only redirect if we're not already on onboarding page
          if (location.pathname !== '/onboarding') {
            console.log('🔐 [AuthGate] Onboarding not completed, redirecting to onboarding');
            navigate('/onboarding', { replace: true });
          }
        } else {
          console.log('✅ [AuthGate] User authenticated and onboarded');
          // Redirect authenticated users away from login/onboarding pages
          if (location.pathname === '/login' || location.pathname === '/onboarding') {
            console.log('🔐 [AuthGate] Redirecting authenticated user to home');
            navigate('/', { replace: true });
          }
        }
      } catch (e) {
        console.error('❌ [AuthGate] Error:', e);
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          checkInProgressRef.current = false;
        }
      }
    };

    // Initial check
    checkAuth();

    // React to auth changes (e.g., sign-in/out) with debouncing
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Clear any pending debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce auth state changes
      debounceTimer = setTimeout(() => {
        if (!session?.user) {
          // Only redirect if we're not already on login page
          if (location.pathname !== '/login') {
            console.log('🔐 [AuthGate] Auth state changed - no user, redirecting to login');
            navigate('/login', { replace: true });
          }
        } else {
          // User signed in - check auth and onboarding
          console.log('🔐 [AuthGate] Auth state changed - user signed in, checking auth');
          checkAuth();
        }
      }, 100); // Small debounce to prevent rapid-fire redirects
    });

    return () => {
      isMounted = false;
      checkInProgressRef.current = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (timeoutId) clearTimeout(timeoutId);
      sub.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  return <>{children}</>;
}
