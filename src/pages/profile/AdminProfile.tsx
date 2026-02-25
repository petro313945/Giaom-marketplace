import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Users, ShoppingBag, Store, AlertCircle, Trash2, Edit, Package, DollarSign, TrendingUp, ArrowRight, ShoppingCart, Clock, Star, Eye, Wallet, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import * as userService from '../../services/userService'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import * as reviewService from '../../services/reviewService'
import * as reportService from '../../services/reportService'
import * as payoutService from '../../services/payoutService'
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
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [allPayouts, setAllPayouts] = useState<payoutService.Payout[]>([])
  const [payoutsPagination, setPayoutsPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('all')
  const [payoutStats, setPayoutStats] = useState<payoutService.PayoutStats | null>(null)
  const [updatingPayoutId, setUpdatingPayoutId] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<payoutService.Payout | null>(null)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutStatusUpdate, setPayoutStatusUpdate] = useState<{ status: string; failureReason?: string }>({ status: '' })
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null)

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

  const fetchPayouts = async (page = 1, status?: string) => {
    try {
      const params: payoutService.GetAllPayoutsParams = { page, limit: 20 }
      if (status && status !== 'all') {
        params.status = status
      }
      const response = await payoutService.getAllPayouts(params)
      setAllPayouts(response.payouts)
      setPayoutsPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
    }
  }

  const fetchPayoutStats = async () => {
    try {
      const stats = await payoutService.getPayoutStats()
      setPayoutStats(stats)
    } catch (error) {
      console.error('Failed to fetch payout stats:', error)
    }
  }

  const handleUpdatePayoutStatus = async (payoutId: string, status: string, failureReason?: string) => {
    setUpdatingPayoutId(payoutId)
    try {
      await payoutService.updatePayoutStatus(payoutId, { status: status as any, failureReason })
      toast({
        title: 'Payout Updated',
        description: `Payout status has been updated to ${status}.`,
        variant: 'default',
      })
      await fetchPayouts(payoutsPagination.page, payoutStatusFilter)
      await fetchPayoutStats()
      setPayoutDialogOpen(false)
      setSelectedPayout(null)
      setPayoutStatusUpdate({ status: '' })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update payout status'
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUpdatingPayoutId(null)
    }
  }

  useEffect(() => {
    if (payoutStatusFilter) {
      fetchPayouts(1, payoutStatusFilter)
      fetchPayoutStats()
    }
  }, [payoutStatusFilter])

  useEffect(() => {
    fetchPayouts(payoutsPagination.page, payoutStatusFilter)
  }, [payoutsPagination.page])

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

  const handleDeleteUser = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName })
    setDeleteUserDialogOpen(true)
  }

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return

    try {
      await userService.deleteUser(userToDelete.id)
      setAllUsers((prev) => prev.filter((u) => {
        const uId = (u as any)._id || u.id
        return uId !== userToDelete.id
      }))
      setDeleteUserDialogOpen(false)
      setUserToDelete(null)
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
          <TabsTrigger value="payouts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payouts
            {payoutStats && payoutStats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {payoutStats.pending}
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
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left font-medium w-14">No.</th>
                        <th className="h-12 px-4 text-left font-medium">Report ID</th>
                        <th className="h-12 px-4 text-left font-medium">Type</th>
                        <th className="h-12 px-4 text-left font-medium">Reporter</th>
                        <th className="h-12 px-4 text-left font-medium">Reason</th>
                        <th className="h-12 px-4 text-left font-medium">Status</th>
                        <th className="h-12 px-4 text-left font-medium">Reported Content</th>
                        <th className="h-12 px-4 text-left font-medium">Date</th>
                        <th className="h-12 px-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReports.map((report, index) => {
                        const reportId = report.id || report._id
                        const reporter = report.reporterId as any
                        const reporterEmail = typeof reporter === 'object' ? (reporter?.email || 'N/A') : 'N/A'
                        const reporterName = typeof reporter === 'object' ? (reporter?.fullName || reporterEmail) : reporterEmail
                        const isResolving = resolvingReportId === reportId
                        const isDismissing = dismissingReportId === reportId
                        const isPending = report.status === 'pending'
                        const limit = reportsPagination.limit || 10
                        const rowNo = ((reportsPagination.page - 1) * limit) + index + 1

                        // Get reported content summary
                        let contentSummary = 'N/A'
                        if (report.reportedContent) {
                          if (report.reportedType === 'product') {
                            contentSummary = report.reportedContent.title || 'N/A'
                          } else if (report.reportedType === 'user') {
                            contentSummary = report.reportedContent.fullName || report.reportedContent.email || 'N/A'
                          } else if (report.reportedType === 'review') {
                            contentSummary = report.reportedContent.comment 
                              ? (report.reportedContent.comment.substring(0, 50) + (report.reportedContent.comment.length > 50 ? '...' : ''))
                              : 'No comment'
                          }
                        } else {
                          contentSummary = 'Deleted'
                        }

                        return (
                          <tr key={reportId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="h-16 px-4 align-middle font-medium">{rowNo}</td>
                            <td className="h-16 px-4 align-middle">
                              <span className="font-mono text-xs">#{reportId.slice(-8)}</span>
                            </td>
                            <td className="h-16 px-4 align-middle">
                              <Badge variant="outline" className="capitalize">
                                {report.reportedType}
                              </Badge>
                            </td>
                            <td className="h-16 px-4 align-middle">
                              <div className="flex flex-col">
                                <span className="font-medium">{reporterName}</span>
                                <span className="text-xs text-muted-foreground">{reporterEmail}</span>
                              </div>
                            </td>
                            <td className="h-16 px-4 align-middle">
                              <p className="max-w-[150px] truncate" title={report.reason}>
                                {report.reason}
                              </p>
                            </td>
                            <td className="h-16 px-4 align-middle">
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
                            </td>
                            <td className="h-16 px-4 align-middle">
                              <p className="max-w-[150px] truncate" title={contentSummary}>
                                {contentSummary}
                              </p>
                            </td>
                            <td className="h-16 px-4 align-middle">
                              <div className="flex flex-col">
                                <span className="text-xs">{new Date(report.createdAt).toLocaleDateString()}</span>
                                <span className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleTimeString()}</span>
                              </div>
                            </td>
                            <td className="h-16 px-4 align-middle text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    setReportDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {isPending && (
                                  <>
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
                                      {isResolving ? '...' : 'Resolve'}
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
                                      {isDismissing ? '...' : 'Dismiss'}
                                    </Button>
                                  </>
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

          {/* Report Details Dialog */}
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {selectedReport && (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      Report #{selectedReport.id?.slice(-8) || selectedReport._id?.slice(-8)}
                    </DialogTitle>
                    <DialogDescription>
                      Detailed information about this report
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedReport.status === 'resolved' ? 'default' :
                          selectedReport.status === 'dismissed' ? 'secondary' :
                          'destructive'
                        }
                        className="capitalize"
                      >
                        {selectedReport.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {selectedReport.reportedType}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Reporter:</p>
                      <p className="text-sm text-muted-foreground">
                        {typeof selectedReport.reporterId === 'object' 
                          ? `${selectedReport.reporterId?.fullName || 'N/A'} (${selectedReport.reporterId?.email || 'N/A'})`
                          : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Date:</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedReport.createdAt).toLocaleDateString()} at{' '}
                        {new Date(selectedReport.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Reason:</p>
                      <p className="text-sm text-muted-foreground">{selectedReport.reason}</p>
                    </div>

                    {selectedReport.description && (
                      <div>
                        <p className="text-sm font-medium mb-1">Description:</p>
                        <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Reported Content:</p>
                      {selectedReport.reportedContent ? (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          {selectedReport.reportedType === 'product' && (
                            <div className="flex items-start gap-3">
                              {selectedReport.reportedContent.imageUrl || (selectedReport.reportedContent.imageUrls && selectedReport.reportedContent.imageUrls[0]) ? (
                                <img
                                  src={selectedReport.reportedContent.imageUrl || selectedReport.reportedContent.imageUrls[0]}
                                  alt={selectedReport.reportedContent.title}
                                  className="h-16 w-16 rounded object-cover"
                                />
                              ) : null}
                              <div className="flex-1">
                                <p className="font-medium">{selectedReport.reportedContent.title}</p>
                                <p className="text-sm text-muted-foreground">${selectedReport.reportedContent.price?.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Category: {selectedReport.reportedContent.category}</p>
                              </div>
                            </div>
                          )}
                          {selectedReport.reportedType === 'user' && (
                            <div>
                              <p className="font-medium">{selectedReport.reportedContent.fullName || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{selectedReport.reportedContent.email}</p>
                              <p className="text-xs text-muted-foreground">Role: {selectedReport.reportedContent.role}</p>
                            </div>
                          )}
                          {selectedReport.reportedType === 'review' && (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <RatingDisplay rating={selectedReport.reportedContent.rating} size="sm" />
                                <span className="text-xs text-muted-foreground">
                                  by {typeof selectedReport.reportedContent.userId === 'object' 
                                    ? (selectedReport.reportedContent.userId?.fullName || selectedReport.reportedContent.userId?.email || 'N/A')
                                    : 'N/A'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{selectedReport.reportedContent.comment || 'No comment'}</p>
                              {typeof selectedReport.reportedContent.productId === 'object' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Product: {selectedReport.reportedContent.productId?.title || 'N/A'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Content has been deleted</p>
                      )}
                    </div>

                    {selectedReport.adminNotes && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-1">Admin Notes:</p>
                        <p className="text-sm text-muted-foreground">{selectedReport.adminNotes}</p>
                        {selectedReport.resolvedBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Resolved by {typeof selectedReport.resolvedBy === 'object' 
                              ? (selectedReport.resolvedBy?.fullName || selectedReport.resolvedBy?.email || 'N/A')
                              : 'N/A'} on {selectedReport.resolvedAt ? new Date(selectedReport.resolvedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>
                    )}

                    {selectedReport.status === 'pending' && (
                      <div className="border-t pt-4 space-y-2">
                        <div>
                          <p className="text-sm font-medium mb-2">Admin Notes (optional):</p>
                          <textarea
                            className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                            placeholder="Add notes about this report..."
                            value={reportAdminNotes[selectedReport.id || selectedReport._id] || ''}
                            onChange={(e) => setReportAdminNotes({ 
                              ...reportAdminNotes, 
                              [selectedReport.id || selectedReport._id]: e.target.value 
                            })}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            size="sm"
                            onClick={async () => {
                              const reportId = selectedReport.id || selectedReport._id
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
                                setReportDialogOpen(false)
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
                            disabled={resolvingReportId === (selectedReport.id || selectedReport._id) || dismissingReportId === (selectedReport.id || selectedReport._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {resolvingReportId === (selectedReport.id || selectedReport._id) ? 'Resolving...' : 'Resolve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const reportId = selectedReport.id || selectedReport._id
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
                                setReportDialogOpen(false)
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
                            disabled={resolvingReportId === (selectedReport.id || selectedReport._id) || dismissingReportId === (selectedReport.id || selectedReport._id)}
                          >
                            {dismissingReportId === (selectedReport.id || selectedReport._id) ? 'Dismissing...' : 'Dismiss'}
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          {/* Payout Statistics */}
          {payoutStats && (
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{payoutStats.total}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{payoutStats.pending}</div>
                  <p className="text-xs text-muted-foreground">${payoutStats.pendingAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{payoutStats.completed}</div>
                  <p className="text-xs text-muted-foreground">${payoutStats.totalPaidOut.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${payoutStats.totalCommission.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Marketplace earnings</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payouts List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payout Management</CardTitle>
                  <CardDescription>Review and process seller payout requests</CardDescription>
                </div>
                <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {allPayouts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payouts found</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Date</th>
                          <th className="h-10 px-4 text-left font-medium">Seller</th>
                          <th className="h-10 px-4 text-left font-medium">Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Commission</th>
                          <th className="h-10 px-4 text-left font-medium">Net Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Status</th>
                          <th className="h-10 px-4 text-left font-medium">Orders</th>
                          <th className="h-10 px-4 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPayouts.map((payout) => {
                          const seller = (payout as any).sellerId
                          const sellerName = seller?.fullName || seller?.email || 'Unknown'
                          return (
                            <tr
                              key={payout.id}
                              className="border-b transition-colors hover:bg-muted/50 last:border-0"
                            >
                              <td className="px-4 py-3 text-muted-foreground">
                                {new Date(payout.requestedAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 font-medium">{sellerName}</td>
                              <td className="px-4 py-3">${payout.amount.toFixed(2)}</td>
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
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {payout.orderCount} order{payout.orderCount !== 1 ? 's' : ''}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayout(payout)
                                    setPayoutStatusUpdate({ status: payout.status })
                                    setPayoutDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Manage
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {payoutsPagination.pages > 1 && (
                    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                      <span className="text-muted-foreground">
                        Showing {((payoutsPagination.page - 1) * payoutsPagination.limit) + 1}–
                        {Math.min(payoutsPagination.page * payoutsPagination.limit, payoutsPagination.total)} of{' '}
                        {payoutsPagination.total} payouts
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={payoutsPagination.page <= 1}
                          onClick={() => setPayoutsPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-muted-foreground min-w-[120px] text-center">
                          Page {payoutsPagination.page} of {payoutsPagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={payoutsPagination.page >= payoutsPagination.pages}
                          onClick={() => setPayoutsPagination((p) => ({ ...p, page: Math.min(payoutsPagination.pages, p.page + 1) }))}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout Management Dialog */}
          <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manage Payout</DialogTitle>
                <DialogDescription>
                  Update payout status and view details
                </DialogDescription>
              </DialogHeader>
              {selectedPayout && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Seller</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedPayout as any).sellerId?.fullName || (selectedPayout as any).sellerId?.email || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Requested Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedPayout.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Amount</p>
                      <p className="text-sm text-muted-foreground">${selectedPayout.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Commission</p>
                      <p className="text-sm text-muted-foreground">${selectedPayout.commission.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Net Amount</p>
                      <p className="text-sm font-bold text-green-600">${selectedPayout.netAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Orders</p>
                      <p className="text-sm text-muted-foreground">{selectedPayout.orderCount} orders</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Update Status</p>
                    <Select
                      value={payoutStatusUpdate.status}
                      onValueChange={(value) => setPayoutStatusUpdate({ ...payoutStatusUpdate, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(payoutStatusUpdate.status === 'failed' || payoutStatusUpdate.status === 'cancelled') && (
                    <div>
                      <p className="text-sm font-medium mb-2">Failure Reason (Optional)</p>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                        placeholder="Enter reason for failure or cancellation..."
                        value={payoutStatusUpdate.failureReason || ''}
                        onChange={(e) => setPayoutStatusUpdate({ ...payoutStatusUpdate, failureReason: e.target.value })}
                      />
                    </div>
                  )}
                  {selectedPayout.failureReason && (
                    <div>
                      <p className="text-sm font-medium">Previous Failure Reason</p>
                      <p className="text-sm text-red-600">{selectedPayout.failureReason}</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPayoutDialogOpen(false)
                    setSelectedPayout(null)
                    setPayoutStatusUpdate({ status: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPayout && payoutStatusUpdate.status) {
                      handleUpdatePayoutStatus(
                        selectedPayout.id,
                        payoutStatusUpdate.status,
                        payoutStatusUpdate.failureReason
                      )
                    }
                  }}
                  disabled={!payoutStatusUpdate.status || updatingPayoutId === selectedPayout?.id}
                >
                  {updatingPayoutId === selectedPayout?.id ? 'Updating...' : 'Update Status'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && `Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteUserConfirm}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
