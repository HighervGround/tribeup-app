import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple', options?: { pendingGameId?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUser: setAppUser, initializeAuth } = useAppStore();

  useEffect(() => {
    const DEBUG = typeof window !== 'undefined' && localStorage.getItem('DEBUG_AUTH') === '1';

    const getInitialSession = async () => {
      DEBUG && console.log('[Auth] bootstrap:loading=true');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          DEBUG && console.log('[Auth] Found session, loading profile...');
          
          // Load user profile in background - don't block auth completion
          SupabaseService.getUserProfile(session.user.id)
            .then(profile => {
              if (profile) {
                DEBUG && console.log('[Auth] Profile loaded:', profile.id);
                setAppUser(profile);
              }
            })
            .catch(error => {
              console.error('Error loading profile:', error);
              // Create a basic user object from auth data
              setAppUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email || '',
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '',
                avatar: session.user.user_metadata?.avatar_url || '',
                role: 'user' as const,
                preferences: { 
                  sports: [], 
                  notifications: { push: true, email: true, gameReminders: true },
                  theme: 'light',
                  highContrast: false,
                  largeText: false,
                  reducedMotion: false,
                  colorBlindFriendly: false,
                  privacy: {
                    locationSharing: true,
                    profileVisibility: 'public'
                  }
                }
              });
            });
        }
        
        // Don't call initializeAuth here to prevent loops
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
        DEBUG && console.log('[Auth] bootstrap:loading=false');
        console.log('[Auth] Initial auth check complete - user:', session?.user?.id || 'none');
      }
    }; 

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        DEBUG && console.log('[Auth] onAuthStateChange:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            DEBUG && console.log('[Auth] Load profile for:', session.user.id);
            const userProfile = await SupabaseService.getUserProfile(session.user.id);
            if (userProfile) {
              DEBUG && console.log('[Auth] Profile loaded:', userProfile.name);
              setAppUser(userProfile);
              
              // Don't call initializeAuth here to prevent loops
              
              // Check for pending game join after successful login
              const pendingGameId = localStorage.getItem('pendingGameJoin');
              if (pendingGameId) {
                localStorage.removeItem('pendingGameJoin');
                // Auto-join the game
                try {
                  const { joinGame } = useAppStore.getState();
                  await joinGame(pendingGameId);
                  toast.success('Welcome! You\'ve been automatically joined to the game.');
                } catch (joinError) {
                  console.error('Error auto-joining game:', joinError);
                  toast.error('Welcome! Please manually join the game you were interested in.');
                }
              } else {
                // Only redirect to home if we're not already on the onboarding page
                if (window.location.pathname === '/onboarding') {
                  DEBUG && console.log('[Auth] Onboarding page active');
                } else {
                  toast.success('Welcome back!');
                }
              }
            } else {
              DEBUG && console.log('[Auth] No profile found (ProfileCheck handles onboarding)');
              // Let the ProfileCheck component handle the redirect to onboarding
              // This prevents multiple redirects
            }
          } catch (error) {
            console.error('Error loading user profile on sign in:', error);
            // Let the ProfileCheck component handle the redirect to onboarding
          }
        } else if (event === 'SIGNED_OUT') {
          setAppUser(null);
          toast.success('Signed out successfully');
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.info('Check your email for password reset instructions');
        } else if (event === 'USER_UPDATED') {
          // Handle user updates if needed
          DEBUG && console.log('[Auth] User updated:', session?.user?.id);
        }

        // Ensure we don't hang in loading after any event
        setLoading(false);
        DEBUG && console.log('[Auth] onAuthStateChange:loading=false');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setAppUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            username: userData.name?.toLowerCase().replace(/\s+/g, '_'),
            pending_game_id: userData.pendingGameId, // Store game ID for auto-join
            phone: userData.phone
          }
        }
      });

      if (error) throw error;

      // Create user profile immediately if signup was successful
      if (data.user) {
        try {
          await SupabaseService.createUserProfile(data.user.id, {
            email: data.user.email,
            name: userData.name,
            phone: userData.phone
          });
          
          // If there's a pending game ID, auto-join after profile creation
          if (userData.pendingGameId) {
            // Store in localStorage for after email confirmation
            localStorage.setItem('pendingGameJoin', userData.pendingGameId);
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw here, as the user account was created successfully
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple', options?: { pendingGameId?: string }) => {
    try {
      // Use the correct redirect URL for production
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/auth/callback`;
      
      console.log(`🔐 OAuth Debug - Starting ${provider} OAuth flow`);
      console.log(`🔐 Base URL: ${baseUrl}`);
      console.log(`🔐 Redirect URL: ${redirectTo}`);
      console.log(`🔐 Supabase URL: ${supabase.supabaseUrl}`);
      
      // Store pending game ID if provided
      if (options?.pendingGameId) {
        localStorage.setItem('pendingGameJoin', options.pendingGameId);
      }
      
      console.log(`🔐 Calling supabase.auth.signInWithOAuth...`);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      console.log(`🔐 OAuth response:`, { data, error });

      if (error) {
        console.error('❌ OAuth initiation error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText
        });
        throw error;
      }
      
      console.log(`✅ OAuth redirect initiated for ${provider}`);
      console.log(`🔐 OAuth URL:`, data?.url);
    } catch (error: any) {
      console.error('❌ OAuth sign in error:', error);
      throw new Error(error.message || `Failed to sign in with ${provider}`);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear app state
      setUser(null);
      setAppUser(null);
      
      // Clear any stored data
      localStorage.removeItem('pendingGameJoin');
      
      console.log('Sign out successful');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


