import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, ShoppingBag, Store, AlertCircle } from 'lucide-react'
import * as userService from '../../services/userService'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'

export default function AdminProfile() {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSellers, setAllSellers] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, sellers, products] = await Promise.all([
          userService.getAllUsers(),
          sellerService.getAllSellers(),
          productService.getAllProducts(),
        ])
        setAllUsers(users)
        setAllSellers(sellers)
        setAllProducts(products)
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const pendingSellers = allSellers.filter((s) => s.status === 'pending')
  const pendingProducts = allProducts.filter((p) => p.status === 'pending')
  const activeSellers = allSellers.filter((s) => s.status === 'approved').length

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
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$234K</div>
            <p className="text-xs text-muted-foreground">Total marketplace revenue</p>
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
                            <button
                              onClick={async () => {
                                try {
                                  await sellerService.approveSeller(sellerId)
                                  setAllSellers((prev) =>
                                    prev.map((s) => {
                                      const sId = (s as any)._id || s.id
                                      return sId === sellerId ? { ...s, status: 'approved' } : s
                                    })
                                  )
                                } catch (error) {
                                  console.error('Failed to approve seller:', error)
                                }
                              }}
                              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await sellerService.rejectSeller(sellerId)
                                  setAllSellers((prev) =>
                                    prev.map((s) => {
                                      const sId = (s as any)._id || s.id
                                      return sId === sellerId ? { ...s, status: 'rejected' } : s
                                    })
                                  )
                                } catch (error) {
                                  console.error('Failed to reject seller:', error)
                                }
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Reject
                            </button>
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
                            <button
                              onClick={async () => {
                                try {
                                  await productService.approveProduct(productId)
                                  setAllProducts((prev) =>
                                    prev.map((p) => {
                                      const pId = p._id || p.id
                                      return pId === productId ? { ...p, status: 'approved' } : p
                                    })
                                  )
                                } catch (error) {
                                  console.error('Failed to approve product:', error)
                                }
                              }}
                              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await productService.rejectProduct(productId)
                                  setAllProducts((prev) =>
                                    prev.map((p) => {
                                      const pId = p._id || p.id
                                      return pId === productId ? { ...p, status: 'rejected' } : p
                                    })
                                  )
                                } catch (error) {
                                  console.error('Failed to reject product:', error)
                                }
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Reject
                            </button>
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
                    return (
                      <div key={userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{(user as any).fullName || user.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-sm capitalize">{user.role}</p>
                        </div>
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
