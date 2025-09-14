import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing OAuth callback...');
        
        // Handle the OAuth callback with Supabase - this processes the URL hash/fragment
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthCallback] Session error:', error);
          toast.error('Authentication failed');
          navigate('/auth', { replace: true });
          return;
        }

        if (data.session) {
          console.log('[AuthCallback] Session found, user authenticated');
          
          // Check for pending game join
          const pendingGameId = localStorage.getItem('pendingGameJoin');
          if (pendingGameId) {
            console.log('[AuthCallback] Redirecting to pending game:', pendingGameId);
            localStorage.removeItem('pendingGameJoin');
            navigate(`/game/${pendingGameId}`, { replace: true });
          } else {
            console.log('[AuthCallback] Redirecting to home');
            navigate('/', { replace: true });
          }
        } else {
          console.log('[AuthCallback] No session found, checking URL for auth data...');
          
          // If no session, try to handle the OAuth callback from URL
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          
          if (urlParams.get('code') || hashParams.get('access_token')) {
            console.log('[AuthCallback] OAuth data found in URL, waiting for session...');
            // Wait a bit for Supabase to process the OAuth callback
            setTimeout(async () => {
              const { data: retryData, error: retryError } = await supabase.auth.getSession();
              if (retryData.session) {
                console.log('[AuthCallback] Session found on retry');
                navigate('/', { replace: true });
              } else {
                console.error('[AuthCallback] Still no session after retry:', retryError);
                navigate('/auth', { replace: true });
              }
            }, 2000);
          } else {
            console.log('[AuthCallback] No OAuth data in URL');
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error('[AuthCallback] Unexpected error:', error);
        toast.error('Authentication failed');
        navigate('/auth', { replace: true });
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('[AuthCallback] Timeout - redirecting to auth');
      toast.error('Authentication timed out');
      navigate('/auth', { replace: true });
    }, 10000); // 10 second timeout

    handleAuthCallback().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <h2 className="text-xl font-semibold">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account</p>
      </div>
    </div>
  );
}

export default AuthCallback;
