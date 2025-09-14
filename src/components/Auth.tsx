import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../providers/AuthProvider';
import { toast } from 'sonner';
import { Apple, Chrome } from 'lucide-react';

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword, signInWithOAuth } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if we're coming from a password reset
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === 'true') {
      setIsResetPassword(true);
    }
  }, [location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isResetPassword) {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
        setIsResetPassword(false);
      } else if (isSignUp) {
        await signUp(email, password, { name, email });
        setSuccess('Check your email for confirmation link!');
      } else {
        await signIn(email, password);
        // Navigation will be handled by AuthProvider
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError('');
    try {
      await signInWithOAuth(provider);
    } catch (error: any) {
      console.error(`OAuth sign-in error for ${provider}:`, error);
      // Provide more user-friendly error messages
      if (error.message?.includes('popup')) {
        setError('Authentication popup was blocked. Please allow popups and try again.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('Network error during authentication. Please check your connection and try again.');
      } else {
        setError(`Authentication failed. Please try again or use email sign-in.`);
      }
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setIsSignUp(false);
    setIsResetPassword(false);
    setError('');
    setSuccess('');
  };

  const getTitle = () => {
    if (isResetPassword) return 'Reset Password';
    return isSignUp ? 'Create Account' : 'Sign In';
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (isResetPassword) return 'Send Reset Email';
    return isSignUp ? 'Sign Up' : 'Sign In';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          {!isResetPassword && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                  className="w-full"
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={loading}
                  className="w-full"
                >
                  <Apple className="mr-2 h-4 w-4" />
                  Apple
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center mb-4">
                Note: You may see browser warnings during OAuth sign-in. These are from external services and don't affect your account security.
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && !isResetPassword && (
              <div>
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            {!isResetPassword && (
              <div>
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isResetPassword}
                  placeholder="Enter your password"
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {getButtonText()}
            </Button>
          </form>


          <div className="mt-4 space-y-2 text-center">
            {!isResetPassword ? (
              <>
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-foreground block"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
                <button
                  onClick={() => setIsResetPassword(true)}
                  className="text-sm text-muted-foreground hover:text-foreground block"
                >
                  Forgot your password?
                </button>
              </>
            ) : (
              <button
                onClick={handleBackToSignIn}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Auth;
