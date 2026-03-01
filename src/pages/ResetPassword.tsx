import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react'
import * as authService from '../services/authService'

interface ResetPasswordFormData {
  newPassword: string
  confirmPassword: string
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [checkingToken, setCheckingToken] = useState(true)
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormData>()

  useEffect(() => {
    // Normalize URL if it has double slashes
    const currentPath = window.location.pathname
    if (currentPath.includes('//')) {
      const normalizedPath = currentPath.replace(/\/+/g, '/')
      if (normalizedPath !== currentPath) {
        window.history.replaceState({}, '', normalizedPath + window.location.search)
      }
    }

    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      toast({
        title: 'Invalid Link',
        description: 'Password reset link is invalid or missing.',
        variant: 'destructive',
      })
      navigate('/auth/forgot-password')
      setCheckingToken(false)
      return
    }
    
    setToken(tokenParam)
    setCheckingToken(false)
  }, [searchParams, navigate, toast])

  const newPassword = watch('newPassword')

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Reset token is missing.',
        variant: 'destructive',
      })
      return
    }

    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      await authService.resetPassword(token, data.newPassword)
      setSuccess(true)
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now login with your new password.',
        variant: 'default',
      })
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login')
      }, 3000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to reset password'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth/login')}
              className="absolute top-4 left-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Lock className="h-6 w-6 text-primary" />
            <CardTitle>Reset Password</CardTitle>
          </div>
          <CardDescription>
            {success
              ? 'Your password has been reset successfully'
              : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 text-green-700 p-4 rounded-md">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Password Reset Successful!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can now login with your new password.
                </p>
              </div>
              <Button
                onClick={() => navigate('/auth/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  {...register('newPassword', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>

              <div className="text-center text-sm">
                <Link to="/auth/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
