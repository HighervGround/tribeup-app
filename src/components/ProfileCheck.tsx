import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useAppStore } from '../store/appStore';
import { SupabaseService } from '../lib/supabaseService';
import { LoadingSpinner } from './ui/loading-spinner';
import { User } from '@supabase/supabase-js';
import { envConfig } from '../lib/envConfig';

interface ProfileCheckProps {
  children?: React.ReactNode;
}

export function ProfileCheck({ children = null }: ProfileCheckProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: appUser } = useAppStore();
  const [checking, setChecking] = useState(true);
  const hasChecked = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      // Prevent multiple checks
      if (hasChecked.current) {
        console.log('ProfileCheck: Already checked, skipping');
        setChecking(false);
        return;
      }
      
      console.log('ProfileCheck: Starting profile check');
      console.log('ProfileCheck: Current user from auth:', user);
      console.log('ProfileCheck: Current app user from store:', appUser);
      console.log('ProfileCheck: Current pathname:', window.location.pathname);
      
      // Don't check if we're already on the onboarding page
      if (window.location.pathname === '/onboarding') {
        console.log('ProfileCheck: Already on onboarding page, skipping check');
        hasChecked.current = true;
        setChecking(false);
        return;
      }
      
      // Get current location state - check both React Router state and history state
      const locationState = window.history.state?.usr || window.history.state || {};
      console.log('ProfileCheck: Current location state:', locationState);
      console.log('ProfileCheck: Full history state:', window.history.state);
      
      // If we just completed onboarding, don't check again
      if (locationState.fromOnboarding) {
        console.log('ProfileCheck: Just completed onboarding, skipping check');
        hasChecked.current = true;
        setChecking(false);
        return;
      }

      if (!user) {
        console.log('ProfileCheck: No authenticated user found - user needs to sign in');
        console.log('ProfileCheck: Redirecting to auth page');
        hasChecked.current = true;
        setChecking(false);
        // Don't redirect to onboarding if not authenticated - let ProtectedRoute handle this
        return;
      }

      try {
        // Get fresh user data from store to avoid dependency issues
        const currentAppUser = useAppStore.getState().user;
        
        // If we already have user data in the store, check if it's complete
        if (currentAppUser) {
          // Check if we have the required user data - be more lenient with existing users
          const hasRequiredData = currentAppUser.name && currentAppUser.email;
          const hasBasicProfile = currentAppUser.id && currentAppUser.email;
          
          console.log('ProfileCheck: Profile check', { 
            hasRequiredData, 
            hasBasicProfile, 
            name: currentAppUser.name,
            email: currentAppUser.email,
            id: currentAppUser.id
          });
          
          // If user has basic profile (id + email), consider them valid even without full name
          if (hasBasicProfile) {
            console.log('ProfileCheck: User has basic profile, allowing access');
            hasChecked.current = true;
            setChecking(false);
            return;
          }
          
          if (!hasRequiredData) {
            console.log('ProfileCheck: App user data incomplete, checking if we should redirect to onboarding');
            // Only redirect if we're not already on the onboarding page
            if (window.location.pathname !== '/onboarding') {
              console.log('ProfileCheck: Redirecting to onboarding');
              hasChecked.current = true;
              setChecking(false);
              navigate('/onboarding', { 
                replace: true,
                state: { fromProfileCheck: true }
              });
              return;
            } else {
              console.log('ProfileCheck: Already on onboarding page, not redirecting');
            }
            hasChecked.current = true;
            setChecking(false);
            return;
          }
        } else {
          console.log('ProfileCheck: Loading user profile from Supabase');
          // Try to load user profile with timeout (reduced from 10s to 5s)
          const profilePromise = SupabaseService.getUserProfile(user.id);
          const timeoutPromise = new Promise((_, reject) => {
            checkTimeoutRef.current = setTimeout(() => {
              reject(new Error('Profile check timeout'));
            }, envConfig.get('profileCheckTimeout'));
          });
          
          const userProfile = await Promise.race([profilePromise, timeoutPromise]);
          
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
            checkTimeoutRef.current = null;
          }
          
          console.log('ProfileCheck: Loaded user profile', userProfile);
          
          if (!userProfile) {
            // Profile doesn't exist, redirect to onboarding
            console.log('ProfileCheck: Profile missing, redirecting to onboarding');
            hasChecked.current = true;
            setChecking(false);
            navigate('/onboarding', { replace: true });
            return;
          }
          
          // For existing users, be more lenient - if they have an ID and email, let them through
          const hasBasicData = (userProfile as any)?.id && (userProfile as any)?.email;
          if (hasBasicData) {
            console.log('ProfileCheck: User has basic data, allowing access');
            hasChecked.current = true;
            setChecking(false);
            return;
          }
          
          // Only redirect if truly incomplete
          if (!(userProfile as any).name && !(userProfile as any).username) {
            console.log('ProfileCheck: Profile incomplete (no name or username), redirecting to onboarding');
            hasChecked.current = true;
            setChecking(false);
            navigate('/onboarding', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('ProfileCheck: Error checking profile:', error);
        hasChecked.current = true;
        setChecking(false);
        // Don't redirect on error, just continue to prevent infinite loops
        return;
      }

      console.log('ProfileCheck: Profile check complete, rendering children');
      hasChecked.current = true;
      setChecking(false);
    };

    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(checkProfile, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [user?.id, navigate]); // Only depend on user ID, not appUser to prevent store update loops

  // Force timeout to prevent infinite loading - more aggressive
  useEffect(() => {
    const forceTimeout = setTimeout(() => {
      if (checking) {
        console.warn(`ProfileCheck: Force timeout after ${envConfig.get('profileForceTimeout')}ms - allowing access`);
        hasChecked.current = true;
        setChecking(false);
      }
    }, envConfig.get('profileForceTimeout'));

    // Additional emergency timeout
    const emergencyTimeout = setTimeout(() => {
      console.error('ProfileCheck: Emergency timeout - forcing app to load');
      hasChecked.current = true;
      setChecking(false);
    }, 20000); // 20 seconds emergency timeout

    return () => {
      clearTimeout(forceTimeout);
      clearTimeout(emergencyTimeout);
    };
  }, [checking]);

  if (checking) {
    console.log('ProfileCheck: Still checking - rendering loading spinner');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Getting ready..." />
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
          Debug: ProfileCheck loading... (Check console for details)
        </div>
      </div>
    );
  }

  console.log('ProfileCheck: Check complete - rendering children');

  return <>{children || null}</>;
}
