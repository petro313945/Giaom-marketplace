import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, ShoppingBag, Store, AlertCircle, Trash2, Edit, Package } from 'lucide-react'
import * as userService from '../../services/userService'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'

export default function AdminProfile() {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSellers, setAllSellers] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [orderStats, setOrderStats] = useState<{ totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, sellers, products, ordersData] = await Promise.all([
          userService.getAllUsers(),
          sellerService.getAllSellers(),
          productService.getAllProducts(),
          orderService.getAllOrders(),
        ])
        setAllUsers(users)
        setAllSellers(sellers)
        setAllProducts(products)
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
      alert('User role updated successfully')
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to update user role')
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
      alert('User deleted successfully')
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to delete user')
    }
  }

  const pendingSellers = allSellers.filter((s) => s.status === 'pending')
  const pendingProducts = allProducts.filter((p) => p.status === 'pending')
  const activeSellers = allSellers.filter((s) => s.status === 'approved').length
  
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
            <div className="text-2xl font-bold">{allProducts.length}</div>
            <p className="text-xs text-muted-foreground">{pendingProducts.length} pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orderStats ? (orderStats.totalRevenue / 1000).toFixed(1) + 'K' : '0'}
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
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const orderId = order._id || order.id
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
                  <div key={orderId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Order #{orderId.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                    </div>
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
            {pendingProducts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {pendingProducts.length}
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
                <div className="space-y-4">
                  {allSellers.map((seller) => {
                    const sellerId = (seller as any)._id || seller.id
                    return (
                      <div key={sellerId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{seller.businessName}</p>
                          <p className="text-sm text-muted-foreground capitalize">{seller.status}</p>
                        </div>
                        {seller.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={async () => {
                                try {
                                  await sellerService.approveSeller(sellerId)
                                  setAllSellers((prev) =>
                                    prev.map((s) => {
                                      const sId = (s as any)._id || s.id
                                      return sId === sellerId ? { ...s, status: 'approved' } : s
                                    })
                                  )
                                  alert('Seller approved successfully')
                                } catch (error: any) {
                                  alert(error?.response?.data?.error || 'Failed to approve seller')
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  await sellerService.rejectSeller(sellerId)
                                  setAllSellers((prev) =>
                                    prev.map((s) => {
                                      const sId = (s as any)._id || s.id
                                      return sId === sellerId ? { ...s, status: 'rejected' } : s
                                    })
                                  )
                                  alert('Seller rejected')
                                } catch (error: any) {
                                  alert(error?.response?.data?.error || 'Failed to reject seller')
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
                    return (
                      <div key={productId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                          <p className="text-sm capitalize">{product.status}</p>
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
                                  alert('Product approved successfully')
                                } catch (error: any) {
                                  alert(error?.response?.data?.error || 'Failed to approve product')
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
                                  alert('Product rejected')
                                } catch (error: any) {
                                  alert(error?.response?.data?.error || 'Failed to reject product')
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
                <div className="space-y-4">
                  {allOrders.map((order) => {
                    const orderId = order._id || order.id
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
                    const user = order.userId as any
                    const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
                    
                    return (
                      <div key={orderId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Order #{orderId.slice(-8)}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Customer: {userEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-sm font-medium">${order.totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        <Button variant="outline" asChild>
                          <a href={`/order/${orderId}`}>View Details</a>
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
