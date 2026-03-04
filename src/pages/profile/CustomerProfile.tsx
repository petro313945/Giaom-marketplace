import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'
import { Package, Heart, MapPin, User, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Star, ShoppingCart, ShoppingBag, DollarSign, TrendingUp, BarChart3, RotateCcw, StoreIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import * as orderService from '../../services/orderService'
import * as userService from '../../services/userService'
import * as addressService from '../../services/addressService'
import * as wishlistService from '../../services/wishlistService'
import { getFirstImageUrl } from '../../utils/imageUtils'
import { Link } from 'react-router-dom'
import type { Order } from '../../services/orderService'
import type { Address, CreateAddressData } from '../../services/addressService'
import type { WishlistItem } from '../../services/wishlistService'
import type { Product } from '../../services/productService'

interface ProfileFormData {
  fullName: string
}

interface AddressFormData {
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  isDefault: boolean
}

interface CustomerProfileProps {
  defaultTab?: string
}

export default function CustomerProfile({ defaultTab }: CustomerProfileProps = {}) {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Valid tab values
  const validTabs = ['statistics', 'orders', 'wishlist', 'addresses', 'bought-product', 'profile']
  
  // Get active tab from URL or use default
  const urlTab = searchParams.get('tab')
  const activeTab = (urlTab && validTabs.includes(urlTab)) 
    ? urlTab 
    : (defaultTab && validTabs.includes(defaultTab)) 
      ? defaultTab 
      : 'statistics'
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10 })
  const [ordersSortBy, setOrdersSortBy] = useState<string>('date')
  const [ordersSortOrder, setOrdersSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [deleteAddressDialogOpen, setDeleteAddressDialogOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loadingWishlist, setLoadingWishlist] = useState(false)
  const [boughtProductsPagination, setBoughtProductsPagination] = useState({ page: 1, limit: 10 })
  const [boughtProductsSortBy, setBoughtProductsSortBy] = useState<string>('date')
  const [boughtProductsSortOrder, setBoughtProductsSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
    },
  })

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getUserOrders()
        setOrders(response.orders)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true)
      try {
        const response = await addressService.getUserAddresses()
        setAddresses(response.addresses)
      } catch (error) {
        console.error('Failed to fetch addresses:', error)
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchAddresses()
  }, [])

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoadingWishlist(true)
      try {
        const response = await wishlistService.getWishlist()
        setWishlistItems(response.wishlist.items)
      } catch (error) {
        console.error('Failed to fetch wishlist:', error)
      } finally {
        setLoadingWishlist(false)
      }
    }

    fetchWishlist()
  }, [])

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
      })
    }
  }, [user, reset])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    setProfileError(null)
    
    try {
      const response = await userService.updateUserProfile({ fullName: data.fullName })
      updateUser(response.user)
      setIsEditingProfile(false)
    } catch (error: any) {
      setProfileError(error.response?.data?.error || error.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setProfileError(null)
    if (user) {
      reset({
        fullName: user.fullName || '',
      })
    }
  }

  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    formState: { errors: addressErrors },
    reset: resetAddress,
    setValue: setAddressValue,
  } = useForm<AddressFormData>()

  const handleAddAddress = () => {
    setIsAddingAddress(true)
    setEditingAddressId(null)
    resetAddress({
      fullName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
      isDefault: false,
    })
  }

  const handleEditAddress = (address: Address) => {
    setIsAddingAddress(true)
    setEditingAddressId(address.id)
    setAddressValue('fullName', address.fullName)
    setAddressValue('address', address.address)
    setAddressValue('city', address.city)
    setAddressValue('state', address.state || '')
    setAddressValue('zipCode', address.zipCode)
    setAddressValue('country', address.country)
    setAddressValue('phone', address.phone || '')
    setAddressValue('isDefault', address.isDefault)
  }

  const handleCancelAddress = () => {
    setIsAddingAddress(false)
    setEditingAddressId(null)
    resetAddress()
  }

  const onAddressSubmit = async (data: AddressFormData) => {
    setIsSavingAddress(true)
    try {
      const addressData: CreateAddressData = {
        fullName: data.fullName,
        address: data.address,
        city: data.city,
        state: data.state || undefined,
        zipCode: data.zipCode,
        country: data.country,
        phone: data.phone || undefined,
        isDefault: data.isDefault,
      }

      if (editingAddressId) {
        await addressService.updateAddress(editingAddressId, addressData)
        toast({
          title: 'Address Updated',
          description: 'Your address has been updated successfully.',
        })
      } else {
        await addressService.createAddress(addressData)
        toast({
          title: 'Address Added',
          description: 'Your address has been added successfully.',
        })
      }

      // Refresh addresses
      const response = await addressService.getUserAddresses()
      setAddresses(response.addresses)
      setIsAddingAddress(false)
      setEditingAddressId(null)
      resetAddress()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to save address',
        variant: 'destructive',
      })
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handleDeleteAddress = (id: string) => {
    setAddressToDelete(id)
    setDeleteAddressDialogOpen(true)
  }

  const handleDeleteAddressConfirm = async () => {
    if (!addressToDelete) return

    try {
      await addressService.deleteAddress(addressToDelete)
      setDeleteAddressDialogOpen(false)
      setAddressToDelete(null)
      toast({
        title: 'Address Deleted',
        description: 'Your address has been deleted successfully.',
      })
      // Refresh addresses
      const response = await addressService.getUserAddresses()
      setAddresses(response.addresses)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to delete address',
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id)
      toast({
        title: 'Default Address Updated',
        description: 'Your default address has been updated.',
      })
      // Refresh addresses
      const response = await addressService.getUserAddresses()
      setAddresses(response.addresses)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to set default address',
        variant: 'destructive',
      })
    }
  }

  // Aggregate bought products from orders
  const getBoughtProducts = () => {
    const productMap = new Map<string, {
      productId: string
      title: string
      imageUrl?: string
      imageUrls?: string[]
      variants?: Array<{ imageUrls?: string[] }>
      colorImages?: { [color: string]: string[] }
      totalQuantity: number
      totalPaid: number
      orderIds: Set<string>
      sellerEmails: Set<string>
      lastPurchaseDate: Date
      averagePrice: number
    }>()

    orders.forEach(order => {
      const orderId = order.id || (order as any)._id || ''
      const orderDate = new Date(order.createdAt)
      
      order.items?.forEach(item => {
        const product = typeof item.productId === 'object' ? item.productId : null
        const productId = typeof item.productId === 'string' 
          ? item.productId 
          : (item.productId as any)?._id || (item.productId as any)?.id || ''
        
        if (!productId) return

        const productData = product as any
        const sellerEmail = productData?.sellerId?.email || productData?.seller?.email || null
        
        const existing = productMap.get(productId) || {
          productId,
          title: item.title || productData?.title || 'Unknown Product',
          imageUrl: productData?.imageUrl,
          imageUrls: productData?.imageUrls,
          variants: productData?.variants,
          colorImages: productData?.colorImages,
          totalQuantity: 0,
          totalPaid: 0,
          orderIds: new Set<string>(),
          sellerEmails: new Set<string>(),
          lastPurchaseDate: orderDate,
          averagePrice: 0
        }

        // Update image data if not set and product data is available
        if (productData) {
          if (!existing.imageUrl && !existing.imageUrls) {
            existing.imageUrl = productData.imageUrl
            existing.imageUrls = productData.imageUrls
          }
          if (!existing.variants && productData.variants) {
            existing.variants = productData.variants
          }
          if (!existing.colorImages && productData.colorImages) {
            existing.colorImages = productData.colorImages
          }
        }

        existing.totalQuantity += item.quantity
        existing.totalPaid += item.price * item.quantity
        existing.orderIds.add(orderId)
        if (sellerEmail) {
          existing.sellerEmails.add(sellerEmail)
        }
        if (orderDate > existing.lastPurchaseDate) {
          existing.lastPurchaseDate = orderDate
        }

        productMap.set(productId, existing)
      })
    })

    // Calculate average price and order count for each product
    const products = Array.from(productMap.values()).map(product => ({
      productId: product.productId,
      title: product.title,
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrls,
      variants: product.variants,
      colorImages: product.colorImages,
      totalQuantity: product.totalQuantity,
      totalPaid: product.totalPaid,
      orderCount: product.orderIds.size,
      orderIds: Array.from(product.orderIds),
      sellerEmails: Array.from(product.sellerEmails),
      lastPurchaseDate: product.lastPurchaseDate,
      averagePrice: product.totalPaid / product.totalQuantity
    }))

    // Sort products
    products.sort((a, b) => {
      let comparison = 0
      switch (boughtProductsSortBy) {
        case 'totalPaid':
          comparison = a.totalPaid - b.totalPaid
          break
        case 'quantity':
          comparison = a.totalQuantity - b.totalQuantity
          break
        case 'orders':
          comparison = a.orderCount - b.orderCount
          break
        case 'date':
          comparison = a.lastPurchaseDate.getTime() - b.lastPurchaseDate.getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'averagePrice':
          comparison = a.averagePrice - b.averagePrice
          break
        default:
          return 0
      }
      return boughtProductsSortOrder === 'asc' ? comparison : -comparison
    })

    return products
  }

  // Get sorted orders
  const getSortedOrders = () => {
    const sortedOrders = [...orders].sort((a, b) => {
      let comparison = 0
      switch (ordersSortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'amount':
          comparison = a.totalAmount - b.totalAmount
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'items':
          comparison = (a.items?.length || 0) - (b.items?.length || 0)
          break
        case 'orderId':
          const aId = a.id || (a as any)._id || ''
          const bId = b.id || (b as any)._id || ''
          comparison = aId.localeCompare(bId)
          break
        default:
          return 0
      }
      return ordersSortOrder === 'asc' ? comparison : -comparison
    })
    return sortedOrders
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">
            {user?.fullName || 'User'} Account <span className="text-sm text-muted-foreground font-normal">{user?.email || ''}</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/">
                <StoreIcon className="h-4 w-4 mr-2" />
                Marketplace
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setSearchParams({ tab: value })
      }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="bought-product" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Purchased Products
          </TabsTrigger>
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
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <BarChart3 className="h-6 w-6" />
                Buyer Statistics
              </h2>
              <p className="text-muted-foreground">
                Overview of your purchase history and key metrics
              </p>
            </div>
            {(() => {
              const totalSpent = orders
                .filter(order => order.status !== 'cancelled')
                .reduce((sum, order) => sum + order.totalAmount, 0)
              const totalOrders = orders.length
              const completedOrders = orders.filter(order => order.status === 'delivered').length
              const cancelledOrders = orders.filter(order => order.status === 'cancelled').length
              const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing').length
              const boughtProducts = getBoughtProducts()
              const totalProductsPurchased = boughtProducts.reduce((sum, product) => sum + product.totalQuantity, 0)
              const totalProductsUnique = boughtProducts.length
              const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
              
              // Calculate refund statistics
              const refundRequests = orders.filter(order => order.refundRequest).map(order => order.refundRequest!)
              const totalRefundAmount = refundRequests
                .filter(refund => refund.status === 'processed' || refund.status === 'approved')
                .reduce((sum, refund) => sum + (refund.refundAmount || 0), 0)
              const processedRefunds = refundRequests.filter(refund => refund.status === 'processed').length
              const approvedRefunds = refundRequests.filter(refund => refund.status === 'approved').length
              const pendingRefunds = refundRequests.filter(refund => refund.status === 'pending').length
              const rejectedRefunds = refundRequests.filter(refund => refund.status === 'rejected').length
              const totalRefundRequests = refundRequests.length

              return (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total Spent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">${totalSpent.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">All purchases (before refunds)</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Total Orders
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedOrders} completed, {pendingOrders} pending
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Items Purchased
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalProductsPurchased}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {totalProductsUnique} different products
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Average Order Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Per order average</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Statistics */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Order Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Completed Orders</span>
                          <span className="font-bold">{completedOrders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pending/Processing</span>
                          <span className="font-bold">{pendingOrders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Cancelled Orders</span>
                          <span className="font-bold">{cancelledOrders}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm font-medium">Total Orders</span>
                          <span className="font-bold">{totalOrders}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <RotateCcw className="h-4 w-4" />
                          Refund Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Refunded Amount</span>
                          <span className="font-bold">${totalRefundAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Processed Refunds</span>
                          <span className="font-bold">{processedRefunds}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Approved (Pending Processing)</span>
                          <span className="font-bold">{approvedRefunds}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pending Requests</span>
                          <span className="font-bold">{pendingRefunds}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Rejected Requests</span>
                          <span className="font-bold">{rejectedRefunds}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm font-medium">Total Refund Requests</span>
                          <span className="font-bold">{totalRefundRequests}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )
            })()}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>View and track your orders</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={ordersPagination.limit?.toString() || '10'}
                    onValueChange={(value) => {
                      setOrdersPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={`${ordersSortBy}-${ordersSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setOrdersSortBy(newSortBy)
                      setOrdersSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                      <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                      <SelectItem value="items-desc">Items (High to Low)</SelectItem>
                      <SelectItem value="items-asc">Items (Low to High)</SelectItem>
                      <SelectItem value="orderId-asc">Order ID (A-Z)</SelectItem>
                      <SelectItem value="orderId-desc">Order ID (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading orders...</div>
              ) : orders.length === 0 ? (
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
                        <th className="h-10 px-4 text-left font-medium">Refund</th>
                        <th className="h-10 px-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const sortedOrders = getSortedOrders()
                        return sortedOrders
                          .slice(
                            (ordersPagination.page - 1) * ordersPagination.limit,
                            ordersPagination.page * ordersPagination.limit
                          )
                          .map((order, index) => {
                            const orderId = order.id || (order as any)._id
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
                                <td className="px-4 py-3 font-medium">${order.totalAmount.toFixed(2)}</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                                </td>
                                <td className="px-4 py-3">
                                  {order.paymentStatus === 'refunded' || order.refundRequest ? (
                                    <div className="flex flex-col gap-1">
                                      {order.refundRequest && (
                                        <Badge
                                          variant={
                                            order.refundRequest.status === 'processed' ? 'default' :
                                            order.refundRequest.status === 'approved' ? 'default' :
                                            order.refundRequest.status === 'pending' ? 'secondary' :
                                            'destructive'
                                          }
                                          className="w-fit"
                                        >
                                          {order.refundRequest.status}
                                        </Badge>
                                      )}
                                      {order.refundRequest?.refundAmount && (
                                        <span className="text-sm font-medium text-green-600">
                                          ${order.refundRequest.refundAmount.toFixed(2)}
                                        </span>
                                      )}
                                      {order.paymentStatus === 'refunded' && !order.refundRequest && (
                                        <Badge variant="default" className="w-fit">Refunded</Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => navigate(`/order/${orderId}`)}
                                  >
                                    View Details
                                  </Button>
                                </td>
                              </tr>
                            )
                          })
                      })()}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Showing{' '}
                        {orders.length === 0
                          ? 0
                          : (ordersPagination.page - 1) * ordersPagination.limit + 1}
                        –{Math.min(ordersPagination.page * ordersPagination.limit, orders.length)} of{' '}
                        {orders.length} orders
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Items per page:</span>
                        <Select
                          value={ordersPagination.limit?.toString() || '10'}
                          onValueChange={(value) => {
                            setOrdersPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
                          }}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue placeholder="Items per page" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Sort by:</span>
                        <Select
                          value={`${ordersSortBy}-${ordersSortOrder}`}
                          onValueChange={(value) => {
                            const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                            setOrdersSortBy(newSortBy)
                            setOrdersSortOrder(newSortOrder)
                          }}
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                            <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                            <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                            <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                            <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                            <SelectItem value="items-desc">Items (High to Low)</SelectItem>
                            <SelectItem value="items-asc">Items (Low to High)</SelectItem>
                            <SelectItem value="orderId-asc">Order ID (A-Z)</SelectItem>
                            <SelectItem value="orderId-desc">Order ID (Z-A)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
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

        <TabsContent value="wishlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Wishlist</CardTitle>
              <CardDescription>Items you've saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWishlist ? (
                <div className="text-center py-4">Loading wishlist...</div>
              ) : wishlistItems.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No items in your wishlist yet</p>
                  <Button onClick={() => navigate('/')}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((item) => {
                    const product = item.productId as Product
                    const productId = product._id || product.id
                    const productImage = getFirstImageUrl(product)
                    
                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <Link to={`/product/${productId}`}>
                          <div className="relative aspect-square overflow-hidden bg-muted">
                            <img
                              src={productImage}
                              alt={product.title}
                              className="w-full h-full object-contain hover:scale-105 transition-transform"
                            />
                          </div>
                        </Link>
                        <CardContent className="p-4">
                          <Link to={`/product/${productId}`}>
                            <h4 className="font-semibold mb-2 line-clamp-2 hover:text-primary">
                              {product.title}
                            </h4>
                          </Link>
                          <p className="text-lg font-bold text-primary mb-3">${product.price}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/product/${productId}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!productId) return
                                try {
                                  await wishlistService.removeFromWishlist(productId)
                                  toast({
                                    title: 'Removed from Wishlist',
                                    description: 'Item has been removed from your wishlist.',
                                  })
                                  // Refresh wishlist
                                  const response = await wishlistService.getWishlist()
                                  setWishlistItems(response.wishlist.items)
                                  // Dispatch event to update header wishlist count
                                  window.dispatchEvent(new Event('wishlistChanged'))
                                } catch (error: any) {
                                  toast({
                                    title: 'Error',
                                    description: error.response?.data?.error || error.message || 'Failed to remove item',
                                    variant: 'destructive',
                                  })
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Saved Addresses</CardTitle>
                  <CardDescription>Manage your delivery addresses</CardDescription>
                </div>
                {!isAddingAddress && (
                  <Button onClick={handleAddAddress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isAddingAddress ? (
                <form onSubmit={handleSubmitAddress(onAddressSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address-fullName">Full Name *</Label>
                      <Input
                        id="address-fullName"
                        {...registerAddress('fullName', { required: 'Full name is required' })}
                      />
                      {addressErrors.fullName && (
                        <p className="text-sm text-destructive">{addressErrors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address-phone">Phone</Label>
                      <Input
                        id="address-phone"
                        type="tel"
                        {...registerAddress('phone')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address-address">Address *</Label>
                    <Input
                      id="address-address"
                      {...registerAddress('address', { required: 'Address is required' })}
                    />
                    {addressErrors.address && (
                      <p className="text-sm text-destructive">{addressErrors.address.message}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address-city">City *</Label>
                      <Input
                        id="address-city"
                        {...registerAddress('city', { required: 'City is required' })}
                      />
                      {addressErrors.city && (
                        <p className="text-sm text-destructive">{addressErrors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address-state">State/Province</Label>
                      <Input
                        id="address-state"
                        {...registerAddress('state')}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address-zipCode">ZIP Code *</Label>
                      <Input
                        id="address-zipCode"
                        {...registerAddress('zipCode', { required: 'ZIP code is required' })}
                      />
                      {addressErrors.zipCode && (
                        <p className="text-sm text-destructive">{addressErrors.zipCode.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address-country">Country *</Label>
                      <Input
                        id="address-country"
                        {...registerAddress('country', { required: 'Country is required' })}
                      />
                      {addressErrors.country && (
                        <p className="text-sm text-destructive">{addressErrors.country.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="address-isDefault"
                      {...registerAddress('isDefault')}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="address-isDefault" className="cursor-pointer">
                      Set as default address
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSavingAddress}>
                      {isSavingAddress ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelAddress} disabled={isSavingAddress}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : loadingAddresses ? (
                <div className="text-center py-4">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No saved addresses yet</p>
                  <Button onClick={handleAddAddress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <Card key={address.id} className={address.isDefault ? 'border-primary' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{address.fullName}</h4>
                              {address.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{address.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}
                              {address.state && `, ${address.state}`} {address.zipCode}
                            </p>
                            <p className="text-sm text-muted-foreground">{address.country}</p>
                            {address.phone && (
                              <p className="text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefault(address.id)}
                                title="Set as default"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bought-product" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchased Products</CardTitle>
                  <CardDescription>View all products you have purchased</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={boughtProductsPagination.limit?.toString() || '10'}
                    onValueChange={(value) => {
                      setBoughtProductsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={`${boughtProductsSortBy}-${boughtProductsSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setBoughtProductsSortBy(newSortBy)
                      setBoughtProductsSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totalPaid-desc">Total Paid (High to Low)</SelectItem>
                      <SelectItem value="totalPaid-asc">Total Paid (Low to High)</SelectItem>
                      <SelectItem value="quantity-desc">Quantity (High to Low)</SelectItem>
                      <SelectItem value="quantity-asc">Quantity (Low to High)</SelectItem>
                      <SelectItem value="orders-desc">Orders (High to Low)</SelectItem>
                      <SelectItem value="orders-asc">Orders (Low to High)</SelectItem>
                      <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                      <SelectItem value="averagePrice-desc">Avg Price (High to Low)</SelectItem>
                      <SelectItem value="averagePrice-asc">Avg Price (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const boughtProducts = getBoughtProducts()
                const paginatedProducts = boughtProducts.slice(
                  (boughtProductsPagination.page - 1) * boughtProductsPagination.limit,
                  boughtProductsPagination.page * boughtProductsPagination.limit
                )

                if (boughtProducts.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No products purchased yet</p>
                      <Button onClick={() => navigate('/')}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Start Shopping
                      </Button>
                    </div>
                  )
                }

                return (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="h-12 px-4 text-left font-medium w-14">No.</th>
                            <th className="h-12 px-4 text-left font-medium">Image</th>
                            <th className="h-12 px-4 text-left font-medium">Title</th>
                            <th className="h-12 px-4 text-left font-medium">Total Quantity Bought</th>
                            <th className="h-12 px-4 text-left font-medium">Total Paid</th>
                            <th className="h-12 px-4 text-left font-medium">Average Price</th>
                            <th className="h-12 px-4 text-left font-medium">Order ID</th>
                            <th className="h-12 px-4 text-left font-medium">Last Purchase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedProducts.map((product, index) => {
                            const rowNo = (boughtProductsPagination.page - 1) * boughtProductsPagination.limit + index + 1
                            const productImage = getFirstImageUrl({ 
                              imageUrl: product.imageUrl, 
                              imageUrls: product.imageUrls,
                              variants: product.variants,
                              colorImages: product.colorImages
                            })
                            return (
                              <tr key={product.productId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="h-16 px-4 align-middle font-medium">{rowNo}</td>
                                <td className="h-16 px-4 align-middle">
                                  <Link to={`/product/${product.productId}`}>
                                    <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                      <img
                                        src={productImage}
                                        alt={product.title}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  </Link>
                                </td>
                                <td className="h-16 px-4 align-middle">
                                  <Link to={`/product/${product.productId}`}>
                                    <p className="font-medium line-clamp-2 max-w-[200px] hover:text-primary" title={product.title}>{product.title}</p>
                                  </Link>
                                </td>
                                <td className="h-16 px-4 align-middle text-muted-foreground">{product.totalQuantity}</td>
                                <td className="h-16 px-4 align-middle font-medium">${product.totalPaid.toFixed(2)}</td>
                                <td className="h-16 px-4 align-middle text-muted-foreground">${product.averagePrice.toFixed(2)}</td>
                                <td className="h-16 px-4 align-middle text-muted-foreground">
                                  {product.orderIds && product.orderIds.length > 0 ? (
                                    <div className="max-w-[200px]">
                                      <p 
                                        className="text-sm truncate" 
                                        title={product.orderIds.map(id => `#${id.slice(-8)}`).join(', ')}
                                      >
                                        {product.orderIds.length === 1 
                                          ? `#${product.orderIds[0].slice(-8)}`
                                          : `#${product.orderIds[0].slice(-8)}${product.orderIds.length > 1 ? `, +${product.orderIds.length - 1} more` : ''}`
                                        }
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="h-16 px-4 align-middle text-muted-foreground">
                                  {product.lastPurchaseDate.toLocaleDateString()}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          Showing{' '}
                          {boughtProducts.length === 0
                            ? 0
                            : (boughtProductsPagination.page - 1) * boughtProductsPagination.limit + 1}
                          –{Math.min(boughtProductsPagination.page * boughtProductsPagination.limit, boughtProducts.length)} of{' '}
                          {boughtProducts.length} products
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Items per page:</span>
                          <Select
                            value={boughtProductsPagination.limit?.toString() || '10'}
                            onValueChange={(value) => {
                              setBoughtProductsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
                            }}
                          >
                            <SelectTrigger className="w-[100px] h-8">
                              <SelectValue placeholder="Items per page" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Sort by:</span>
                          <Select
                            value={`${boughtProductsSortBy}-${boughtProductsSortOrder}`}
                            onValueChange={(value) => {
                              const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                              setBoughtProductsSortBy(newSortBy)
                              setBoughtProductsSortOrder(newSortOrder)
                            }}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="totalPaid-desc">Total Paid (High to Low)</SelectItem>
                              <SelectItem value="totalPaid-asc">Total Paid (Low to High)</SelectItem>
                              <SelectItem value="quantity-desc">Quantity (High to Low)</SelectItem>
                              <SelectItem value="quantity-asc">Quantity (Low to High)</SelectItem>
                              <SelectItem value="orders-desc">Orders (High to Low)</SelectItem>
                              <SelectItem value="orders-asc">Orders (Low to High)</SelectItem>
                              <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                              <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                              <SelectItem value="averagePrice-desc">Avg Price (High to Low)</SelectItem>
                              <SelectItem value="averagePrice-asc">Avg Price (Low to High)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={boughtProductsPagination.page <= 1}
                          onClick={() =>
                            setBoughtProductsPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-muted-foreground min-w-[120px] text-center">
                          Page {boughtProductsPagination.page} of{' '}
                          {Math.max(1, Math.ceil(boughtProducts.length / boughtProductsPagination.limit))}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            boughtProductsPagination.page >= Math.ceil(boughtProducts.length / boughtProductsPagination.limit)
                          }
                          onClick={() =>
                            setBoughtProductsPagination((p) => ({
                              ...p,
                              page: Math.min(
                                Math.ceil(boughtProducts.length / boughtProductsPagination.limit),
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
                  </>
                )
              })()}
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
              {isEditingProfile ? (
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                  {profileError && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                      {profileError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      {...register('fullName', {
                        required: 'Full name is required',
                        minLength: {
                          value: 2,
                          message: 'Full name must be at least 2 characters',
                        },
                      })}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isUpdatingProfile}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-1">Name</p>
                    <p className="text-muted-foreground">{user?.fullName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Email</p>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog open={deleteAddressDialogOpen} onOpenChange={setDeleteAddressDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAddressConfirm}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
