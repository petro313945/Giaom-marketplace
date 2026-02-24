import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/ui/use-toast'
import type { LoginData } from '../services/authService'

export default function Login() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>()

  const onSubmit = async (data: LoginData) => {
    try {
      setError('')
      setLoading(true)
      const response = await login(data)
      
      // Show role-specific success message
      const role = response.user.role
      let welcomeMessage = 'Welcome back!'
      
      if (role === 'admin') {
        welcomeMessage = 'Welcome, Administrator! You have full access to manage the marketplace.'
      } else if (role === 'seller') {
        welcomeMessage = 'Welcome back, Seller! Manage your products and orders.'
      } else if (role === 'customer') {
        welcomeMessage = 'Welcome back! Start shopping and discover great products.'
      }
      
      toast({
        title: 'Login Successful',
        description: welcomeMessage,
        variant: 'default',
      })
      
      // Navigate after a short delay to show the toast
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please try again.'
      setError(errorMessage)
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Please enter a valid email'
                }
              })}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link to="/auth/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link to="/auth/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
