import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from './ui/loading-spinner';

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

          if (user && !appUser) {
            // User exists but no profile - redirect to onboarding
            console.log('SimpleAuthWrapper: User but no profile, redirecting to onboarding');
            navigate('/onboarding', { replace: true });
            return;
          }

          // User and profile exist - allow access
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}
