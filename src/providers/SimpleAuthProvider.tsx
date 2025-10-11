import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';

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
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔐 [SimpleAuthProvider] Initializing auth...');
        
        // Add timeout to prevent infinite loading on refresh
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn('⚠️ [SimpleAuthProvider] Auth initialization timeout - forcing completion');
            setLoading(false);
            setConnectionError(true);
          }
        }, 8000); // 8 second timeout

        // Get initial session with retry logic
        let session = null;
        let error = null;
        
        try {
          const result = await supabase.auth.getSession();
          session = result.data.session;
          error = result.error;
        } catch (getSessionError) {
          console.warn('⚠️ [SimpleAuthProvider] getSession failed, trying to recover from localStorage');
          
          // Try to recover session from localStorage as fallback
          const storedSession = localStorage.getItem('tribeup-auth');
          if (storedSession) {
            try {
              const parsedSession = JSON.parse(storedSession);
              if (parsedSession && parsedSession.access_token) {
                console.log('🔄 [SimpleAuthProvider] Attempting session recovery from localStorage');
                // Let the auth state change listener handle the session
              }
            } catch (parseError) {
              console.error('Failed to parse stored session:', parseError);
            }
          }
          error = getSessionError;
        }
        
        if (!mounted) return;
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        if (error && !session) {
          console.error('Auth initialization error:', error);
          setConnectionError(true);
          // Don't return - still try to set state
        }

        console.log('🔐 [SimpleAuthProvider] Session retrieved:', session ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

        // Update state
        setSession(session);
        setUser(session?.user ?? null);
        setConnectionError(false);

        // Handle user profile (only if we have a user)
        if (session?.user) {
          await handleUserProfile(session.user);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setConnectionError(true);
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
      if (timeoutId) clearTimeout(timeoutId);
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

  // Show connection error if auth initialization failed
  if (connectionError && !loading) {
    return (
      <SimpleAuthContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-6">
            <div className="text-destructive text-lg font-semibold">Connection Error</div>
            <p className="text-muted-foreground max-w-md">
              Unable to connect to authentication service. Please check your internet connection and try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </SimpleAuthContext.Provider>
    );
  }

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
