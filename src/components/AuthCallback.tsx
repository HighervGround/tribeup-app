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
        // Handle the OAuth callback
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

        // Check if user profile exists
        let userProfile = await SupabaseService.getUserProfile(user.id);
        
        if (!userProfile) {
          // Create profile for OAuth user
          console.log('Creating profile for OAuth user...');
          
          const profileData = {
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
            selectedSports: []
          };

          try {
            await SupabaseService.createUserProfile(user.id, profileData);
            userProfile = await SupabaseService.getUserProfile(user.id);
          } catch (profileError) {
            console.error('Error creating OAuth user profile:', profileError);
            // Continue with basic user data
            userProfile = {
              id: user.id,
              email: user.email || '',
              name: profileData.name,
              username: profileData.username,
              avatar: profileData.avatar,
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
          }
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
          // Check if profile is complete
          const isComplete = userProfile.name && userProfile.username;
          if (!isComplete) {
            setTimeout(() => navigate('/onboarding'), 1500);
          } else {
            setTimeout(() => navigate('/'), 1500);
          }
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
