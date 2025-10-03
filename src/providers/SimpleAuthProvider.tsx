import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';
import { AuthFallback } from '../components/AuthFallback';

interface SimpleAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const { setUser: setAppUser } = useAppStore();

  // SINGLE useEffect - no race conditions
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Auth initialization error:', error);
          return;
        }

        // Update state
        setSession(session);
        setUser(session?.user ?? null);

        // Handle user profile (only if we have a user)
        if (session?.user) {
          await handleUserProfile(session.user);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Handle user profile creation/loading
    const handleUserProfile = async (user: User) => {
      try {
        // Check if profile exists
        let profile = await SupabaseService.getUserProfile(user.id);
        
        if (!profile) {
          // Create profile if it doesn't exist (prevents orphaned users!)
          console.log('Creating missing user profile for:', user.id);
          await SupabaseService.createUserProfile(user.id, {
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${Date.now()}`,
            avatar: user.user_metadata?.avatar_url || '',
          });
          
          // Fetch the newly created profile
          profile = await SupabaseService.getUserProfile(user.id);
        }
        
        // Update app store with complete profile
        if (profile && mounted) {
          setAppUser(profile);
        }
      } catch (error) {
        console.error('Profile handling error:', error);
        // Create basic user object as fallback
        if (mounted) {
          setAppUser({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            username: user.email?.split('@')[0] || 'user',
            avatar: user.user_metadata?.avatar_url || '',
            role: 'user',
            preferences: {
              theme: 'auto',
              highContrast: false,
              largeText: false,
              reducedMotion: false,
              colorBlindFriendly: false,
              notifications: { push: true, email: false, gameReminders: true },
              privacy: { locationSharing: true, profileVisibility: 'public' },
              sports: []
            }
          });
        }
      }
    };

    // Initialize
    initializeAuth();

    // Listen for auth changes - SIMPLE, no async operations inside
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Update state immediately
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle profile for new sessions
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserProfile(session.user);
          toast.success('Welcome!');
        } else if (event === 'SIGNED_OUT') {
          setAppUser(null);
          toast.success('Signed out successfully');
        }
        
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // No dependencies needed - everything is handled inside

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.name,
          username: userData.name?.toLowerCase().replace(/\s+/g, '_'),
        }
      }
    });
    if (error) throw error;
    
    // Profile will be created automatically by the auth listener
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}
