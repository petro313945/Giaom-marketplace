import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { MapPin, Star, Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import * as orderService from '../services/orderService'
import * as addressService from '../services/addressService'
import type { ShippingAddress } from '../services/orderService'
import type { Address } from '../services/addressService'

interface CheckoutFormData {
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export default function Checkout() {
  const { cart, loading: cartLoading, clearCart } = useCart()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CheckoutFormData>()

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true)
      try {
        const response = await addressService.getUserAddresses()
        setAddresses(response.addresses)
        // Auto-select default address if available
        const defaultAddress = response.addresses.find(addr => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          fillFormWithAddress(defaultAddress)
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error)
        // If addresses fail to load, allow manual entry
        setUseNewAddress(true)
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchAddresses()
  }, [])

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
    // Clear form
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
    setIsSubmitting(true)
    setError(null)

    try {
      const shippingAddress: ShippingAddress = {
        fullName: data.fullName,
        address: data.address,
        city: data.city,
        state: data.state || '',
        zipCode: data.zipCode,
        country: data.country,
        phone: data.phone || '',
      }

      await orderService.createOrder(shippingAddress)
      await clearCart()
      toast({
        title: 'Order Placed Successfully!',
        description: 'Thank you for your order. We will process it shortly.',
        variant: 'default',
      })
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to place order')
      toast({
        title: 'Order Failed',
        description: err.response?.data?.error || err.message || 'Failed to place order',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
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
              {isSubmitting ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
            </Button>
          </form>
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
                  const productImage = typeof product === 'object' ? product.imageUrl : '/placeholder.svg'
                  
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={productImage || '/placeholder.svg'}
                        alt={productName}
                        className="h-16 w-16 rounded object-cover"
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
