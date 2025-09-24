import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from './ui/loading-spinner';

interface ProfileCheckProps {
  children?: React.ReactNode;
}

export function ProfileCheck({ children = null }: ProfileCheckProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { user: appUser } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = () => {
      console.log('ProfileCheck: Starting check', { 
        user: user?.id, 
        appUser: appUser?.id, 
        authLoading,
        pathname: window.location.pathname 
      });
      
      // Skip check if on onboarding page
      if (window.location.pathname === '/onboarding') {
        console.log('ProfileCheck: On onboarding page, skipping');
        setChecking(false);
        return;
      }

      // Wait for auth to finish loading
      if (authLoading) {
        console.log('ProfileCheck: Auth still loading, waiting...');
        return; // Don't set checking to false, let it keep checking
      }

      // No authenticated user - let ProtectedRoute handle this
      if (!user) {
        console.log('ProfileCheck: No user after auth loaded, skipping');
        setChecking(false);
        return;
      }

      // User exists in app store - they're good to go
      if (appUser && appUser.id && appUser.email) {
        console.log('ProfileCheck: User has profile, allowing access');
        setChecking(false);
        return;
      }

      // Give AuthProvider more time to load the profile (up to 3 seconds)
      if (user && !appUser) {
        console.log('ProfileCheck: User authenticated but no app profile yet, waiting...');
        // Don't redirect immediately, give it more time
        return;
      }

      // After waiting, if still no profile, redirect to onboarding
      console.log('ProfileCheck: No profile found after waiting, redirecting to onboarding');
      setChecking(false);
      navigate('/onboarding', { replace: true });
    };

    // Check immediately, then every 500ms until resolved
    checkProfile();
    const interval = setInterval(checkProfile, 500);
    
    // Force timeout after 5 seconds
    const timeout = setTimeout(() => {
      console.log('ProfileCheck: Force timeout, allowing access');
      clearInterval(interval);
      setChecking(false);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user, appUser, authLoading, navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
