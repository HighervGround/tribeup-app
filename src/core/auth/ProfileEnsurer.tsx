import { useEffect } from 'react';
import { useEnsureProfileOnLogin } from '@/shared/hooks/useEnsureProfile';
import { useAppStore } from '@/store/appStore';
import { User } from '@supabase/supabase-js';

interface ProfileEnsurerProps {
  user: User | null;
  session: any;
}

// Component that ensures user profile exists using the React guard pattern
export function ProfileEnsurer({ user, session }: ProfileEnsurerProps) {
  const { setUser: setAppUser } = useAppStore();

  // Use the React guard pattern hook
  const { ready, error } = useEnsureProfileOnLogin({
    email: user?.email || session?.user?.email,
    username: user?.user_metadata?.username || user?.email?.split('@')[0] || `user_${Date.now()}`,
    full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    avatar_url: user?.user_metadata?.avatar_url || null,
    userId: user?.id,
    enabled: !!user && !!session, // Only run when authenticated
  });

  // Update app store when profile is ready
  useEffect(() => {
    if (ready && user) {
      console.log('🔄 Profile ensured, updating app store...');
      
      // Create basic user object for app store
      const appUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        avatar: user.user_metadata?.avatar_url || '',
        role: 'user' as const,
        preferences: {
          theme: 'auto' as const,
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          colorBlindFriendly: false,
          notifications: { push: true, email: false, gameReminders: true },
          privacy: { locationSharing: true, profileVisibility: 'public' as const },
          sports: []
        }
      };

      setAppUser(appUser);
    }
  }, [ready, user, setAppUser]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('❌ Profile creation failed:', error);
    }
  }, [error]);

  // This component doesn't render anything
  return null;
}
