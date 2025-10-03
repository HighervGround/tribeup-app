import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './login-form';
import { useSimpleAuth } from '../providers/SimpleAuthProvider';
import { SupabaseService } from '../lib/supabaseService';
import { toast } from 'sonner';

function EnhancedAuth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useSimpleAuth();

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
        // Navigation will be handled by AuthProvider
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
