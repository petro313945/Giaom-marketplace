import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'
import { Package, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import type { Product } from '../../services/productService'
import type { Order } from '../../services/orderService'
import AddProductForm from '../../components/AddProductForm'
import ProductsList from '../../components/ProductsList'

export default function SellerProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sellerProfile, setSellerProfile] = useState<sellerService.SellerProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async (page = 1) => {
    const response = await productService.getSellerProducts({ page, limit: 10 })
    setProducts(response.products)
    setProductsPagination(response.pagination)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, productsResponse, ordersData] = await Promise.all([
          sellerService.getCurrentSellerProfile().catch(() => ({ sellerProfile: null })),
          productService.getSellerProducts({ page: 1, limit: 10 }),
          orderService.getSellerOrders().catch(() => ({ orders: [] })),
        ])
        setSellerProfile(profile.sellerProfile || null)
        setProducts(productsResponse.products)
        setProductsPagination(productsResponse.pagination)
        setOrders(ordersData.orders || [])
      } catch (error) {
        console.error('Failed to fetch seller data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleProductAdded = () => {
    fetchProducts(productsPagination.page)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
        <p className="text-muted-foreground">
          {sellerProfile?.businessName || user?.fullName || 'Manage your store and products'}
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
              ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
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
            <div className="text-2xl font-bold">{productsPagination.total}</div>
            <p className="text-xs text-muted-foreground">
              Total listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
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
          <AddProductForm onProductAdded={handleProductAdded} />
          <ProductsList
            products={products}
            pagination={productsPagination}
            onProductUpdated={handleProductAdded}
            onPageChange={(page) => fetchProducts(page)}
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Manage and fulfill customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet</p>
              ) : (
                <div className="divide-y">
                  {orders.map((order) => {
                    const orderId = order.id || (order as any)._id
                    const sellerOrderTotal = order.items?.reduce((sum: number, item: any) => {
                      return sum + (item.price * item.quantity)
                    }, 0) || order.totalAmount
                    
                    return (
                      <div key={orderId} className="flex items-center gap-4 py-3 hover:bg-accent/50 transition-colors">
                        <span className="font-medium text-sm">Order #{orderId.slice(-8)}</span>
                        <span className="text-sm text-muted-foreground">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="font-medium text-sm">${sellerOrderTotal.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="ml-auto"
                          onClick={() => navigate(`/order/${orderId}`)}
                        >
                          View Details
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
