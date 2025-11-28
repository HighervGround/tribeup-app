import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { X, Mail, User, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';

interface QuickJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameId: string;
  onJoinSuccess: () => void;
}

export function QuickJoinModal({ isOpen, onClose, gameTitle, gameId, onJoinSuccess }: QuickJoinModalProps) {
  const { signUp, signIn, signInWithOAuth } = useSimpleAuth();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuickSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create account with minimal info
      const result = await signUp(formData.email, 'temp-password-' + Date.now(), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        pendingGameId: gameId // Store which game they want to join
      });
      
      // If signup was successful and user is immediately authenticated (some providers do this)
      if (result?.session) {
        console.log('✅ User authenticated immediately after signup');
        toast.success('Account created! Joining game...');
        onJoinSuccess(); // Call success callback to join the game
      } else {
        // Email verification required
        setStep('verify');
        toast.success('Account created! Check your email to verify and join the game.');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result?.session) {
        console.log('✅ User logged in successfully');
        toast.success('Logged in! Joining game...');
        onJoinSuccess(); // Call success callback to join the game
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      setLoading(true);
      const result = await signInWithOAuth(provider, { pendingGameId: gameId });
      
      // If OAuth was successful, call the success callback
      if (result) {
        console.log('✅ OAuth login successful, joining game');
        toast.success(`Signed in with ${provider}! Joining game...`);
        onJoinSuccess(); // Call success callback to join the game
      } else {
        toast.info('Redirecting to login...');
        onClose();
      }
    } catch (error: any) {
      console.error('❌ Social login failed:', error);
      toast.error(error.message || 'Social login failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {step === 'form' ? (mode === 'signup' ? `Join "${gameTitle}"` : 'Login to Join') : 'Check Your Email'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {step === 'form' ? (
            <div className="space-y-4">
              {/* Social Login Options */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Signup/Login Form */}
              {mode === 'signup' ? (
                <form onSubmit={handleQuickSignup} className="space-y-3">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="pl-10"
                    />
                    <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                  
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="pl-10"
                    />
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                  
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                    />
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Join Game'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    By joining, you agree to our{' '}
                    <Link to="/legal/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/legal/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                  
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                  >
                    Already have an account? Log in
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="pl-10"
                    />
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                  
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="pl-10"
                    />
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login & Join Game'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                  >
                    Don't have an account? Sign up
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a verification link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the link to verify your account and automatically join "{gameTitle}"
                </p>
              </div>
              <Button variant="outline" onClick={onClose} className="w-full">
                Got it
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
