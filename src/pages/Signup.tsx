import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/ui/use-toast'
import type { RegisterData } from '../services/authService'

export default function Signup() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>()

  const onSubmit = async (data: RegisterData) => {
    try {
      setError('')
      setLoading(true)
      await registerUser(data)
      
      // Show success message
      toast({
        title: 'Account Created Successfully!',
        description: 'Your account has been created. Welcome to Giaom Marketplace!',
        variant: 'default',
      })
      
      // Navigate after a short delay to show the toast
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed. Please try again.'
      setError(errorMessage)
      toast({
        title: 'Registration Failed',
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
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">Sign up to start shopping</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
              Full Name (Optional)
            </label>
            <input
              id="fullName"
              type="text"
              {...register('fullName')}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
