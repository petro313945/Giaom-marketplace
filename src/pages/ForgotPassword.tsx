import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'
import * as authService from '../services/authService'

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true)
      await authService.requestPasswordReset(data.email)
      setEmailSent(true)
      toast({
        title: 'Reset Link Sent',
        description: 'If an account with that email exists, a password reset link has been sent.',
        variant: 'default',
      })
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send reset link'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Mail className="h-6 w-6 text-primary" />
            <CardTitle>Forgot Password</CardTitle>
          </div>
          <CardDescription>
            {emailSent
              ? 'Check your email for password reset instructions'
              : 'Enter your email address and we\'ll send you a link to reset your password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4 text-center">
              <div className="bg-primary/10 text-primary p-4 rounded-md">
                <Mail className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We've sent password reset instructions to your email address.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false)
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth/login')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
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
