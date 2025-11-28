import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/core/database/supabase';
import { SupabaseService } from '@/core/database/supabaseService';
import { useAppStore } from '@/store/appStore';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
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
        // Log all query params for debugging
        const params = Object.fromEntries(searchParams.entries());
        console.log('[AuthCallback] Query params:', params);
        // Log localStorage keys for debugging
        const lsKeys = Object.keys(localStorage);
        console.log('[AuthCallback] LocalStorage keys:', lsKeys);

        // Attempt to get session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthCallback] getSession error:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');
          return;
        }

        if (!data.session?.user) {
          // Log PKCE code verifier and any code param
          const codeVerifier = localStorage.getItem('tribeup-auth-code-verifier');
          console.log('[AuthCallback] PKCE code verifier:', codeVerifier);
          console.log('[AuthCallback] No user session found. Params:', params);
          setStatus('error');
          setMessage('No user session found');
          return;
        }

        const user = data.session.user;
        console.log('[AuthCallback] OAuth user authenticated:', user.id);

        // Create optimized user profile from OAuth data
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

        // Set user immediately for faster UI response
        setUser(userProfile);
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        // Track OAuth sign in
        const { analyticsService } = await import('@/core/analytics/analyticsService');
        analyticsService.trackEvent('sign_in', {
          method: 'oauth',
          provider: user.app_metadata?.provider || 'unknown',
        });

        // Handle profile creation asynchronously (non-blocking)
        setTimeout(async () => {
          try {
            // Check if user profile already exists
            const existingProfile = await SupabaseService.getUserProfile(user.id);
            if (!existingProfile) {
              // Create user profile in database (non-blocking)
              console.log('[AuthCallback] Creating user profile for OAuth user:', user.id);
              await SupabaseService.createUserProfile(user.id, {
                email: userProfile.email,
                full_name: userProfile.name,
                username: userProfile.username,
                avatar_url: userProfile.avatar,
                bio: userProfile.bio,
                location: userProfile.location
              });
              console.log('[AuthCallback] User profile created successfully');
            } else {
              console.log('[AuthCallback] User profile already exists');
              // Update app store with complete profile data
              setUser(existingProfile);
            }
          } catch (profileError) {
            console.error('[AuthCallback] Error creating user profile:', profileError);
            // Continue with OAuth data - profile creation is non-critical
            console.log('[AuthCallback] Using OAuth data without database profile');
          }
        }, 100); // Small delay to allow UI to update first

        // Check for pending game join and automatically join the game
        const pendingGameId = localStorage.getItem('pendingGameJoin');
        if (pendingGameId) {
          try {
            console.log('[AuthCallback] Auto-joining game after authentication:', pendingGameId);
            setMessage('Joining activity...');
            
            // Join the game using authenticated RPC
            await SupabaseService.joinGame(pendingGameId);
            
            console.log('[AuthCallback] Successfully joined game');
            localStorage.removeItem('pendingGameJoin');
            
            // Redirect to public game page to show success state
            setTimeout(() => navigate(`/public/game/${pendingGameId}`), 800);
          } catch (joinError: any) {
            console.error('[AuthCallback] Failed to join game:', joinError);
            // Still redirect but user will see error on game page
            localStorage.removeItem('pendingGameJoin');
            setTimeout(() => navigate(`/public/game/${pendingGameId}`), 800);
          }
        } else {
          // Send authenticated users to the app layout, not public landing
          setTimeout(() => navigate('/app'), 800);
        }

      } catch (error) {
        console.error('[AuthCallback] Exception:', error);
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
