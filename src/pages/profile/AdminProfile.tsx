import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Users, ShoppingBag, Store, AlertCircle, Trash2, Edit, Package, DollarSign, TrendingUp } from 'lucide-react'
import * as userService from '../../services/userService'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import { getFirstImageUrl } from '../../utils/imageUtils'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'

export default function AdminProfile() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSellers, setAllSellers] = useState<any[]>([])
  const [sellersPagination, setSellersPagination] = useState({ page: 1, perPage: 10 })
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [productStats, setProductStats] = useState({ total: 0, pending: 0 })
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [orderStats, setOrderStats] = useState<{ totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string>('')

  const fetchProducts = async (page = 1) => {
    const response = await productService.getAllProducts({ page, limit: 10 })
    setAllProducts(response.products)
    setProductsPagination(response.pagination)
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
  
  // Recent activity (last 5 orders)
  const recentOrders = allOrders.slice(0, 5)

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
      {recentOrders.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest orders in the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentOrders.map((order) => {
                const orderId = order._id || order.id
                return (
                  <div key={orderId} className="flex items-center gap-4 py-3 hover:bg-accent/50 transition-colors">
                    <span className="font-medium text-sm">Order #{orderId.slice(-8)}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                    <span className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="font-medium text-sm">${order.totalAmount.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">{order.items.length} items</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
          <TabsTrigger value="reports" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Reports
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
                <div className="space-y-4">
                  {allProducts.map((product) => {
                    const productId = product._id || product.id
                    const seller = product.sellerId as any
                    const sellerName = typeof seller === 'object' ? (seller?.fullName || seller?.email || 'N/A') : 'N/A'
                    
                    return (
                      <div key={productId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                        <img
                          src={getFirstImageUrl(product)}
                          alt={product.title}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <p className="font-medium line-clamp-2" title={product.title}>{product.title}</p>
                            <Badge variant={
                              product.status === 'approved' ? 'default' :
                              product.status === 'rejected' ? 'destructive' :
                              'secondary'
                            } className="capitalize">
                              {product.status}
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <p className="font-medium text-primary">${product.price.toFixed(2)}</p>
                            <p className="text-muted-foreground">Category: {product.category}</p>
                            <p className="text-muted-foreground">Seller: {sellerName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {product.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
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
                                    title: 'Product Approved Successfully',
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
                            <Button
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
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {productsPagination.pages > 1 && (
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
                <div className="space-y-4">
                  {allUsers.map((user) => {
                    const userId = (user as any)._id || user.id
                    const isEditing = editingUserId === userId
                    const userName = (user as any).fullName || user.name || user.email || 'N/A'
                    
                    return (
                      <div key={userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{userName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-2">
                              <Select
                                value={editingRole || user.role}
                                onValueChange={(value) => setEditingRole(value)}
                              >
                                <SelectTrigger className="w-32">
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
                            <p className="text-sm capitalize font-medium">{user.role}</p>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex gap-2">
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
                      </div>
                    )
                  })}
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
                <div className="divide-y">
                  {allOrders.map((order) => {
                    const orderId = order._id || order.id
                    const user = order.userId as any
                    const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
                    
                    return (
                      <div key={orderId} className="flex items-center gap-4 py-3 hover:bg-accent/50 transition-colors">
                        <span className="font-medium text-sm">Order #{orderId.slice(-8)}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                        </span>
                        <span className={`${ORDER_STATUS_CLASS} ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="font-medium text-sm">${order.totalAmount.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </span>
                        <span className="text-sm text-muted-foreground">Customer: {userEmail}</span>
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

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>Review user and product reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No pending reports</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
