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
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ForgotPasswordFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onBack?: () => void
}

export function ForgotPasswordForm({ className, onBack, ...props }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const redirectUrl = `${env.APP_URL}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900">
              <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              Password reset instructions sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-center">
                If an account exists with <strong>{email}</strong>, you will receive a password reset email shortly.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Check your inbox and spam folder. The link will expire in 1 hour.
            </p>
            {onBack ? (
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full cursor-pointer h-11"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            ) : (
              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer h-11"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 text-base"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full cursor-pointer h-11 text-base font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
              
              <div className="text-center pt-2">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Login
                  </button>
                ) : (
                  <Link 
                    to="/login"
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Login
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
