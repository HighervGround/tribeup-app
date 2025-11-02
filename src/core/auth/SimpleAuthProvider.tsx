import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, transformUserFromDB } from '@/core/database/supabase';
import { SupabaseService } from '@/core/database/supabaseService';
import { useAppStore } from '@/store/appStore';
import { ProfileEnsurer } from '@/core/auth/ProfileEnsurer';
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
  const [profileCreationInProgress, setProfileCreationInProgress] = useState<Set<string>>(new Set());
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

        // Use Promise.race for timeout handling
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 8000)
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
          sessionError = timeoutError;
        }
        
        if (!mounted) return;
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        if (sessionError && !session) {
          console.error('Auth initialization error:', sessionError);
          // Don't set connection error for timeout - let auth listener handle it
          if (!(sessionError instanceof Error && sessionError.message === 'getSession timeout')) {
            setConnectionError(true);
          }
        }

        console.log('🔐 [SimpleAuthProvider] Session retrieved:', session ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

        // Update state (even if session is null)
        setSession(session);
        setUser(session?.user ?? null);
        setConnectionError(false);

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
        }
        setConnectionError(true);
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

        // Handle user profile creation/loading - OPTIMIZED VERSION
    const handleUserProfile = async (user: User) => {
      try {
        console.log('🔍 Handling user profile for authenticated user:', user.id);
        
        // Check if profile creation is already in progress
        if (profileCreationInProgress.has(user.id)) {
          console.log('🔄 Profile creation already in progress for user:', user.id);
          return;
        }
        
        // Create basic user object immediately for faster UI response
        const basicUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          username: user.user_metadata?.username || user.user_metadata?.preferred_username || user.email?.split('@')[0] || 'user',
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
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
        
        // Set basic user immediately
        if (mounted) {
          const currentUser = useAppStore.getState().user;
          if (!currentUser || currentUser.id !== user.id) {
            console.log('🔄 Setting basic user profile immediately:', user.id);
            setAppUser(basicUser);
          }
        }
        
        // Handle database profile creation synchronously to prevent race conditions
        (async () => {
          try {
            // Ensure we have a valid session before profile operations
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.warn('⚠️ No session found, cannot create profile');
              return;
            }
            
            // Check if profile exists
            let profile = await SupabaseService.getUserProfile(user.id);
            
            if (!profile) {
              console.log('🚨 No profile found - creating database profile');
              
              // Mark profile creation as in progress
              setProfileCreationInProgress(prev => new Set(prev).add(user.id));
              
              try {
                // Use the idempotent ensure_user_profile RPC function
                const profileParams = {
                  p_email: user.email || session.user.email,
                  p_username: user.user_metadata?.username || 
                             user.user_metadata?.preferred_username || 
                             user.email?.split('@')[0] || 
                             `user_${Date.now()}`,
                  p_full_name: user.user_metadata?.full_name || 
                              user.user_metadata?.name || 
                              user.email?.split('@')[0] || 
                              'User',
                  p_avatar_url: user.user_metadata?.avatar_url || 
                               user.user_metadata?.picture || 
                               null,
                };
                
                console.log('📝 Calling ensure_user_profile RPC with params:', profileParams);
                
                // Call the idempotent RPC function (prevents race conditions)
                const { data: newProfile, error } = await supabase
                  .rpc('ensure_user_profile', profileParams);
                  
                if (error) {
                  console.error('❌ Profile creation via RPC failed:', error);
                  throw error;
                } else {
                  console.log('✅ Profile created/updated via RPC successfully');
                  // RPC returns the full user row - use it directly
                  if (newProfile) {
                    profile = transformUserFromDB(newProfile as any);
                  } else {
                    profile = await SupabaseService.getUserProfile(user.id);
                  }
                }
              } finally {
                // Clear the in-progress flag
                setProfileCreationInProgress(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(user.id);
                  return newSet;
                });
              }
            }
            
            // Update app store with complete profile from database
            // Always update to ensure we have the latest full profile data (preferred_sports, bio, etc.)
            if (profile && mounted) {
              const currentUser = useAppStore.getState().user;
              // Only update if this is a different user OR if we don't have the same profile loaded
              // (profile from DB has more complete data than basic user object)
              if (!currentUser || currentUser.id !== profile.id) {
                console.log('🔄 Updating with complete user profile:', profile.id);
                setAppUser(profile);
              } else {
                // Same user - update if database profile has more complete data
                // Check if profile has sports/preferences that basic user doesn't have
                const hasMoreData = (
                  (profile.preferences?.sports?.length ?? 0) > 0 ||
                  profile.bio ||
                  profile.location ||
                  currentUser.preferences?.sports?.length === 0
                );
                
                if (hasMoreData) {
                  console.log('🔄 Updating profile with complete database data:', {
                    sports: profile.preferences?.sports,
                    bio: profile.bio,
                    location: profile.location
                  });
                  setAppUser(profile);
                }
              }
            }
          } catch (error) {
            console.error('Profile handling error:', error);
            // Keep using basic user object - profile creation is non-critical
          }
        })(); // Execute immediately without delay
        
      } catch (error) {
        console.error('Profile handling error:', error);
        // Create basic user object as fallback (only if no current user)
        if (mounted) {
          const currentUser = useAppStore.getState().user;
          if (!currentUser || currentUser.id !== user.id) {
            console.log('🔄 Setting fallback user profile:', user.id);
            setAppUser({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              username: user.user_metadata?.username || user.user_metadata?.preferred_username || user.email?.split('@')[0] || 'user',
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
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
        
        // Handle different auth events (with duplicate prevention)
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 User signed in via auth state listener');
          const currentUser = useAppStore.getState().user;
          if (!currentUser || currentUser.id !== session.user.id) {
            await handleUserProfile(session.user);
            toast.success('Welcome!');
          } else {
            console.log('🔄 User already set, skipping profile reload');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setAppUser(null);
          toast.success('Signed out successfully');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed, checking if profile update needed');
          const currentUser = useAppStore.getState().user;
          if (!currentUser || currentUser.id !== session.user.id) {
            await handleUserProfile(session.user);
          } else {
            console.log('🔄 Profile already current, skipping refresh update');
          }
        } else if (session?.user && !event) {
          // Initial session restoration
          console.log('🔄 Initial session restored via listener');
          const currentUser = useAppStore.getState().user;
          if (!currentUser || currentUser.id !== session.user.id) {
            await handleUserProfile(session.user);
          } else {
            console.log('🔄 User already restored, skipping duplicate restoration');
          }
        }
        
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
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
      {/* Use the React guard pattern for profile creation */}
      <ProfileEnsurer user={user} session={session} />
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
