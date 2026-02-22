import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Package, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import AddProductForm from '../../components/AddProductForm'

export default function SellerProfile() {
  const { user } = useAuth()
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, productsData, ordersData] = await Promise.all([
          sellerService.getSellerProfile(),
          productService.getSellerProducts(),
          orderService.getSellerOrders(),
        ])
        setSellerProfile(profile)
        setProducts(productsData)
        setOrders(ordersData)
      } catch (error) {
        console.error('Failed to fetch seller data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  const approvedProducts = products.filter((p) => p.status === 'approved')
  const pendingProducts = products.filter((p) => p.status === 'pending')
  
  // Order statistics
  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const processingOrders = orders.filter((o) => o.status === 'processing')
  const shippedOrders = orders.filter((o) => o.status === 'shipped')
  const deliveredOrders = orders.filter((o) => o.status === 'delivered')

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
        <p className="text-muted-foreground">
          {sellerProfile?.businessName || user?.name || 'Manage your store and products'}
        </p>
        {sellerProfile?.status === 'pending' && (
          <p className="text-sm text-orange-600 mt-2">Your seller account is pending approval</p>
        )}
        {sellerProfile?.status === 'rejected' && (
          <p className="text-sm text-red-600 mt-2">Your seller application was rejected</p>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Total orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">{approvedProducts.length} approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Requires action</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <AddProductForm onProductAdded={() => {
            // Refresh products list
            const fetchProducts = async () => {
              try {
                const productsData = await productService.getSellerProducts()
                setProducts(productsData)
              } catch (error) {
                console.error('Failed to refresh products:', error)
              }
            }
            fetchProducts()
          }} />
          <Card>
            <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>Manage your product listings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-muted-foreground">No products yet. Add your first product above!</p>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product._id || product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                        <p className="text-sm capitalize">{product.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{processingOrders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Shipped</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{shippedOrders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{deliveredOrders.length}</div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Manage and fulfill customer orders</CardDescription>
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
                            {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-sm font-medium">${order.totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        <Button variant="outline" asChild>
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

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Track your store performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View your earnings and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No recent payments</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
