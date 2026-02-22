import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, TrendingUp, Shield, Zap } from 'lucide-react'
import * as sellerService from '../services/sellerService'

interface BecomeSellerFormData {
  businessName: string
  businessDescription?: string
}

export default function BecomeSeller() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<BecomeSellerFormData>()

  const onSubmit = async (data: BecomeSellerFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      await sellerService.applyToBecomeSeller({
        businessName: data.businessName,
        businessDescription: data.businessDescription || '',
      })

      alert('Seller application submitted successfully! Please wait for admin approval.')
      navigate('/profile')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit application')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1">
      <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Start Selling on Giaom</h1>
            <p className="text-xl text-muted-foreground">
              Join thousands of successful sellers and grow your business with our marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Store className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Easy Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create your store in minutes with our simple onboarding process
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Grow Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Reach millions of customers actively shopping on Giaom
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Get paid securely with our trusted payment processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Fast Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">24/7 seller support to help you succeed</p>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create Your Seller Account</CardTitle>
              <CardDescription>
                Fill out the form below to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="My Awesome Store"
                    {...register('businessName', { required: 'Business name is required' })}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="Tell us about your business"
                    {...register('businessDescription')}
                  />
                </div>
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
