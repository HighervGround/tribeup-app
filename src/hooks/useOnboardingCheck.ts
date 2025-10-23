import { useState, useEffect } from 'react';
import { useSimpleAuth } from '../providers/SimpleAuthProvider';
import { SupabaseService } from '../lib/supabaseService';

export interface OnboardingStatus {
  needsOnboarding: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check if a user needs onboarding
 * A user needs onboarding if:
 * 1. They don't have a complete profile in the database
 * 2. They haven't selected any sports preferences
 * 3. They haven't completed the onboarding flow
 */
export function useOnboardingCheck(): OnboardingStatus {
  const { user, loading: authLoading } = useSimpleAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) {
        setIsLoading(true);
        return;
      }

      if (!user) {
        setNeedsOnboarding(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if user has a complete profile
        const profile = await SupabaseService.getUserProfile(user.id);
        
        if (!profile) {
          console.log('🔍 No profile found - user needs onboarding');
          setNeedsOnboarding(true);
          setIsLoading(false);
          return;
        }

        // Check if user has completed onboarding using the database field
        const hasCompletedOnboarding = (profile as any).onboarding_completed === true;

        console.log('🔍 Onboarding check results:', {
          userId: user.id,
          hasProfile: !!profile,
          onboarding_completed: (profile as any).onboarding_completed,
          needsOnboarding: !hasCompletedOnboarding
        });

        setNeedsOnboarding(!hasCompletedOnboarding);
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check onboarding status');
        // If we can't check, assume they need onboarding to be safe
        setNeedsOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading]);

  return {
    needsOnboarding,
    isLoading,
    error
  };
}
