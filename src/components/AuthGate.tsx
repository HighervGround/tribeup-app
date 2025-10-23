import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './ui/loading-spinner';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        console.log('🔐 [AuthGate] Checking authentication...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('🔐 [AuthGate] No session found, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        const user = session.user;
        console.log('🔐 [AuthGate] User found:', user.id);

        // Ensure user row exists with auth_user_id
        console.log('🔐 [AuthGate] Ensuring user row exists...');
        const { error: upsertErr } = await supabase.from('users').upsert(
          { 
            auth_user_id: user.id, 
            email: user.email ?? null 
          },
          { onConflict: 'auth_user_id' }
        );

        if (upsertErr) {
          console.error('❌ [AuthGate] Error upserting user:', upsertErr);
          throw upsertErr;
        }

        console.log('✅ [AuthGate] User row ensured');

        // Read onboarding status
        console.log('🔐 [AuthGate] Checking onboarding status...');
        const { data: rows, error: selErr } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('auth_user_id', user.id)
          .limit(1);

        if (selErr) {
          console.error('❌ [AuthGate] Error reading onboarding status:', selErr);
          throw selErr;
        }

        const onboardingDone = rows?.[0]?.onboarding_completed === true;
        console.log('🔐 [AuthGate] Onboarding status:', { 
          onboardingDone, 
          rows: rows?.[0] 
        });

        if (!onboardingDone) {
          console.log('🔐 [AuthGate] Onboarding not completed, redirecting to onboarding');
          navigate('/onboarding', { replace: true });
        } else {
          console.log('✅ [AuthGate] User authenticated and onboarded');
        }
      } catch (e) {
        console.error('❌ [AuthGate] Error:', e);
        navigate('/login', { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();

    // React to auth changes (e.g., sign-in/out)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        console.log('🔐 [AuthGate] Auth state changed - no user, redirecting to login');
        navigate('/login', { replace: true });
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  return <>{children}</>;
}
