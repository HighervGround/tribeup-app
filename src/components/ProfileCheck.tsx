import React, { useEffect, useState, useRef } from 'react';
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
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkProfile = async () => {
      // Prevent multiple checks
      if (hasChecked.current) {
        console.log('ProfileCheck: Already checked, skipping');
        setChecking(false);
        return;
      }
      
      console.log('ProfileCheck: Starting profile check');
      
      // Don't check if we're already on the onboarding page
      if (window.location.pathname === '/onboarding') {
        console.log('ProfileCheck: Already on onboarding page, skipping check');
        hasChecked.current = true;
        setChecking(false);
        return;
      }
      
      // Get current location state
      const locationState = window.history.state?.usr || {};
      console.log('ProfileCheck: Current location state:', locationState);
      
      // If we just completed onboarding, don't check again
      if (locationState.fromOnboarding) {
        console.log('ProfileCheck: Just completed onboarding, skipping check');
        hasChecked.current = true;
        setChecking(false);
        return;
      }

      if (!user) {
        console.log('ProfileCheck: No user, skipping check');
        hasChecked.current = true;
        setChecking(false);
        return;
      }

      try {
        // Get fresh user data from store to avoid dependency issues
        const currentAppUser = useAppStore.getState().user;
        
        // If we already have user data in the store, check if it's complete
        if (currentAppUser) {
          // Check if we have the required user data
          const hasRequiredData = currentAppUser.name && currentAppUser.email;
          console.log('ProfileCheck: Has required data?', { hasRequiredData, currentAppUser });
          
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
            hasChecked.current = true;
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
            hasChecked.current = true;
            navigate('/onboarding', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('ProfileCheck: Error checking profile:', error);
        hasChecked.current = true;
        navigate('/onboarding', { replace: true });
        return;
      }

      console.log('ProfileCheck: Profile check complete, rendering children');
      hasChecked.current = true;
      setChecking(false);
    };

    checkProfile();
  }, [user?.id, navigate]); // Only depend on user ID, not appUser to prevent store update loops

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Getting ready..." />
      </div>
    );
  }

  return <>{children || null}</>;
}
