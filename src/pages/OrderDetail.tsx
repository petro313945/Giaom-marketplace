import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useAuth } from '../context/AuthContext'
import * as orderService from '../services/orderService'
import { getImageUrl } from '../utils/imageUtils'
import type { Order } from '../services/orderService'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return

      try {
        setError(null)
        const response = await orderService.getOrderById(id)
        setOrder(response.order)
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
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600'
      case 'processing':
        return 'text-blue-600'
      case 'shipped':
        return 'text-purple-600'
      case 'delivered':
        return 'text-green-600'
      case 'cancelled':
        return 'text-red-600'
      default:
        return 'text-gray-600'
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
                  const productImage = productData?.imageUrl || '/placeholder.svg'

                  const productId = productData?._id || productData?.id || (typeof item.productId === 'string' ? item.productId : '')
                  
                  return (
                    <div key={index} className="flex gap-4 border-b pb-4 last:border-0">
                      {productId ? (
                        <Link to={`/product/${productId}`}>
                          <img
                            src={getImageUrl(productImage)}
                            alt={productName}
                            className="h-20 w-20 rounded-lg object-cover hover:opacity-80 transition-opacity"
                          />
                        </Link>
                      ) : (
                        <img
                          src={getImageUrl(productImage)}
                          alt={productName}
                          className="h-20 w-20 rounded-lg object-cover"
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
              {/* Order Status Tracking */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium capitalize">Status: <span className={getStatusColor(order.status)}>{order.status}</span></p>
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
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this order?')) {
                        handleStatusUpdate('cancelled')
                      }
                    }}
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
    </div>
  )
}
