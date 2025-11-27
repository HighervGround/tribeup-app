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
import { Chrome, Mail } from 'lucide-react'

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
  // removed debugInfo state (dev diagnostics removed)

  const handleSocialLogin = async (provider: 'google') => {
    setIsLoading(true)
    setError(null)

    try {
      // Use the configured app URL for OAuth redirects to ensure Google sees consistent domain
      const redirectUrl = `${env.APP_URL}/auth/callback`;
      console.log('🔐 Starting OAuth flow with redirect:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
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
            <div className="space-y-4">
              {/* Social Login Button */}
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full cursor-pointer"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>

              {/* Divider */}
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

              {/* Email Button */}
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(true)}
                disabled={isLoading}
                className="w-full cursor-pointer"
              >
                <Mail className="mr-2 h-4 w-4" />
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
                <div>
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
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
                className="w-full cursor-pointer" 
                disabled={isLoading}
                style={{ backgroundColor: '#FA4616', color: 'white' }}
              >
                {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>

              <div className="text-center space-y-2">
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
