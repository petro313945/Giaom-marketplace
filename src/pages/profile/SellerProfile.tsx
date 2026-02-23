import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'
import { Package, ShoppingBag, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10 })
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
          <ProductsList
            products={products}
            pagination={productsPagination}
            onProductUpdated={handleProductAdded}
            onPageChange={(page) => fetchProducts(page)}
            headerAction={<AddProductForm onProductAdded={handleProductAdded} />}
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
                          const sellerOrderTotal = order.items?.reduce((sum: number, item: any) => {
                            return sum + (item.price * item.quantity)
                          }, 0) || order.totalAmount
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
                              <td className="px-4 py-3 font-medium">${sellerOrderTotal.toFixed(2)}</td>
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
