import { cn } from '@/shared/utils/utils'
import { supabase } from '@/core/database/supabase'
import { env } from '@/core/config/envUtils'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chrome, Mail, Eye, EyeOff, Apple } from 'lucide-react'

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onEmailAuth?: (email: string, password: string, isSignUp: boolean) => Promise<void>
  onForgotPassword?: () => void
}

export function LoginForm({ className, onEmailAuth, onForgotPassword, ...props }: LoginFormProps) {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  // Auto-show email form if method=email is in URL (coming from public game page)
  const [showEmailForm, setShowEmailForm] = useState(searchParams.get('method') === 'email')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // removed debugInfo state (dev diagnostics removed)

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true)
    setError(null)

    try {
      // Use the configured app URL for OAuth redirects to ensure provider sees consistent domain
      const redirectUrl = `${env.APP_URL}/auth/callback`;
      console.log('🔐 Starting OAuth flow with redirect:', redirectUrl);
      
      const oauthOptions: any = {
        redirectTo: redirectUrl,
      };
      
      // Add Google-specific options
      if (provider === 'google') {
        oauthOptions.queryParams = {
          access_type: 'offline',
          prompt: 'consent',
        };
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions
      })

      if (error) throw error
      // OAuth will redirect automatically
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onEmailAuth) return
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await onEmailAuth(email, password, isSignUp)
      if (isSignUp) {
        setSuccess('Check your email for confirmation link!')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // removed development-only diagnostics and session-clear helpers

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to TribeUp!</CardTitle>
          <CardDescription>Find your tribe and join the game</CardDescription>
        </CardHeader>
        <CardContent>
          {!showEmailForm ? (
            <div className="space-y-3">
              {/* Social Login Buttons */}
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full cursor-pointer h-11 text-base"
              >
                <Chrome className="mr-2 h-5 w-5" />
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
                className="w-full cursor-pointer h-11 text-base bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 border-black dark:border-white"
              >
                <Apple className="mr-2 h-5 w-5" />
                Continue with Apple
              </Button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email Button */}
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(true)}
                disabled={isLoading}
                className="w-full cursor-pointer h-11 text-base"
              >
                <Mail className="mr-2 h-5 w-5" />
                Continue with Email
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {/* diagnostics removed from UI */}
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    placeholder="Enter your full name"
                    className="h-11 text-base"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="h-11 text-base"
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="h-11 text-base pr-10"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {/* diagnostics removed from UI */}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                variant="default" 
                className="w-full cursor-pointer h-11 text-base font-semibold" 
                disabled={isLoading}
                style={{ backgroundColor: '#FA4616', color: 'white' }}
              >
                {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>

              <div className="text-center space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
                <br />
                {!isSignUp && onForgotPassword && (
                  <>
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Forgot your password?
                    </button>
                    <br />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Back to social login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
