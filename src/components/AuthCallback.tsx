import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from './ui/loading-spinner';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const { setUser } = useAppStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle OAuth callback properly
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');
          return;
        }

        if (!data.session?.user) {
          setStatus('error');
          setMessage('No user session found');
          return;
        }

        const user = data.session.user;
        console.log('OAuth user authenticated:', user.id);

        // Create user profile from OAuth data
        const userProfile = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          username: user.user_metadata?.preferred_username || 
                   user.user_metadata?.user_name || 
                   user.email?.split('@')[0] || 
                   `user_${Math.random().toString(36).substring(2, 10)}`,
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          bio: '',
          location: '',
          role: 'user' as const,
          preferences: {
            theme: 'auto' as const,
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            colorBlindFriendly: false,
            notifications: {
              push: true,
              email: false,
              gameReminders: true,
            },
            privacy: {
              locationSharing: true,
              profileVisibility: 'public' as const,
            },
            sports: []
          }
        };

        // Try to create user profile in database to avoid orphaned users
        try {
          // Check if user profile already exists
          const existingProfile = await SupabaseService.getUserProfile(user.id);
          
          if (!existingProfile) {
            // Create user profile in database
            console.log('Creating user profile for OAuth user:', user.id);
            await SupabaseService.createUserProfile(user.id, {
              email: userProfile.email,
              full_name: userProfile.name,
              username: userProfile.username,
              avatar_url: userProfile.avatar,
              bio: userProfile.bio,
              location: userProfile.location
            });
            console.log('✅ User profile created successfully');
          } else {
            console.log('✅ User profile already exists');
            // Check if profile has been customized (not just default Google data)
            const hasCustomData = existingProfile.bio || 
                                 (existingProfile.preferences?.sports?.length || 0) > 0 ||
                                 (existingProfile.name !== user.user_metadata?.full_name);
            
            if (!hasCustomData) {
              console.log('Profile exists but appears to be default Google data, may need onboarding');
            }
            
            // Use existing profile data
            setUser(existingProfile);
            setStatus('success');
            setMessage('Welcome back! Redirecting...');
            
            // Redirect logic for existing users
            const pendingGameId = localStorage.getItem('pendingGameJoin');
            if (pendingGameId) {
              localStorage.removeItem('pendingGameJoin');
              setTimeout(() => navigate(`/game/${pendingGameId}`), 1500);
            } else {
              setTimeout(() => navigate('/'), 1500);
            }
            return;
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue with OAuth data even if profile creation fails
          console.log('⚠️ Using OAuth data without database profile');
        }

        // Set user in app store
        setUser(userProfile);
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Check for pending game join
        const pendingGameId = localStorage.getItem('pendingGameJoin');
        if (pendingGameId) {
          localStorage.removeItem('pendingGameJoin');
          // Redirect to game page
          setTimeout(() => navigate(`/game/${pendingGameId}`), 1500);
        } else {
          // For new OAuth users, always go through onboarding to set sport preferences
          // Even though they have name/username from OAuth, they need to select sports
          setTimeout(() => navigate('/onboarding'), 1500);
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, setUser, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <LoadingSpinner size="lg" />
                <h2 className="text-xl font-semibold">Completing Sign In</h2>
                <p className="text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-semibold text-green-700">Success!</h2>
                <p className="text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold text-red-700">Authentication Error</h2>
                <Alert variant="destructive">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Redirecting to sign in page...
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthCallback;
