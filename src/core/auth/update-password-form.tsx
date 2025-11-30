import { cn } from '@/shared/utils/utils'
import { supabase } from '@/core/database/supabase'
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
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Password validation
  const passwordValidation = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  }
  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasLetter
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate password
    if (!isPasswordValid) {
      setError('Password must be at least 8 characters and contain letters and numbers')
      setIsLoading(false)
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      setSuccess(true)
      
      // Redirect to app after 2 seconds
      setTimeout(() => {
        navigate('/app')
      }, 2000)
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
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-center">Password Updated!</CardTitle>
            <CardDescription className="text-center">
              Your password has been successfully changed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription className="text-center">
                Redirecting you to the app...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Password</CardTitle>
            <CardDescription>
              Choose a strong password to secure your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 text-base pr-10"
                    autoComplete="new-password"
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
                
                {/* Password requirements */}
                {password.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className={cn(
                      "flex items-center gap-2 text-xs",
                      passwordValidation.minLength ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    )}>
                      {passwordValidation.minLength ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      At least 8 characters
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 text-xs",
                      passwordValidation.hasLetter ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    )}>
                      {passwordValidation.hasLetter ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Contains letters
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 text-xs",
                      passwordValidation.hasNumber ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    )}>
                      {passwordValidation.hasNumber ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Contains numbers
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 text-base pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {confirmPassword.length > 0 && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs mt-1",
                    passwordsMatch ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {passwordsMatch ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full cursor-pointer h-11 text-base font-semibold" 
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
              >
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
