import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import * as orderService from '../services/orderService'
import { getImageUrl, getFirstImageUrl } from '../utils/imageUtils'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../utils/orderStatusUtils'
import type { Order } from '../services/orderService'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updatingTracking, setUpdatingTracking] = useState(false)
  const [showTrackingForm, setShowTrackingForm] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return

      try {
        setError(null)
        const response = await orderService.getOrderById(id)
        setOrder(response.order)
        setTrackingNumber(response.order.trackingNumber || '')
        setCarrier(response.order.carrier || '')
      } catch (error: any) {
        setError(error?.response?.data?.error || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id || !order) return

    try {
      setUpdating(true)
      await orderService.updateOrderStatus(id, newStatus as any)
      setOrder({ ...order, status: newStatus as any })
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update order status',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleTrackingUpdate = async () => {
    if (!id || !order || !trackingNumber.trim()) return

    try {
      setUpdatingTracking(true)
      const response = await orderService.updateTrackingNumber(id, trackingNumber.trim(), carrier.trim() || undefined)
      setOrder({ ...order, trackingNumber: response.order.trackingNumber, carrier: response.order.carrier, status: response.order.status })
      setShowTrackingForm(false)
      toast({
        title: 'Success',
        description: 'Tracking number updated successfully',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update tracking number',
        variant: 'destructive',
      })
    } finally {
      setUpdatingTracking(false)
    }
  }

  const getTrackingLink = (trackingNum: string, carrierName?: string) => {
    if (!carrierName) return null
    
    const carrierLower = carrierName.toLowerCase()
    const tracking = encodeURIComponent(trackingNum)
    
    // Common carrier tracking URLs
    if (carrierLower.includes('ups') || carrierLower.includes('united parcel')) {
      return `https://www.ups.com/track?tracknum=${tracking}`
    } else if (carrierLower.includes('fedex') || carrierLower.includes('federal express')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`
    } else if (carrierLower.includes('usps') || carrierLower.includes('united states postal')) {
      return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${tracking}`
    } else if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`
    } else if (carrierLower.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${tracking}`
    }
    
    // Generic search as fallback
    return `https://www.google.com/search?q=track+${tracking}+${encodeURIComponent(carrierName)}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="h-5 w-5" />
      case 'processing':
        return <Package className="h-5 w-5" />
      case 'shipped':
        return <Truck className="h-5 w-5" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />
      case 'cancelled':
        return <XCircle className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const canUpdateStatus = user?.role === 'seller' || user?.role === 'admin'
  const canCancelOrder = user?.role === 'customer' && (order?.status === 'pending' || order?.status === 'processing')
  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading order...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Order not found'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const product = item.productId as any
                  const productData = typeof product === 'object' ? product : null
                  const productName = productData?.title || item.title || 'Product'
                  const productPrice = item.price || 0
                  const productImage = getFirstImageUrl(productData)

                  const productId = productData?._id || productData?.id || (typeof item.productId === 'string' ? item.productId : '')
                  
                  return (
                    <div key={index} className="flex gap-4 border-b pb-4 last:border-0">
                      {productId ? (
                        <Link to={`/product/${productId}`}>
                          <img
                            src={productImage}
                            alt={productName}
                            className="h-20 w-20 rounded-lg object-contain bg-muted hover:opacity-80 transition-opacity"
                          />
                        </Link>
                      ) : (
                        <img
                          src={productImage}
                          alt={productName}
                          className="h-20 w-20 rounded-lg object-contain bg-muted"
                        />
                      )}
                      <div className="flex-1">
                        {productId ? (
                          <Link to={`/product/${productId}`}>
                            <h4 className="font-medium hover:text-primary">{productName}</h4>
                          </Link>
                        ) : (
                          <h4 className="font-medium">{productName}</h4>
                        )}
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="font-medium mt-1">${productPrice.toFixed(2)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(productPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-muted-foreground">{order.shippingAddress.address}</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.city}
                  {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                  {' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Owner */}
              <div className="border-b pb-4">
                <p className="text-sm font-medium mb-1">Order Owner</p>
                <p className="text-sm text-muted-foreground">
                  {order.guestEmail ? (
                    <span>Guest ({order.guestEmail})</span>
                  ) : order.userId ? (
                    <span>User Account</span>
                  ) : (
                    <span>Guest</span>
                  )}
                </p>
              </div>

              {/* Order Status Tracking */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium capitalize">Status: <span className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(order.status)}`}>{order.status}</span></p>
                    <p className="text-sm text-muted-foreground">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Status Timeline */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Order Tracking</p>
                  <div className="space-y-3">
                    {['pending', 'processing', 'shipped', 'delivered'].map((status) => {
                      const isCancelled = order.status === 'cancelled'
                      const isCompleted = !isCancelled && (
                        (status === 'pending' && ['pending', 'processing', 'shipped', 'delivered'].includes(order.status)) ||
                        (status === 'processing' && ['processing', 'shipped', 'delivered'].includes(order.status)) ||
                        (status === 'shipped' && ['shipped', 'delivered'].includes(order.status)) ||
                        (status === 'delivered' && order.status === 'delivered')
                      )
                      
                      const isCurrent = order.status === status
                      
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isCancelled ? 'bg-gray-200' :
                            isCompleted ? 'bg-primary text-primary-foreground' :
                            'bg-gray-200 text-gray-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className={`w-2 h-2 rounded-full ${isCurrent && !isCancelled ? 'bg-primary' : 'bg-gray-300'}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isCompleted ? 'text-foreground' : 'text-muted-foreground'
                            } capitalize`}>
                              {status === 'pending' ? 'Order Placed' :
                               status === 'processing' ? 'Processing' :
                               status === 'shipped' ? 'Shipped' :
                               'Delivered'}
                            </p>
                            {isCurrent && !isCancelled && (
                              <p className="text-xs text-muted-foreground">Current status</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {order.status === 'cancelled' && (
                      <div className="flex items-center gap-3 pt-2 border-t">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground">
                          <XCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-destructive capitalize">Cancelled</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {(order.trackingNumber || canUpdateStatus) && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Tracking Information</p>
                  {order.trackingNumber ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Tracking Number</p>
                          <p className="text-sm text-muted-foreground font-mono">{order.trackingNumber}</p>
                        </div>
                        {getTrackingLink(order.trackingNumber, order.carrier) && (
                          <a
                            href={getTrackingLink(order.trackingNumber, order.carrier)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            Track <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {order.carrier && (
                        <div>
                          <p className="text-sm font-medium">Carrier</p>
                          <p className="text-sm text-muted-foreground">{order.carrier}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tracking number available</p>
                  )}
                  
                  {canUpdateStatus && (
                    <div className="space-y-2">
                      {!showTrackingForm ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setShowTrackingForm(true)
                            setTrackingNumber(order.trackingNumber || '')
                            setCarrier(order.carrier || '')
                          }}
                        >
                          {order.trackingNumber ? 'Update Tracking' : 'Add Tracking Number'}
                        </Button>
                      ) : (
                        <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                          <div>
                            <Label htmlFor="trackingNumber">Tracking Number *</Label>
                            <Input
                              id="trackingNumber"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Enter tracking number"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="carrier">Carrier (Optional)</Label>
                            <Input
                              id="carrier"
                              value={carrier}
                              onChange={(e) => setCarrier(e.target.value)}
                              placeholder="e.g., UPS, FedEx, USPS"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleTrackingUpdate}
                              disabled={updatingTracking || !trackingNumber.trim()}
                              className="flex-1"
                            >
                              {updatingTracking ? 'Updating...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowTrackingForm(false)
                                setTrackingNumber(order.trackingNumber || '')
                                setCarrier(order.carrier || '')
                              }}
                              disabled={updatingTracking}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {canCancelOrder && (
                <div className="border-t pt-4">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={updating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </div>
              )}

              {canUpdateStatus && (
                <div className="border-t pt-4 space-y-2">
                  <Label>Update Status</Label>
                  <div className="flex flex-col gap-2">
                    {statusOptions.map((status) => (
                      <Button
                        key={status}
                        variant={order.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusUpdate(status)}
                        disabled={updating || order.status === status}
                        className="justify-start capitalize"
                      >
                        {getStatusIcon(status)}
                        <span className="ml-2">{status}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={updating}
              onClick={() => {
                handleStatusUpdate('cancelled')
                setCancelDialogOpen(false)
              }}
            >
              {updating ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
