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
  const { user } = useAuth();
  const { user: appUser } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = () => {
      console.log('ProfileCheck: Simple check starting');
      
      // Skip check if on onboarding page
      if (window.location.pathname === '/onboarding') {
        console.log('ProfileCheck: On onboarding page, skipping');
        setChecking(false);
        return;
      }

      // No authenticated user - let ProtectedRoute handle this
      if (!user) {
        console.log('ProfileCheck: No user, skipping');
        setChecking(false);
        return;
      }

      // User exists in app store - they're good to go
      if (appUser && appUser.id && appUser.email) {
        console.log('ProfileCheck: User has profile, allowing access');
        setChecking(false);
        return;
      }

      // No profile in store - redirect to onboarding
      console.log('ProfileCheck: No profile found, redirecting to onboarding');
      setChecking(false);
      navigate('/onboarding', { replace: true });
    };

    // Add a small delay to prevent flash
    const timer = setTimeout(checkProfile, 100);
    
    return () => clearTimeout(timer);
  }, [user, appUser, navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
