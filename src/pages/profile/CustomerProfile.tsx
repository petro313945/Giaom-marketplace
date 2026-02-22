import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Package, Heart, MapPin, CreditCard, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import * as orderService from '../../services/orderService'

export default function CustomerProfile() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getUserOrders()
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchOrders()
    }
  }, [user])

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
                <p className="text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'pending': return 'bg-yellow-100 text-yellow-800'
                        case 'processing': return 'bg-blue-100 text-blue-800'
                        case 'shipped': return 'bg-purple-100 text-purple-800'
                        case 'delivered': return 'bg-green-100 text-green-800'
                        case 'cancelled': return 'bg-red-100 text-red-800'
                        default: return 'bg-gray-100 text-gray-800'
                      }
                    }
                    return (
                      <div key={order._id || order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Order #{(order._id || order.id || '').slice(-8)}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-sm font-medium">${order.totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          asChild
                        >
                          <Link to={`/order/${order._id || order.id}`}>View Details</Link>
                        </Button>
                      </div>
                    )
                  })}
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
              <div>
                <p className="text-sm font-medium mb-1">Name</p>
                <p className="text-muted-foreground">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Email</p>
                <p className="text-muted-foreground">{user?.email || 'N/A'}</p>
              </div>
              <Button>Edit Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
