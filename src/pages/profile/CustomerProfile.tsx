import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'
import { Package, Heart, MapPin, CreditCard, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import * as orderService from '../../services/orderService'
import * as userService from '../../services/userService'
import type { Order } from '../../services/orderService'

interface ProfileFormData {
  fullName: string
}

export default function CustomerProfile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10 })
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
    },
  })

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getUserOrders()
        setOrders(response.orders)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
      })
    }
  }, [user, reset])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    setProfileError(null)
    
    try {
      const response = await userService.updateUserProfile({ fullName: data.fullName })
      updateUser(response.user)
      setIsEditingProfile(false)
    } catch (error: any) {
      setProfileError(error.response?.data?.error || error.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setProfileError(null)
    if (user) {
      reset({
        fullName: user.fullName || '',
      })
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Account</h1>
        <p className="text-muted-foreground">Manage your account and view your orders</p>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-2">
            <Heart className="h-4 w-4" />
            Wishlist
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>View and track your orders</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading orders...</div>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left font-medium w-12">No.</th>
                        <th className="h-10 px-4 text-left font-medium">Order ID</th>
                        <th className="h-10 px-4 text-left font-medium">Date</th>
                        <th className="h-10 px-4 text-left font-medium">Status</th>
                        <th className="h-10 px-4 text-left font-medium">Amount</th>
                        <th className="h-10 px-4 text-left font-medium">Items</th>
                        <th className="h-10 px-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders
                        .slice(
                          (ordersPagination.page - 1) * ordersPagination.limit,
                          ordersPagination.page * ordersPagination.limit
                        )
                        .map((order, index) => {
                          const orderId = order.id || (order as any)._id
                          const rowNo = (ordersPagination.page - 1) * ordersPagination.limit + index + 1
                          return (
                            <tr key={orderId} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                              <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                              <td className="px-4 py-3 font-medium">#{orderId.slice(-8)}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium">${order.totalAmount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/order/${orderId}`)}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                    <span className="text-muted-foreground">
                      Showing{' '}
                      {orders.length === 0
                        ? 0
                        : (ordersPagination.page - 1) * ordersPagination.limit + 1}
                      –{Math.min(ordersPagination.page * ordersPagination.limit, orders.length)} of{' '}
                      {orders.length} orders
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPagination.page <= 1}
                        onClick={() =>
                          setOrdersPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-muted-foreground min-w-[120px] text-center">
                        Page {ordersPagination.page} of{' '}
                        {Math.max(1, Math.ceil(orders.length / ordersPagination.limit))}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          ordersPagination.page >= Math.ceil(orders.length / ordersPagination.limit)
                        }
                        onClick={() =>
                          setOrdersPagination((p) => ({
                            ...p,
                            page: Math.min(
                              Math.ceil(orders.length / ordersPagination.limit),
                              p.page + 1
                            )
                          }))
                        }
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Wishlist</CardTitle>
              <CardDescription>Items you've saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No items in your wishlist yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
              <CardDescription>Manage your delivery addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Add New Address</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment options</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Add Payment Method</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProfile ? (
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                  {profileError && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                      {profileError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      {...register('fullName', {
                        required: 'Full name is required',
                        minLength: {
                          value: 2,
                          message: 'Full name must be at least 2 characters',
                        },
                      })}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isUpdatingProfile}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-1">Name</p>
                    <p className="text-muted-foreground">{user?.fullName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Email</p>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button onClick={() => setIsEditingProfile(true)}>Edit Profile</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
