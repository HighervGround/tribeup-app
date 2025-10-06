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
        // Increase timeout and rely more on auth state listener
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 8000) // Increased back to 8s
        );
        
        let session = null;
        let sessionError = null;
        
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          session = result.data?.session;
          sessionError = result.error;
          
          if (session) {
            console.log('✅ Session restored from getSession:', session.user?.id);
          }
        } catch (timeoutError) {
          console.warn('🚨 getSession timed out, will rely on auth state listener');
          // Don't set connection error - let auth state listener handle it
          // setConnectionError(true);
        }
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('Auth initialization error:', sessionError);
          // Don't return - continue with null session
        }

        // Update state (even if session is null)
        setSession(session);
        setUser(session?.user ?? null);

        // Handle user profile (only if we have a user and no connection error)
        if (session?.user && !connectionError) {
          try {
            await handleUserProfile(session.user);
          } catch (profileError) {
            console.warn('Profile loading failed, continuing anyway:', profileError);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (error instanceof Error && error.message === 'getSession timeout') {
          console.warn('🚨 Auth getSession timed out after 8s - continuing without session');
          setConnectionError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Force loading to false after 10 seconds regardless of auth state
    const forceLoadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('🚨 Force stopping auth loading after 10s');
        setLoading(false);
      }
    }, 10000);
    
    // Also try to get session from localStorage as backup
    try {
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession && !session) {
        console.log('🔍 Found stored session, will wait for auth listener');
        // Don't set loading to false yet - let the auth listener handle it
      }
    } catch (error) {
      console.warn('Could not check localStorage for session:', error);
    }

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
        
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        // Update state immediately
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle different auth events
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 User signed in via auth state listener');
          await handleUserProfile(session.user);
          toast.success('Welcome!');
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setAppUser(null);
          toast.success('Signed out successfully');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed, updating profile');
          await handleUserProfile(session.user);
        } else if (session?.user && !event) {
          // Initial session restoration
          console.log('🔄 Initial session restored via listener');
          await handleUserProfile(session.user);
        }
        
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(forceLoadingTimeout);
    };
  }, []); // No dependencies needed - everything is handled inside

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('SignIn failed - network issue:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      throw error;
    }
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
