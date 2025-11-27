import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from './login-form';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';
import { toast } from 'sonner';

function EnhancedAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useSimpleAuth();

  // Redirect if already authenticated (login is public route, AuthGate doesn't run here)
  useEffect(() => {
    if (user) {
      // Check for redirect URL or pending game join
      const redirectUrl = searchParams.get('redirect');
      const pendingGameId = localStorage.getItem('pendingGameJoin');
      
      if (pendingGameId) {
        navigate(`/public/game/${pendingGameId}`, { replace: true });
      } else if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate, searchParams]);

  const handleEmailAuth = async (email: string, password: string, isSignUp: boolean) => {
    try {
      if (isSignUp) {
        // Use the existing signUp function which properly creates user profiles
        await signUp(email, password, { 
          name: email.split('@')[0], // Default name from email
          email 
        });
        toast.success('Check your email for confirmation link!');
      } else {
        await signIn(email, password);
        // User will be set by SimpleAuthProvider, useEffect above will redirect
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      throw error; // Re-throw so LoginForm can handle the error display
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm 
          onEmailAuth={handleEmailAuth}
          className="w-full"
        />
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default EnhancedAuth;
