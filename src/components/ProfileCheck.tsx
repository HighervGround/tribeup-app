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
      
      // IMMEDIATE EXIT CONDITIONS - Set checking to false immediately
      hasChecked.current = true;
      
      // Don't check if we're already on the onboarding page
      if (window.location.pathname === '/onboarding') {
        console.log('ProfileCheck: Already on onboarding page, skipping check');
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
        setChecking(false);
        return;
      }

      // Check if user is authenticated
      if (!user) {
        console.log('ProfileCheck: No authenticated user found');
        setChecking(false);
        // Don't redirect to onboarding if not authenticated - let ProtectedRoute handle this
        return;
      }
      
      console.log('ProfileCheck: User is authenticated, checking profile...');

      try {
        // Get fresh user data from store to avoid dependency issues
        const currentAppUser = useAppStore.getState().user;
        
        // If we already have user data in the store (like from OAuth), use it directly
        if (currentAppUser) {
          console.log('ProfileCheck: Found user in store, skipping database check');
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
            console.log('ProfileCheck: User data:', currentAppUser);
            setChecking(false);
            return;
          }
          
          if (!hasRequiredData) {
            console.log('ProfileCheck: App user data incomplete, checking if we should redirect to onboarding');
            // Only redirect if we're not already on the onboarding page
            if (window.location.pathname !== '/onboarding') {
              console.log('ProfileCheck: Redirecting to onboarding');
              setChecking(false);
              navigate('/onboarding', { 
                replace: true,
                state: { fromProfileCheck: true }
              });
              return;
            } else {
              console.log('ProfileCheck: Already on onboarding page, not redirecting');
            }
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
            setChecking(false);
            navigate('/onboarding', { replace: true });
            return;
          }
          
          // For existing users, be more lenient - if they have an ID and email, let them through
          const hasBasicData = (userProfile as any)?.id && (userProfile as any)?.email;
          if (hasBasicData) {
            console.log('ProfileCheck: User has basic data, allowing access');
            setChecking(false);
            return;
          }
          
          // Only redirect if truly incomplete
          if (!(userProfile as any).name && !(userProfile as any).username) {
            console.log('ProfileCheck: Profile incomplete (no name or username), redirecting to onboarding');
            setChecking(false);
            navigate('/onboarding', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('ProfileCheck: Error checking profile:', error);
        setChecking(false);
        // Don't redirect on error, just continue to prevent infinite loops
        return;
      }

      console.log('ProfileCheck: Profile check complete, rendering children');
      setChecking(false);
    };

    // Add a small delay to prevent race conditions, but also add a safety timeout
    const timeoutId = setTimeout(checkProfile, 100);
    
    // Safety timeout - if checkProfile doesn't complete in 3 seconds, force completion
    const safetyTimeout = setTimeout(() => {
      console.warn('ProfileCheck: Safety timeout - forcing completion');
      hasChecked.current = true;
      setChecking(false);
    }, 3000);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(safetyTimeout);
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
      </div>
    );
  }

  console.log('ProfileCheck: Check complete - rendering children');

  return <>{children || null}</>;
}
