import { useEffect, useRef, useState } from 'react';
import { ensureUserProfile, checkUserProfileExists } from '@/domains/users/services/profileService';

// React guard pattern for profile creation
export function useEnsureProfileOnLogin({ 
  email, 
  username, 
  full_name, 
  avatar_url,
  userId,
  enabled = true
}: {
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string | null;
  userId?: string;
  enabled?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Only proceed if we have required data and it's enabled
    if (!enabled || !email || !username || !full_name || !userId) {
      return;
    }

    (async () => {
      if (inFlight.current) {
        console.log('🔄 Profile creation already in flight, skipping');
        return;
      }

      inFlight.current = true;
      setError(null);

      try {
        console.log('🔍 Checking if profile exists for user:', userId);
        
        // Optional: check if profile exists already to skip RPC
        const profileExists = await checkUserProfileExists(userId);
        if (profileExists) {
          console.log('✅ Profile already exists, skipping creation');
          if (mounted) setReady(true);
          return;
        }

        console.log('🔧 Profile missing, creating via RPC...');
        await ensureUserProfile({ 
          email, 
          username, 
          full_name, 
          avatar_url 
        });

        if (mounted) {
          console.log('✅ Profile creation completed successfully');
          setReady(true);
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Profile creation failed');
        console.error('❌ ensureUserProfile failed:', error);
        if (mounted) {
          setError(error);
        }
      } finally {
        inFlight.current = false;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [email, username, full_name, avatar_url, userId, enabled]);

  return { ready, error, inFlight: inFlight.current };
}
