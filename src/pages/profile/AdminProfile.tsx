import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Users, ShoppingBag, Store, AlertCircle, Trash2, Edit, Package, DollarSign, TrendingUp, ArrowRight, ShoppingCart, Clock, Star } from 'lucide-react'
import * as userService from '../../services/userService'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import * as reviewService from '../../services/reviewService'
import * as reportService from '../../services/reportService'
import RatingDisplay from '../../components/RatingDisplay'
import { getFirstImageUrl } from '../../utils/imageUtils'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'

export default function AdminProfile() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSellers, setAllSellers] = useState<any[]>([])
  const [sellersPagination, setSellersPagination] = useState({ page: 1, perPage: 10 })
  const [usersPagination, setUsersPagination] = useState({ page: 1, perPage: 10 })
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, perPage: 10 })
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [productStats, setProductStats] = useState({ total: 0, pending: 0 })
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [orderStats, setOrderStats] = useState<{ totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number } | null>(null)
  const [allReviews, setAllReviews] = useState<any[]>([])
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [allReports, setAllReports] = useState<any[]>([])
  const [reportsPagination, setReportsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [pendingReportsCount, setPendingReportsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string>('')
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null)
  const [dismissingReportId, setDismissingReportId] = useState<string | null>(null)
  const [reportAdminNotes, setReportAdminNotes] = useState<{ [key: string]: string }>({})

  const fetchProducts = async (page = 1) => {
    const response = await productService.getAllProducts({ page, limit: 10 })
    setAllProducts(response.products)
    setProductsPagination(response.pagination)
  }

  const fetchReviews = async (page = 1) => {
    try {
      const response = await reviewService.getPendingReviews({ page, limit: 10 })
      setAllReviews(response.reviews)
      setReviewsPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }

  const fetchReports = async (page = 1, status?: string) => {
    try {
      const response = await reportService.getAllReports({ page, limit: 10, status: status as any })
      setAllReports(response.reports)
      setReportsPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const fetchPendingReportsCount = async () => {
    try {
      const response = await reportService.getPendingReportsCount()
      setPendingReportsCount(response.count)
    } catch (error) {
      console.error('Failed to fetch pending reports count:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, sellers, productStatsData, productsResponse, ordersData] = await Promise.all([
          userService.getAllUsers(),
          sellerService.getAllSellers(),
          productService.getAdminProductStats(),
          productService.getAllProducts({ page: 1, limit: 10 }),
          orderService.getAllOrders(),
        ])
        setAllUsers(users)
        setAllSellers(sellers)
        setProductStats(productStatsData)
        setAllProducts(productsResponse.products)
        setProductsPagination(productsResponse.pagination)
        setAllOrders(ordersData.orders)
        setOrderStats(ordersData.statistics)
        await fetchReviews(1)
        await fetchReports(1)
        await fetchPendingReportsCount()
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRoleChange = async (userId: string, newRole: 'customer' | 'seller' | 'admin') => {
    try {
      await userService.changeUserRole(userId, newRole)
      setAllUsers((prev) =>
        prev.map((u) => {
          const uId = (u as any)._id || u.id
          return uId === userId ? { ...u, role: newRole } : u
        })
      )
      setEditingUserId(null)
      toast({
        title: 'User Role Updated',
        description: 'The user role has been updated successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update user role'
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await userService.deleteUser(userId)
      setAllUsers((prev) => prev.filter((u) => {
        const uId = (u as any)._id || u.id
        return uId !== userId
      }))
      toast({
        title: 'User Deleted',
        description: 'The user has been deleted successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete user'
      toast({
        title: 'Deletion Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const pendingSellers = allSellers.filter((s) => s.status === 'pending')
  const activeSellers = allSellers.filter((s) => s.status === 'approved').length

  const sellersTotalPages = Math.ceil(allSellers.length / sellersPagination.perPage) || 1
  const paginatedSellers = allSellers.slice(
    (sellersPagination.page - 1) * sellersPagination.perPage,
    sellersPagination.page * sellersPagination.perPage
  )

  const usersTotalPages = Math.ceil(allUsers.length / usersPagination.perPage) || 1
  const paginatedUsers = allUsers.slice(
    (usersPagination.page - 1) * usersPagination.perPage,
    usersPagination.page * usersPagination.perPage
  )

  const ordersTotalPages = Math.ceil(allOrders.length / ordersPagination.perPage) || 1
  const paginatedOrders = allOrders.slice(
    (ordersPagination.page - 1) * ordersPagination.perPage,
    ordersPagination.page * ordersPagination.perPage
  )
  
  // Recent activity (last 5 orders)
  const recentOrders = allOrders.slice(0, 5)

  const getRelativeTime = (date: string | Date) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString()
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage the entire marketplace</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSellers}</div>
            <p className="text-xs text-muted-foreground">{pendingSellers.length} pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.total}</div>
            <p className="text-xs text-muted-foreground">{productStats.pending} pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orderStats ? orderStats.totalRevenue.toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {orderStats ? `${orderStats.totalOrders} orders` : 'No orders yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest 5 orders in the marketplace — click to view details</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No recent orders</p>
              <p className="text-sm text-muted-foreground mt-1">New orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const orderId = order._id || order.id
                const user = order.userId as any
                const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
                return (
                  <div
                    key={orderId}
                    onClick={() => navigate(`/order/${orderId}`)}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-accent transition-colors cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">Order #{orderId.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                      <Clock className="h-4 w-4" />
                      {getRelativeTime(order.createdAt)}
                    </div>
                    <span className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(order.status)} shrink-0`}>
                      {order.status}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-primary">${order.totalAmount?.toFixed(2) ?? '0.00'}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                  </div>
                )
              })}
            </div>
          )}
          {recentOrders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">Max 5</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="sellers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sellers" className="gap-2">
            <Store className="h-4 w-4" />
            Sellers
            {pendingSellers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {pendingSellers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Products
            {productStats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {productStats.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders
            {orderStats && orderStats.pendingOrders > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {orderStats.pendingOrders}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <Star className="h-4 w-4" />
            Reviews
            {allReviews.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {allReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Reports
            {pendingReportsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {pendingReportsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seller Applications</CardTitle>
              <CardDescription>Review and approve seller applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading sellers...</p>
              ) : allSellers.length === 0 ? (
                <p className="text-muted-foreground">No sellers yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium w-12">No.</th>
                        <th className="px-4 py-3 text-left font-medium">Business Name</th>
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-left font-medium">Owner</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Applied</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSellers.map((seller, index) => {
                        const sellerId = (seller as any)._id || seller.id
                        const user = seller.userId as any
                        const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
                        const userName = typeof user === 'object' ? (user?.fullName || userEmail) : userEmail
                        const rowNo = (sellersPagination.page - 1) * sellersPagination.perPage + index + 1

                        return (
                          <tr key={sellerId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3 font-medium">{seller.businessName}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={seller.businessDescription}>
                              {seller.businessDescription || '—'}
                            </td>
                            <td className="px-4 py-3">{userName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{userEmail}</td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  seller.status === 'approved' ? 'default' :
                                  seller.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                                className="capitalize"
                              >
                                {seller.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(seller.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                {seller.status !== 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await sellerService.approveSeller(sellerId)
                                        setAllSellers((prev) =>
                                          prev.map((s) => {
                                            const sId = (s as any)._id || s.id
                                            return sId === sellerId ? { ...s, status: 'approved' } : s
                                          })
                                        )
                                        toast({
                                          title: 'Seller Approved',
                                          description: 'The seller has been approved and can now sell products.',
                                          variant: 'default',
                                        })
                                      } catch (error: any) {
                                        const errorMessage = error?.response?.data?.error || 'Failed to approve seller'
                                        toast({
                                          title: 'Approval Failed',
                                          description: errorMessage,
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {seller.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      try {
                                        await sellerService.rejectSeller(sellerId)
                                        setAllSellers((prev) =>
                                          prev.map((s) => {
                                            const sId = (s as any)._id || s.id
                                            return sId === sellerId ? { ...s, status: 'rejected' } : s
                                          })
                                        )
                                        toast({
                                          title: 'Seller Rejected',
                                          description: seller.status === 'approved'
                                            ? 'Seller approval has been revoked.'
                                            : 'The seller application has been rejected.',
                                          variant: 'default',
                                        })
                                      } catch (error: any) {
                                        const errorMessage = error?.response?.data?.error || 'Failed to reject seller'
                                        toast({
                                          title: 'Rejection Failed',
                                          description: errorMessage,
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                  >
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allSellers.length > 0 && allSellers.length > sellersPagination.perPage && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sellersPagination.page <= 1}
                    onClick={() => setSellersPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {sellersPagination.page} of {sellersTotalPages} ({allSellers.length} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sellersPagination.page >= sellersTotalPages}
                    onClick={() => setSellersPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Approvals</CardTitle>
              <CardDescription>Review and approve product listings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading products...</p>
              ) : allProducts.length === 0 ? (
                <p className="text-muted-foreground">No products yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium w-12">No.</th>
                        <th className="px-4 py-3 text-left font-medium w-16">Image</th>
                        <th className="px-4 py-3 text-left font-medium">Title</th>
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-left font-medium">Price</th>
                        <th className="px-4 py-3 text-left font-medium">Category</th>
                        <th className="px-4 py-3 text-left font-medium">Seller</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Created</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProducts.map((product, index) => {
                        const productId = product._id || product.id
                        const seller = product.sellerId as any
                        const sellerName = typeof seller === 'object' ? (seller?.fullName || seller?.email || 'N/A') : 'N/A'
                        const rowNo = (productsPagination.page - 1) * 10 + index + 1

                        return (
                          <tr key={productId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3">
                              <img
                                src={getFirstImageUrl(product)}
                                alt={product.title}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium max-w-[180px]" title={product.title}>
                              <span className="line-clamp-2">{product.title}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={product.description}>
                              {product.description || '—'}
                            </td>
                            <td className="px-4 py-3 font-medium text-primary">${product.price?.toFixed(2) ?? '0.00'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{product.category || '—'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{sellerName}</td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  product.status === 'approved' ? 'default' :
                                  product.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                                className="capitalize"
                              >
                                {product.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(product.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                {product.status !== 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await productService.approveProduct(productId)
                                        setAllProducts((prev) =>
                                          prev.map((p) => {
                                            const pId = p._id || p.id
                                            return pId === productId ? { ...p, status: 'approved' } : p
                                          })
                                        )
                                        const stats = await productService.getAdminProductStats()
                                        setProductStats(stats)
                                        toast({
                                          title: 'Product Approved',
                                          description: 'The product has been approved and is now visible to customers.',
                                          variant: 'default',
                                        })
                                      } catch (error: any) {
                                        const errorMessage = error?.response?.data?.error || 'Failed to approve product'
                                        toast({
                                          title: 'Approval Failed',
                                          description: errorMessage,
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {product.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await productService.rejectProduct(productId)
                                        setAllProducts((prev) =>
                                          prev.map((p) => {
                                            const pId = p._id || p.id
                                            return pId === productId ? { ...p, status: 'rejected' } : p
                                          })
                                        )
                                        const stats = await productService.getAdminProductStats()
                                        setProductStats(stats)
                                        toast({
                                          title: 'Product Rejected',
                                          description: 'The product has been rejected and will not be visible to customers.',
                                          variant: 'default',
                                        })
                                      } catch (error: any) {
                                        const errorMessage = error?.response?.data?.error || 'Failed to reject product'
                                        toast({
                                          title: 'Rejection Failed',
                                          description: errorMessage,
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                    variant="destructive"
                                  >
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allProducts.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={productsPagination.page <= 1}
                    onClick={() => fetchProducts(productsPagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {productsPagination.page} of {productsPagination.pages} ({productsPagination.total} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={productsPagination.page >= productsPagination.pages}
                    onClick={() => fetchProducts(productsPagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading users...</p>
              ) : allUsers.length === 0 ? (
                <p className="text-muted-foreground">No users yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium w-12">No.</th>
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user, index) => {
                        const userId = (user as any)._id || user.id
                        const isEditing = editingUserId === userId
                        const userName = (user as any).fullName || user.name || user.email || 'N/A'
                        const rowNo = (usersPagination.page - 1) * usersPagination.perPage + index + 1

                        return (
                          <tr key={userId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3 font-medium">{userName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={editingRole || user.role}
                                    onValueChange={(value) => setEditingRole(value)}
                                  >
                                    <SelectTrigger className="w-32 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="customer">Customer</SelectItem>
                                      <SelectItem value="seller">Seller</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRoleChange(userId, (editingRole || user.role) as any)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingUserId(null)
                                      setEditingRole('')
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <span className="capitalize font-medium">{user.role}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!isEditing && (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUserId(userId)
                                      setEditingRole(user.role)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit Role
                                  </Button>
                                  {user.role !== 'admin' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteUser(userId, userName)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allUsers.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersPagination.page <= 1}
                    onClick={() => setUsersPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {usersPagination.page} of {usersTotalPages} ({allUsers.length} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersPagination.page >= usersTotalPages}
                    onClick={() => setUsersPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${orderStats ? orderStats.totalRevenue.toFixed(2) : '0.00'}</div>
                <p className="text-xs text-muted-foreground">Excluding cancelled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{orderStats?.pendingOrders || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{orderStats?.deliveredOrders || 0}</div>
                <p className="text-xs text-muted-foreground">Completed orders</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>View and manage all marketplace orders</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading orders...</p>
              ) : allOrders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium w-12">No.</th>
                        <th className="px-4 py-3 text-left font-medium">Order ID</th>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">Items</th>
                        <th className="px-4 py-3 text-left font-medium">Customer</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order, index) => {
                        const orderId = order._id || order.id
                        const user = order.userId as any
                        const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
                        const rowNo = (ordersPagination.page - 1) * ordersPagination.perPage + index + 1

                        return (
                          <tr key={orderId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3 font-medium">#{orderId.slice(-8)}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">${order.totalAmount?.toFixed(2) ?? '0.00'}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'items'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{userEmail}</td>
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
                </div>
              )}
              {allOrders.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ordersPagination.page <= 1}
                    onClick={() => setOrdersPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {ordersPagination.page} of {ordersTotalPages} ({allOrders.length} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ordersPagination.page >= ordersTotalPages}
                    onClick={() => setOrdersPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Moderation</CardTitle>
              <CardDescription>Review and approve pending product reviews</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading reviews...</p>
              ) : allReviews.length === 0 ? (
                <p className="text-muted-foreground">No pending reviews</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium w-12">No.</th>
                        <th className="px-4 py-3 text-left font-medium">Product</th>
                        <th className="px-4 py-3 text-left font-medium">User</th>
                        <th className="px-4 py-3 text-left font-medium">Rating</th>
                        <th className="px-4 py-3 text-left font-medium">Comment</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Created</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReviews.map((review, index) => {
                        const reviewId = review.id || review._id
                        const product = review.productId as any
                        const productTitle = typeof product === 'object' ? (product?.title || 'N/A') : 'N/A'
                        const user = review.userId as any
                        const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
                        const userName = typeof user === 'object' ? (user?.fullName || userEmail) : userEmail
                        const rowNo = (reviewsPagination.page - 1) * reviewsPagination.limit + index + 1

                        return (
                          <tr key={reviewId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={productTitle}>
                              {productTitle}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{userName}</p>
                                <p className="text-xs text-muted-foreground">{userEmail}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <RatingDisplay rating={review.rating} size="sm" />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate" title={review.comment}>
                              {review.comment || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  review.status === 'approved' ? 'default' :
                                  review.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                                className="capitalize"
                              >
                                {review.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                {review.status !== 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      if (!reviewId) {
                                        toast({
                                          title: 'Error',
                                          description: 'Invalid review ID',
                                          variant: 'destructive',
                                        })
                                        return
                                      }
                                      try {
                                        await reviewService.approveReview(reviewId)
                                        toast({
                                          title: 'Review Approved',
                                          description: 'The review has been approved and is now visible to customers.',
                                          variant: 'default',
                                        })
                                        // Refresh reviews list to remove approved review from pending list
                                        await fetchReviews(reviewsPagination.page)
                                      } catch (error: any) {
                                        console.error('Failed to approve review:', error)
                                        const errorMessage = error?.response?.data?.error || error?.message || 'Failed to approve review'
                                        toast({
                                          title: 'Approval Failed',
                                          description: errorMessage,
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {review.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (!reviewId) {
                                        toast({
                                          title: 'Error',
                                          description: 'Invalid review ID',
                                          variant: 'destructive',
                                        })
                                        return
                                      }
                                      try {
                                        await reviewService.rejectReview(reviewId)
                                        toast({
                                          title: 'Review Rejected',
                                          description: 'The review has been rejected and will not be visible to customers.',
                                          variant: 'default',
                                        })
                                        // Refresh reviews list to remove rejected review from pending list
                                        await fetchReviews(reviewsPagination.page)
                                      } catch (error: any) {
                                        console.error('Failed to reject review:', error)
                                        const errorMessage = error?.response?.data?.error || error?.message || 'Failed to reject review'
                                        toast({
                                          title: 'Rejection Failed',
                                          description: errorMessage,
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                  >
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allReviews.length > 0 && reviewsPagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewsPagination.page <= 1}
                    onClick={() => {
                      const newPage = reviewsPagination.page - 1
                      setReviewsPagination((p) => ({ ...p, page: newPage }))
                      fetchReviews(newPage)
                    }}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {reviewsPagination.page} of {reviewsPagination.pages} ({reviewsPagination.total} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewsPagination.page >= reviewsPagination.pages}
                    onClick={() => {
                      const newPage = reviewsPagination.page + 1
                      setReviewsPagination((p) => ({ ...p, page: newPage }))
                      fetchReviews(newPage)
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={reportsPagination.page === 1 && !allReports.some(r => r.status !== 'pending') ? 'default' : 'outline'}
              onClick={() => fetchReports(1, 'pending')}
            >
              Pending ({pendingReportsCount})
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchReports(1, 'resolved')}
            >
              Resolved
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchReports(1, 'dismissed')}
            >
              Dismissed
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchReports(1)}
            >
              All Reports
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Reports Management</CardTitle>
              <CardDescription>Review and manage user reports for products, users, and reviews</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading reports...</p>
              ) : allReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">No reports found</p>
                  <p className="text-sm text-muted-foreground mt-1">Reports will appear here when users submit them</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allReports.map((report) => {
                    const reportId = report.id || report._id
                    const reporter = report.reporterId as any
                    const reporterEmail = typeof reporter === 'object' ? (reporter?.email || 'N/A') : 'N/A'
                    const reporterName = typeof reporter === 'object' ? (reporter?.fullName || reporterEmail) : reporterEmail
                    const isResolving = resolvingReportId === reportId
                    const isDismissing = dismissingReportId === reportId
                    const isPending = report.status === 'pending'

                    return (
                      <Card key={reportId} className="border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">
                                  Report #{reportId.slice(-8)}
                                </CardTitle>
                                <Badge
                                  variant={
                                    report.status === 'resolved' ? 'default' :
                                    report.status === 'dismissed' ? 'secondary' :
                                    'destructive'
                                  }
                                  className="capitalize"
                                >
                                  {report.status}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {report.reportedType}
                                </Badge>
                              </div>
                              <CardDescription>
                                Reported by {reporterName} ({reporterEmail}) on{' '}
                                {new Date(report.createdAt).toLocaleDateString()} at{' '}
                                {new Date(report.createdAt).toLocaleTimeString()}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Reason:</p>
                            <p className="text-sm text-muted-foreground">{report.reason}</p>
                          </div>
                          {report.description && (
                            <div>
                              <p className="text-sm font-medium mb-1">Description:</p>
                              <p className="text-sm text-muted-foreground">{report.description}</p>
                            </div>
                          )}
                          
                          {/* Reported Content Preview */}
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">Reported Content:</p>
                            {report.reportedContent ? (
                              <div className="bg-muted/50 p-3 rounded-lg">
                                {report.reportedType === 'product' && (
                                  <div className="flex items-start gap-3">
                                    {report.reportedContent.imageUrl || (report.reportedContent.imageUrls && report.reportedContent.imageUrls[0]) ? (
                                      <img
                                        src={report.reportedContent.imageUrl || report.reportedContent.imageUrls[0]}
                                        alt={report.reportedContent.title}
                                        className="h-16 w-16 rounded object-cover"
                                      />
                                    ) : null}
                                    <div className="flex-1">
                                      <p className="font-medium">{report.reportedContent.title}</p>
                                      <p className="text-sm text-muted-foreground">${report.reportedContent.price?.toFixed(2)}</p>
                                      <p className="text-xs text-muted-foreground">Category: {report.reportedContent.category}</p>
                                    </div>
                                  </div>
                                )}
                                {report.reportedType === 'user' && (
                                  <div>
                                    <p className="font-medium">{report.reportedContent.fullName || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground">{report.reportedContent.email}</p>
                                    <p className="text-xs text-muted-foreground">Role: {report.reportedContent.role}</p>
                                  </div>
                                )}
                                {report.reportedType === 'review' && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <RatingDisplay rating={report.reportedContent.rating} size="sm" />
                                      <span className="text-xs text-muted-foreground">
                                        by {typeof report.reportedContent.userId === 'object' 
                                          ? (report.reportedContent.userId?.fullName || report.reportedContent.userId?.email || 'N/A')
                                          : 'N/A'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{report.reportedContent.comment || 'No comment'}</p>
                                    {typeof report.reportedContent.productId === 'object' && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Product: {report.reportedContent.productId?.title || 'N/A'}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Content has been deleted</p>
                            )}
                          </div>

                          {report.adminNotes && (
                            <div className="border-t pt-4">
                              <p className="text-sm font-medium mb-1">Admin Notes:</p>
                              <p className="text-sm text-muted-foreground">{report.adminNotes}</p>
                              {report.resolvedBy && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Resolved by {typeof report.resolvedBy === 'object' 
                                    ? (report.resolvedBy?.fullName || report.resolvedBy?.email || 'N/A')
                                    : 'N/A'} on {report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              )}
                            </div>
                          )}

                          {isPending && (
                            <div className="border-t pt-4 space-y-2">
                              <div>
                                <p className="text-sm font-medium mb-2">Admin Notes (optional):</p>
                                <textarea
                                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                                  placeholder="Add notes about this report..."
                                  value={reportAdminNotes[reportId] || ''}
                                  onChange={(e) => setReportAdminNotes({ ...reportAdminNotes, [reportId]: e.target.value })}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    setResolvingReportId(reportId)
                                    try {
                                      await reportService.resolveReport(reportId, {
                                        adminNotes: reportAdminNotes[reportId] || undefined
                                      })
                                      toast({
                                        title: 'Report Resolved',
                                        description: 'The report has been marked as resolved.',
                                        variant: 'default',
                                      })
                                      await fetchReports(reportsPagination.page)
                                      await fetchPendingReportsCount()
                                      setReportAdminNotes({ ...reportAdminNotes, [reportId]: '' })
                                    } catch (error: any) {
                                      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to resolve report'
                                      toast({
                                        title: 'Resolution Failed',
                                        description: errorMessage,
                                        variant: 'destructive',
                                      })
                                    } finally {
                                      setResolvingReportId(null)
                                    }
                                  }}
                                  disabled={isResolving || isDismissing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isResolving ? 'Resolving...' : 'Resolve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    setDismissingReportId(reportId)
                                    try {
                                      await reportService.dismissReport(reportId, {
                                        adminNotes: reportAdminNotes[reportId] || undefined
                                      })
                                      toast({
                                        title: 'Report Dismissed',
                                        description: 'The report has been dismissed.',
                                        variant: 'default',
                                      })
                                      await fetchReports(reportsPagination.page)
                                      await fetchPendingReportsCount()
                                      setReportAdminNotes({ ...reportAdminNotes, [reportId]: '' })
                                    } catch (error: any) {
                                      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to dismiss report'
                                      toast({
                                        title: 'Dismissal Failed',
                                        description: errorMessage,
                                        variant: 'destructive',
                                      })
                                    } finally {
                                      setDismissingReportId(null)
                                    }
                                  }}
                                  disabled={isResolving || isDismissing}
                                >
                                  {isDismissing ? 'Dismissing...' : 'Dismiss'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
              {allReports.length > 0 && reportsPagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reportsPagination.page <= 1}
                    onClick={() => {
                      const newPage = reportsPagination.page - 1
                      setReportsPagination((p) => ({ ...p, page: newPage }))
                      fetchReports(newPage)
                    }}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {reportsPagination.page} of {reportsPagination.pages} ({reportsPagination.total} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reportsPagination.page >= reportsPagination.pages}
                    onClick={() => {
                      const newPage = reportsPagination.page + 1
                      setReportsPagination((p) => ({ ...p, page: newPage }))
                      fetchReports(newPage)
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
