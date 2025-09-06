import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useAppStore } from '../store/appStore';
import { SupabaseService } from '../lib/supabaseService';
import { LoadingSpinner } from './ui/loading-spinner';
import { User } from '@supabase/supabase-js';

interface ProfileCheckProps {
  children?: React.ReactNode;
}

export function ProfileCheck({ children = null }: ProfileCheckProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: appUser } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      console.log('ProfileCheck: Starting profile check');
      
      // Don't check if we're already on the onboarding page
      if (window.location.pathname === '/onboarding') {
        console.log('ProfileCheck: Already on onboarding page, skipping check');
        setChecking(false);
        return;
      }
      
      // Get current location state
      const locationState = window.history.state?.usr || {};
      console.log('ProfileCheck: Current location state:', locationState);
      
      // If we just completed onboarding, don't check again
      if (locationState.fromOnboarding) {
        console.log('ProfileCheck: Just completed onboarding, skipping check');
        setChecking(false);
        return;
      }

      if (!user) {
        console.log('ProfileCheck: No user, skipping check');
        setChecking(false);
        return;
      }

      try {
        // If we already have user data in the store, check if it's complete
        if (appUser) {
          // Check if we have the required user data
          const hasRequiredData = appUser.name && appUser.email;
          console.log('ProfileCheck: Has required data?', { hasRequiredData, appUser });
          
          if (!hasRequiredData) {
            console.log('ProfileCheck: App user data incomplete, checking if we should redirect to onboarding');
            // Only redirect if we're not already on the onboarding page
            if (window.location.pathname !== '/onboarding') {
              console.log('ProfileCheck: Redirecting to onboarding');
              navigate('/onboarding', { 
                replace: true,
                state: { fromProfileCheck: true }
              });
            } else {
              console.log('ProfileCheck: Already on onboarding page, not redirecting');
            }
            setChecking(false);
            return;
          }
        } else {
          console.log('ProfileCheck: Loading user profile from Supabase');
          // Try to load user profile
          const userProfile = await SupabaseService.getUserProfile(user.id);
          console.log('ProfileCheck: Loaded user profile', userProfile);
          
          if (!userProfile || !userProfile.name) {
            // Profile doesn't exist or is incomplete, redirect to onboarding
            console.log('ProfileCheck: Profile incomplete or missing, redirecting to onboarding');
            navigate('/onboarding', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('ProfileCheck: Error checking profile:', error);
        navigate('/onboarding', { replace: true });
        return;
      }

      console.log('ProfileCheck: Profile check complete, rendering children');
      setChecking(false);
    };

    checkProfile();
  }, [user, appUser, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Getting ready..." />
      </div>
    );
  }

  return <>{children || null}</>;
}
