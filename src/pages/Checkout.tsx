import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { MapPin, Star, Plus, CreditCard } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import * as orderService from '../services/orderService'
import * as addressService from '../services/addressService'
import * as paymentService from '../services/paymentService'
import { getImageUrl } from '../utils/imageUtils'
import type { ShippingAddress } from '../services/orderService'
import type { Address } from '../services/addressService'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface CheckoutFormData {
  email: string
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

// Payment Form Component
function PaymentForm({ 
  shippingAddress, 
  total, 
  clientSecret,
  paymentIntentId,
  cartItems,
  email,
  onSuccess, 
  onError 
}: { 
  shippingAddress: ShippingAddress
  total: number
  clientSecret: string
  paymentIntentId: string
  cartItems?: any[]
  email?: string
  onSuccess: (orderId: string) => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      onError('Payment system not ready. Please try again.')
      return
    }

    setIsProcessing(true)

    try {
      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (stripeError) {
        onError(stripeError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Create order with payment intent ID
        const orderResponse = await orderService.createOrder(shippingAddress, paymentIntentId, cartItems, email)
        onSuccess(orderResponse.order.id)
      } else {
        onError(`Payment status: ${paymentIntent?.status}`)
        setIsProcessing(false)
      }
    } catch (error: any) {
      onError(error.message || 'Payment processing failed')
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="card-element">Card Details</Label>
        <div className="p-4 border rounded-md">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>
      <Button 
        type="submit" 
        size="lg" 
        className="w-full" 
        disabled={!stripe || isProcessing || !paymentIntentId}
      >
        {isProcessing ? 'Processing Payment...' : `Pay $${total.toFixed(2)}`}
      </Button>
    </form>
  )
}

// Main Checkout Component
function CheckoutForm() {
  const { cart, loading: cartLoading, clearCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CheckoutFormData>()

  useEffect(() => {
    // Only fetch addresses if user is authenticated
    if (isAuthenticated) {
      const fetchAddresses = async () => {
        setLoadingAddresses(true)
        try {
          const response = await addressService.getUserAddresses()
          setAddresses(response.addresses)
          const defaultAddress = response.addresses.find(addr => addr.isDefault)
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
            fillFormWithAddress(defaultAddress)
          }
        } catch (error) {
          console.error('Failed to fetch addresses:', error)
          setUseNewAddress(true)
        } finally {
          setLoadingAddresses(false)
        }
      }

      fetchAddresses()
    } else {
      // For guest users, set email field if available from user object (shouldn't be, but just in case)
      setLoadingAddresses(false)
      setUseNewAddress(true)
    }
  }, [isAuthenticated])

  const fillFormWithAddress = (address: Address) => {
    setValue('fullName', address.fullName)
    setValue('address', address.address)
    setValue('city', address.city)
    setValue('state', address.state || '')
    setValue('zipCode', address.zipCode)
    setValue('country', address.country)
    setValue('phone', address.phone || '')
  }

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address.id)
    setUseNewAddress(false)
    fillFormWithAddress(address)
  }

  const handleUseNewAddress = () => {
    setSelectedAddressId(null)
    setUseNewAddress(true)
    setValue('fullName', '')
    setValue('address', '')
    setValue('city', '')
    setValue('state', '')
    setValue('zipCode', '')
    setValue('country', '')
    setValue('phone', '')
  }

  if (cartLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading cart...</div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some items to your cart to checkout</p>
          <Button onClick={() => navigate('/')}>Continue Shopping</Button>
        </div>
      </div>
    )
  }

  const calculateTotal = () => {
    if (!cart.items.length) return 0
    return cart.items.reduce((sum, item) => {
      const product = item.productId as any
      const price = typeof product === 'object' ? product.price : 0
      return sum + (price * item.quantity)
    }, 0)
  }

  const subtotal = calculateTotal()
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const onSubmit = async (data: CheckoutFormData) => {
    setError(null)

    const shippingAddress: ShippingAddress = {
      fullName: data.fullName,
      address: data.address,
      city: data.city,
      state: data.state || '',
      zipCode: data.zipCode,
      country: data.country,
      phone: data.phone || '',
    }

    // Prepare cart items for guest checkout
    let cartItemsForPayment: any[] | undefined = undefined;
    if (!isAuthenticated && cart) {
      cartItemsForPayment = cart.items.map(item => ({
        productId: typeof item.productId === 'object' ? item.productId.id : item.productId,
        quantity: item.quantity,
        variant: item.variant
      }));
    }

    // Create payment intent
    try {
      setIsSubmitting(true)
      const paymentResponse = await paymentService.createPaymentIntent(cartItemsForPayment)
      setClientSecret(paymentResponse.clientSecret)
      setPaymentIntentId(paymentResponse.paymentIntentId)
      setShowPayment(true)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to initialize payment')
      toast({
        title: 'Payment Error',
        description: err.response?.data?.error || err.message || 'Failed to initialize payment',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = async (orderId: string) => {
    try {
      await clearCart()
      toast({
        title: 'Order Placed Successfully!',
        description: 'Thank you for your order. We will process it shortly.',
        variant: 'default',
      })
      // Navigate to the order detail page to show confirmation
      navigate(`/order/${orderId}`)
    } catch (error) {
      console.error('Error clearing cart:', error)
      // Even if cart clearing fails, still navigate to order page
      navigate(`/order/${orderId}`)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    toast({
      title: 'Payment Failed',
      description: errorMessage,
      variant: 'destructive',
    })
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {!showPayment ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Saved Addresses Section */}
              {!loadingAddresses && addresses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Shipping Address</CardTitle>
                    <CardDescription>Choose from your saved addresses or enter a new one</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id && !useNewAddress
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleSelectAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{address.fullName}</h4>
                              {address.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{address.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}
                              {address.state && `, ${address.state}`} {address.zipCode}
                            </p>
                            <p className="text-sm text-muted-foreground">{address.country}</p>
                            {address.phone && (
                              <p className="text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                            )}
                          </div>
                          <div className="ml-4">
                            <input
                              type="radio"
                              checked={selectedAddressId === address.id && !useNewAddress}
                              onChange={() => handleSelectAddress(address)}
                              className="h-4 w-4 text-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleUseNewAddress}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Use New Address
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Information Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {addresses.length > 0 && !useNewAddress ? 'Selected Address' : 'Shipping Information'}
                  </CardTitle>
                  {addresses.length > 0 && !useNewAddress && (
                    <CardDescription>Review or modify the selected address below</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isAuthenticated && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      {...register('fullName', { required: 'Full name is required' })}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register('address', { required: 'Address is required' })}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        {...register('city', { required: 'City is required' })}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input id="state" {...register('state')} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        {...register('zipCode', { required: 'ZIP code is required' })}
                      />
                      {errors.zipCode && (
                        <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        {...register('country', { required: 'Country is required' })}
                      />
                      {errors.country && (
                        <p className="text-sm text-destructive">{errors.country.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input id="phone" type="tel" {...register('phone')} />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : `Continue to Payment - $${total.toFixed(2)}`}
              </Button>
            </form>
          ) : (
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret: clientSecret || undefined,
                appearance: {
                  theme: 'stripe',
                },
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>Complete your payment to place the order</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentIntentId && clientSecret && (
                    <PaymentForm
                      shippingAddress={{
                        fullName: watch('fullName'),
                        address: watch('address'),
                        city: watch('city'),
                        state: watch('state') || '',
                        zipCode: watch('zipCode'),
                        country: watch('country'),
                        phone: watch('phone') || '',
                      }}
                      total={total}
                      clientSecret={clientSecret}
                      paymentIntentId={paymentIntentId}
                      cartItems={!isAuthenticated && cart ? cart.items.map(item => ({
                        productId: typeof item.productId === 'object' ? item.productId.id : item.productId,
                        quantity: item.quantity,
                        variant: item.variant
                      })) : undefined}
                      email={!isAuthenticated ? watch('email') : undefined}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  )}
                </CardContent>
              </Card>
            </Elements>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.items.map((item) => {
                  const product = item.productId as any
                  const productName = typeof product === 'object' ? product.title : 'Product'
                  const productPrice = typeof product === 'object' ? product.price : 0
                  const productImage = typeof product === 'object' ? getImageUrl(product.imageUrl) : '/placeholder.svg'
                  
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={productImage}
                        alt={productName}
                        className="h-16 w-16 rounded object-contain bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{productName}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-medium">${(productPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function Checkout() {
  return <CheckoutForm />
}
