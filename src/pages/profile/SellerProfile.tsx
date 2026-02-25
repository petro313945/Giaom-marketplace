import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'
import { Package, ShoppingBag, TrendingUp, DollarSign, ChevronLeft, ChevronRight, BarChart3, PieChart, Wallet, Download } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
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
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import * as analyticsService from '../../services/analyticsService'
import * as payoutService from '../../services/payoutService'
import type { Product } from '../../services/productService'
import type { Order } from '../../services/orderService'
import AddProductForm from '../../components/AddProductForm'
import ProductsList from '../../components/ProductsList'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function SellerProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [sellerProfile, setSellerProfile] = useState<sellerService.SellerProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10 })
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<analyticsService.AnalyticsResponse | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<number>(30)
  const [earningsSummary, setEarningsSummary] = useState<payoutService.EarningsSummary | null>(null)
  const [payoutHistory, setPayoutHistory] = useState<payoutService.PayoutHistoryResponse | null>(null)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutPage, setPayoutPage] = useState(1)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)

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

  const fetchAnalytics = async (period: number) => {
    setAnalyticsLoading(true)
    try {
      const data = await analyticsService.getSellerAnalytics(period)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'seller') {
      fetchAnalytics(analyticsPeriod)
      fetchEarningsSummary()
      fetchPayoutHistory(payoutPage)
    }
  }, [analyticsPeriod, user?.role, payoutPage])

  const fetchEarningsSummary = async () => {
    try {
      const summary = await payoutService.getEarningsSummary()
      setEarningsSummary(summary)
    } catch (error) {
      console.error('Failed to fetch earnings summary:', error)
    }
  }

  const fetchPayoutHistory = async (page: number = 1) => {
    setPayoutLoading(true)
    try {
      const history = await payoutService.getPayoutHistory(page, 10)
      setPayoutHistory(history)
    } catch (error) {
      console.error('Failed to fetch payout history:', error)
    } finally {
      setPayoutLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (!earningsSummary || earningsSummary.available.netAmount <= 0) {
      return
    }

    setPayoutDialogOpen(true)
  }

  const handlePayoutConfirm = async () => {
    if (!earningsSummary || earningsSummary.available.netAmount <= 0) {
      return
    }

    setRequestingPayout(true)
    setPayoutDialogOpen(false)
    try {
      await payoutService.requestPayout({})
      // Refresh data
      await fetchEarningsSummary()
      await fetchPayoutHistory(payoutPage)
      toast({
        title: 'Success',
        description: 'Payout request submitted successfully!',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request payout',
        variant: 'destructive',
      })
    } finally {
      setRequestingPayout(false)
    }
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Analytics</CardTitle>
                  <CardDescription>Track your store performance</CardDescription>
                </div>
                <Select
                  value={analyticsPeriod.toString()}
                  onValueChange={(value) => setAnalyticsPeriod(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${analytics.summary.totalRevenue.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {analyticsPeriod} days
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.summary.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                          Avg: ${analytics.summary.averageOrderValue.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.summary.totalItems}</div>
                        <p className="text-xs text-muted-foreground">Units</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${analytics.summary.averageOrderValue.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Per order</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Revenue Trend Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Revenue Trend
                      </CardTitle>
                      <CardDescription>Daily revenue over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.salesByDate.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analytics.salesByDate}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getMonth() + 1}/${date.getDate()}`
                              }}
                            />
                            <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                            <Tooltip
                              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                              labelFormatter={(label) => {
                                const date = new Date(label)
                                return date.toLocaleDateString()
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              name="Revenue"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No sales data available for this period
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Orders and Sales Chart */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Orders by Day
                        </CardTitle>
                        <CardDescription>Daily order count</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.salesByDate.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics.salesByDate}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return `${date.getMonth() + 1}/${date.getDate()}`
                                }}
                              />
                              <YAxis />
                              <Tooltip
                                formatter={(value: number) => [value, 'Orders']}
                                labelFormatter={(label) => {
                                  const date = new Date(label)
                                  return date.toLocaleDateString()
                                }}
                              />
                              <Legend />
                              <Bar dataKey="orders" fill="hsl(var(--primary))" name="Orders" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No order data available
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Orders by Status
                        </CardTitle>
                        <CardDescription>Order status distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {Object.values(analytics.ordersByStatus).some((v) => v > 0) ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <RechartsPieChart>
                              <Pie
                                data={Object.entries(analytics.ordersByStatus)
                                  .filter(([_, value]) => value > 0)
                                  .map(([status, value]) => ({
                                    name: status.charAt(0).toUpperCase() + status.slice(1),
                                    value
                                  }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {Object.entries(analytics.ordersByStatus)
                                  .filter(([_, value]) => value > 0)
                                  .map(([status], index) => {
                                    const colors = [
                                      'hsl(var(--primary))',
                                      'hsl(var(--secondary))',
                                      '#10b981',
                                      '#3b82f6',
                                      '#ef4444'
                                    ]
                                    return (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                      />
                                    )
                                  })}
                              </Pie>
                              <Tooltip />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No orders in this period
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Products */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Products</CardTitle>
                      <CardDescription>Best performing products by revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.topProducts.length > 0 ? (
                        <div className="space-y-4">
                          {analytics.topProducts.map((product, index) => (
                            <div
                              key={product.productId}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{product.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {product.quantity} units sold
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">${product.revenue.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">Revenue</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No product sales in this period
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Orders */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Latest orders from your products</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.recentOrders.length > 0 ? (
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="h-10 px-4 text-left font-medium">Date</th>
                                <th className="h-10 px-4 text-left font-medium">Status</th>
                                <th className="h-10 px-4 text-left font-medium">Items</th>
                                <th className="h-10 px-4 text-right font-medium">Revenue</th>
                                <th className="h-10 px-4 text-right font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.recentOrders.map((order) => (
                                <tr
                                  key={order.id}
                                  className="border-b transition-colors hover:bg-muted/50 last:border-0"
                                >
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {new Date(order.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(
                                        order.status
                                      )}`}
                                    >
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-right">
                                    ${order.revenue.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/order/${order.id}`)}
                                    >
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No recent orders
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Failed to load analytics data
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {/* Earnings Summary */}
          {earningsSummary && (
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${earningsSummary.totalEarnings.netAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {earningsSummary.totalEarnings.orderCount} orders
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Commission: ${earningsSummary.totalEarnings.commission.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${earningsSummary.available.netAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ready for payout
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    ${earningsSummary.pending.amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {earningsSummary.pending.payoutCount} payout{earningsSummary.pending.payoutCount !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${earningsSummary.paidOut.amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {earningsSummary.paidOut.payoutCount} payout{earningsSummary.paidOut.payoutCount !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Request Payout Button */}
          {earningsSummary && earningsSummary.available.netAmount > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Available for Payout</p>
                    <p className="text-sm text-muted-foreground">
                      ${earningsSummary.available.netAmount.toFixed(2)} from {earningsSummary.available.orderCount} order{earningsSummary.available.orderCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    onClick={handleRequestPayout}
                    disabled={requestingPayout || earningsSummary.available.netAmount <= 0}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {requestingPayout ? 'Requesting...' : 'Request Payout'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout History */}
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>View your payout requests and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {payoutLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading payout history...</p>
              ) : payoutHistory && payoutHistory.payouts.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Date</th>
                          <th className="h-10 px-4 text-left font-medium">Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Commission</th>
                          <th className="h-10 px-4 text-left font-medium">Net Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Status</th>
                          <th className="h-10 px-4 text-left font-medium">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutHistory.payouts.map((payout) => (
                          <tr
                            key={payout.id}
                            className="border-b transition-colors hover:bg-muted/50 last:border-0"
                          >
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(payout.requestedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              ${payout.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              ${payout.commission.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 font-medium text-green-600">
                              ${payout.netAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  payout.status === 'completed'
                                    ? 'default'
                                    : payout.status === 'failed' || payout.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {payout.status}
                              </Badge>
                              {payout.failureReason && (
                                <p className="text-xs text-red-600 mt-1">{payout.failureReason}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {payout.orderCount} order{payout.orderCount !== 1 ? 's' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {payoutHistory.pagination.pages > 1 && (
                    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                      <span className="text-muted-foreground">
                        Showing {((payoutHistory.pagination.page - 1) * payoutHistory.pagination.limit) + 1}–
                        {Math.min(payoutHistory.pagination.page * payoutHistory.pagination.limit, payoutHistory.pagination.total)} of{' '}
                        {payoutHistory.pagination.total} payouts
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={payoutHistory.pagination.page <= 1}
                          onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-muted-foreground min-w-[120px] text-center">
                          Page {payoutHistory.pagination.page} of {payoutHistory.pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={payoutHistory.pagination.page >= payoutHistory.pagination.pages}
                          onClick={() => setPayoutPage((p) => Math.min(payoutHistory.pagination.pages, p + 1))}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No payout history</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Payout</AlertDialogTitle>
            <AlertDialogDescription>
              {earningsSummary && `Are you sure you want to request a payout of $${earningsSummary.available.netAmount.toFixed(2)}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={requestingPayout}>Cancel</AlertDialogCancel>
            <Button
              variant="default"
              disabled={requestingPayout}
              onClick={handlePayoutConfirm}
            >
              {requestingPayout ? 'Requesting...' : 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
