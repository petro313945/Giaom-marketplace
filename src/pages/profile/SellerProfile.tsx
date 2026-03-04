import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'
import { Package, ShoppingBag, TrendingUp, DollarSign, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BarChart3, PieChart, Wallet, Download, CheckCircle2, User, Star, StoreIcon, Eye } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import * as analyticsService from '../../services/analyticsService'
import * as payoutService from '../../services/payoutService'
import * as reviewService from '../../services/reviewService'
import * as marketplaceSettingsService from '../../services/marketplaceSettingsService'
import type { Product } from '../../services/productService'
import type { Order } from '../../services/orderService'
import type { Review } from '../../services/reviewService'

interface ProfileFormData {
  fullName: string
  businessName: string
  businessDescription: string
}
import AddProductForm from '../../components/AddProductForm'
import ProductsList from '../../components/ProductsList'
import RatingDisplay from '../../components/RatingDisplay'
import { getFirstImageUrl } from '../../utils/imageUtils'
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
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Valid tab values
  const validTabs = ['statistics', 'sold-products', 'products', 'orders', 'payments', 'analytics', 'reviews', 'profile']
  
  // Get active tab from URL or use default
  const urlTab = searchParams.get('tab')
  const activeTab = (urlTab && validTabs.includes(urlTab)) 
    ? urlTab 
    : 'statistics'
  
  const [sellerProfile, setSellerProfile] = useState<sellerService.SellerProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [productsLimit, setProductsLimit] = useState(10)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10 })
  const [ordersSortBy, setOrdersSortBy] = useState<string>('date')
  const [ordersSortOrder, setOrdersSortOrder] = useState<'asc' | 'desc'>('desc')
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
  const [marketplaceSettings, setMarketplaceSettings] = useState<marketplaceSettingsService.MarketplaceSettings | null>(null)
  const [soldProductsPagination, setSoldProductsPagination] = useState({ page: 1, limit: 10 })
  const [soldProductsSortBy, setSoldProductsSortBy] = useState<string>('revenue')
  const [soldProductsSortOrder, setSoldProductsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [productsSortBy, setProductsSortBy] = useState<string>('createdAt')
  const [productsSortOrder, setProductsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [reviewsSortBy, setReviewsSortBy] = useState<string>('date')
  const [reviewsSortOrder, setReviewsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [payoutOrderDetails, setPayoutOrderDetails] = useState<Order[]>([])
  const [payoutOrderDetailsLoading, setPayoutOrderDetailsLoading] = useState(false)
  const [payoutAverageRating, setPayoutAverageRating] = useState<number | null>(null)
  const [expandedPayoutRows, setExpandedPayoutRows] = useState<Set<string>>(new Set())
  const [availablePayoutExpanded, setAvailablePayoutExpanded] = useState(false)
  const [availablePayoutOrderDetails, setAvailablePayoutOrderDetails] = useState<any[]>([])
  const [availablePayoutLoading, setAvailablePayoutLoading] = useState(false)
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<Review | null>(null)
  const [reviewDetailDialogOpen, setReviewDetailDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      businessName: '',
      businessDescription: '',
    },
  })

  const fetchProducts = async (page = 1, sortBy?: string, sortOrder?: 'asc' | 'desc', limit?: number) => {
    const response = await productService.getSellerProducts({ 
      page, 
      limit: limit || productsLimit,
      sortBy: sortBy || productsSortBy,
      sortOrder: sortOrder || productsSortOrder
    })
    setProducts(response.products)
    setProductsPagination(response.pagination)
  }

  const handleProductsSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setProductsSortBy(sortBy)
    setProductsSortOrder(sortOrder)
    fetchProducts(1, sortBy, sortOrder, productsLimit)
  }

  const handleProductsLimitChange = (limit: number) => {
    setProductsLimit(limit)
    fetchProducts(1, productsSortBy, productsSortOrder, limit)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, productsResponse, ordersData] = await Promise.all([
          sellerService.getCurrentSellerProfile().catch(() => ({ sellerProfile: null })),
          productService.getSellerProducts({ page: 1, limit: productsLimit, sortBy: 'createdAt', sortOrder: 'desc' }),
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

  useEffect(() => {
    if (user && sellerProfile) {
      reset({
        fullName: user.fullName || '',
        businessName: sellerProfile.businessName || '',
        businessDescription: sellerProfile.businessDescription || '',
      })
    }
  }, [user, sellerProfile, reset])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    setProfileError(null)
    
    try {
      // Update seller profile (only business description can be changed)
      const sellerResponse = await sellerService.updateSellerProfile({
        businessDescription: data.businessDescription,
      })
      
      // Update local state
      setSellerProfile(sellerResponse.sellerProfile)
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default',
      })
      
      setIsEditingProfile(false)
    } catch (error: any) {
      setProfileError(error.response?.data?.error || error.message || 'Failed to update profile')
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setProfileError(null)
    if (user && sellerProfile) {
      reset({
        fullName: user.fullName || '',
        businessName: sellerProfile.businessName || '',
        businessDescription: sellerProfile.businessDescription || '',
      })
    }
  }

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
      fetchMarketplaceSettings()
    }
  }, [analyticsPeriod, user?.role, payoutPage])

  useEffect(() => {
    if (user?.role === 'seller' && activeTab === 'reviews') {
      fetchSellerReviews(reviewsPagination.page)
    }
  }, [activeTab, reviewsPagination.page, user?.role])

  const fetchEarningsSummary = async () => {
    try {
      const summary = await payoutService.getEarningsSummary()
      setEarningsSummary(summary)
    } catch (error) {
      console.error('Failed to fetch earnings summary:', error)
    }
  }

  const fetchMarketplaceSettings = async () => {
    try {
      const settings = await marketplaceSettingsService.getMarketplaceSettings()
      setMarketplaceSettings(settings)
    } catch (error) {
      console.error('Failed to fetch marketplace settings:', error)
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

  const fetchSellerReviews = async (page: number = 1) => {
    setReviewsLoading(true)
    try {
      const response = await reviewService.getSellerReviews({ page, limit: 10 })
      setReviews(response.reviews)
      setReviewsPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch seller reviews:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      })
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (!earningsSummary || earningsSummary.available.netAmount <= 0) {
      return
    }

    // Fetch order details and calculate ratings
    setPayoutOrderDetailsLoading(true)
    setPayoutDialogOpen(true)
    
    try {
      // Fetch order details for available orders
      const orderIds = earningsSummary.available.orderIds || []
      const orderPromises = orderIds.map(orderId => orderService.getOrderById(orderId))
      const orderResponses = await Promise.all(orderPromises)
      const fetchedOrders = orderResponses.map(res => res.order)
      setPayoutOrderDetails(fetchedOrders)

      // Calculate average rating for products in these orders
      const productIds = new Set<string>()
      fetchedOrders.forEach(order => {
        order.items?.forEach((item: any) => {
          const productId = typeof item.productId === 'object' && item.productId?._id
            ? item.productId._id.toString()
            : (typeof item.productId === 'string' ? item.productId : '')
          if (productId) {
            productIds.add(productId)
          }
        })
      })

      // Fetch review stats for all products
      const ratingPromises = Array.from(productIds).map(async (productId) => {
        try {
          const stats = await reviewService.getReviewStats(productId)
          return stats.averageRating
        } catch (error) {
          return null
        }
      })

      const ratings = await Promise.all(ratingPromises)
      const validRatings = ratings.filter((r): r is number => r !== null && !isNaN(r))
      
      if (validRatings.length > 0) {
        const averageRating = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
        setPayoutAverageRating(averageRating)
      } else {
        setPayoutAverageRating(null)
      }
    } catch (error) {
      console.error('Error fetching payout order details:', error)
      setPayoutOrderDetails([])
      setPayoutAverageRating(null)
    } finally {
      setPayoutOrderDetailsLoading(false)
    }
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

  // Aggregate sold products from orders
  const getSoldProducts = () => {
    const productMap = new Map<string, {
      productId: string
      title: string
      imageUrl?: string
      imageUrls?: string[]
      totalQuantity: number
      totalRevenue: number
      orderIds: Set<string>
      buyerEmails: Set<string>
      lastSoldDate: Date
      averagePrice: number
    }>()

    orders.forEach(order => {
      const orderId = order.id || (order as any)._id || ''
      const orderDate = new Date(order.createdAt)
      const buyerEmail = order.user?.email || (order as any).user?.email || (order as any).guestEmail || null
      
      order.items?.forEach(item => {
        const product = typeof item.productId === 'object' ? item.productId : null
        const productId = typeof item.productId === 'string' 
          ? item.productId 
          : (item.productId as any)?._id || (item.productId as any)?.id || ''
        
        if (!productId) return

        const productData = product as any
        const existing = productMap.get(productId) || {
          productId,
          title: item.title || productData?.title || 'Unknown Product',
          imageUrl: productData?.imageUrl,
          imageUrls: productData?.imageUrls,
          totalQuantity: 0,
          totalRevenue: 0,
          orderIds: new Set<string>(),
          buyerEmails: new Set<string>(),
          lastSoldDate: orderDate,
          averagePrice: 0
        }

        // Update image if not set and product data is available
        if ((!existing.imageUrl && !existing.imageUrls) && productData) {
          existing.imageUrl = productData.imageUrl
          existing.imageUrls = productData.imageUrls
        }

        existing.totalQuantity += item.quantity
        existing.totalRevenue += item.price * item.quantity
        existing.orderIds.add(orderId)
        if (buyerEmail) {
          existing.buyerEmails.add(buyerEmail)
        }
        if (orderDate > existing.lastSoldDate) {
          existing.lastSoldDate = orderDate
        }

        productMap.set(productId, existing)
      })
    })

    // Calculate average price and order count for each product
    // Also enrich with image data from products list if missing
    const sellerProductsList = products // Reference to state variable
    const soldProductsList = Array.from(productMap.values()).map(product => {
      // If image data is missing, try to get it from the products list
      let imageUrl = product.imageUrl
      let imageUrls = product.imageUrls
      let variants = undefined
      let colorImages = undefined
      
      if ((!imageUrl && !imageUrls) || (imageUrls && imageUrls.length === 0)) {
        const productFromList = sellerProductsList.find(p => {
          const pId = p._id || p.id || ''
          return pId === product.productId || pId.toString() === product.productId.toString()
        })
        
        if (productFromList) {
          imageUrl = productFromList.imageUrl
          imageUrls = productFromList.imageUrls
          variants = productFromList.variants
          colorImages = productFromList.colorImages
        }
      }
      
      return {
        productId: product.productId,
        title: product.title,
        imageUrl,
        imageUrls,
        variants,
        colorImages,
        totalQuantity: product.totalQuantity,
        totalRevenue: product.totalRevenue,
        orderCount: product.orderIds.size,
        orderIds: Array.from(product.orderIds),
        buyerEmails: Array.from(product.buyerEmails),
        lastSoldDate: product.lastSoldDate,
        averagePrice: product.totalRevenue / product.totalQuantity
      }
    })

    // Sort products
    soldProductsList.sort((a, b) => {
      let comparison = 0
      switch (soldProductsSortBy) {
        case 'revenue':
          comparison = a.totalRevenue - b.totalRevenue
          break
        case 'quantity':
          comparison = a.totalQuantity - b.totalQuantity
          break
        case 'orders':
          comparison = a.orderCount - b.orderCount
          break
        case 'date':
          comparison = a.lastSoldDate.getTime() - b.lastSoldDate.getTime()
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
      return soldProductsSortOrder === 'asc' ? comparison : -comparison
    })

    return soldProductsList
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
          // Use totalAmount directly since backend now returns correct amount for seller's items
          comparison = (a.totalAmount || 0) - (b.totalAmount || 0)
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

  // Get sorted reviews
  const getSortedReviews = () => {
    const sortedReviews = [...reviews].sort((a, b) => {
      let comparison = 0
      switch (reviewsSortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'product':
          const aProductTitle = typeof a.productId === 'object' && a.productId !== null
            ? (a.productId as any).title || ''
            : ''
          const bProductTitle = typeof b.productId === 'object' && b.productId !== null
            ? (b.productId as any).title || ''
            : ''
          comparison = aProductTitle.localeCompare(bProductTitle)
          break
        case 'customer':
          const aUserName = typeof a.userId === 'object' && a.userId !== null
            ? (a.userId as any).fullName || (a.userId as any).email || ''
            : ''
          const bUserName = typeof b.userId === 'object' && b.userId !== null
            ? (b.userId as any).fullName || (b.userId as any).email || ''
            : ''
          comparison = aUserName.localeCompare(bUserName)
          break
        default:
          return 0
      }
      return reviewsSortOrder === 'asc' ? comparison : -comparison
    })
    return sortedReviews
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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">
              {sellerProfile?.businessName || user?.fullName || 'Business'} Seller Dashboard
              {user?.email && (
                <span className="text-base font-normal text-muted-foreground ml-2">
                  owner : {user.email}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.id && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link to={`/store/${user.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visit Store
                </Link>
              </Button>
            )}
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
        {sellerProfile?.status === 'pending' && (
          <p className="text-sm text-orange-600 mt-2">Your seller account is pending approval</p>
        )}
        {sellerProfile?.status === 'rejected' && (
          <p className="text-sm text-red-600 mt-2">Your seller application was rejected</p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setSearchParams({ tab: value })
      }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="sold-products" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Sold Products
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <Star className="h-4 w-4" />
            Reviews
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
                Seller Statistics
              </h2>
              <p className="text-muted-foreground">
                Overview of your store performance and key metrics
              </p>
            </div>
            {(() => {
              const soldProducts = getSoldProducts()
              const totalRevenue = soldProducts.reduce((sum, product) => sum + product.totalRevenue, 0)
              const totalQuantitySold = soldProducts.reduce((sum, product) => sum + product.totalQuantity, 0)
              const totalOrdersCount = orders.length
              const completedOrders = orders.filter(order => order.status === 'delivered').length
              const cancelledOrders = orders.filter(order => order.status === 'cancelled').length
              const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing').length
              const totalCommission = earningsSummary ? earningsSummary.totalEarnings.commission : 0
              const commissionRate = marketplaceSettings 
                ? marketplaceSettings.commissionRatePercent 
                : (earningsSummary && earningsSummary.totalEarnings.amount > 0 
                  ? Math.round((earningsSummary.totalEarnings.commission / earningsSummary.totalEarnings.amount) * 100)
                  : 10)
              const netEarnings = earningsSummary ? earningsSummary.totalEarnings.netAmount : 0
              
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
              const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0

              return (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">All-time sales before refunds</p>
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
                        <div className="text-2xl font-bold">{totalOrdersCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedOrders} completed, {pendingOrders} pending
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Items Sold
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalQuantitySold}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {soldProducts.length} different products
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Net Earnings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${netEarnings.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          After {commissionRate}% commission
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Finance Overview Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Finance Overview
                      </CardTitle>
                      <CardDescription>
                        Complete financial status and earnings breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Key Finance Metrics */}
                      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                          <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">All sales before deductions</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Refunded Amount</p>
                          <p className="text-xl font-bold">${totalRefundAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{totalRefundRequests} refund{totalRefundRequests !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Platform Fee</p>
                          <p className="text-xl font-bold">${totalCommission.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{commissionRate}% commission rate</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Net Earnings</p>
                          <p className="text-xl font-bold">${netEarnings.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">After fees & refunds</p>
                        </div>
                        {earningsSummary && (
                          <>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Available to Withdraw</p>
                              <p className="text-xl font-bold">${earningsSummary.available.netAmount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Ready for payout</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Pending Withdrawal</p>
                              <p className="text-xl font-bold">${earningsSummary.pending.amount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{earningsSummary.pending.payoutCount} payout{earningsSummary.pending.payoutCount !== 1 ? 's' : ''}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="border-t pt-4 space-y-4">
                        <h4 className="text-sm font-semibold">Detailed Breakdown</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Revenue & Earnings Details */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue & Earnings</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Gross Revenue</span>
                                <span className="font-medium">${totalRevenue.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Total Refunded</span>
                                <span className="font-medium">-${totalRefundAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-t pt-2">
                                <span className="text-sm font-medium">Revenue After Refunds</span>
                                <span className="font-bold">${(totalRevenue - totalRefundAmount).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Platform Commission ({commissionRate}%)</span>
                                <span className="font-medium">-${totalCommission.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-t pt-2">
                                <span className="text-sm font-semibold">Net Earnings</span>
                                <span className="font-bold">${netEarnings.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Withdrawal Status Details */}
                          {earningsSummary && (
                            <div className="space-y-3">
                              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Withdrawal Status</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-sm text-muted-foreground">Available for Withdrawal</span>
                                  <span className="font-medium">${earningsSummary.available.netAmount.toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-2">
                                  From {earningsSummary.available.orderCount} order{earningsSummary.available.orderCount !== 1 ? 's' : ''}
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-sm text-muted-foreground">Pending Withdrawal</span>
                                  <span className="font-medium">${earningsSummary.pending.amount.toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-2">
                                  {earningsSummary.pending.payoutCount} payout{earningsSummary.pending.payoutCount !== 1 ? 's' : ''} in process
                                </div>
                                <div className="flex justify-between items-center py-1 border-t pt-2">
                                  <span className="text-sm text-muted-foreground">Total Withdrawn</span>
                                  <span className="font-medium">${earningsSummary.paidOut.amount.toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-2">
                                  {earningsSummary.paidOut.payoutCount} completed payout{earningsSummary.paidOut.payoutCount !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Refund Details */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Refund Details</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Total Refunded</span>
                                <span className="font-medium">${totalRefundAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Processed Refunds</span>
                                <span className="font-medium">{processedRefunds}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Approved (Processing)</span>
                                <span className="font-medium">{approvedRefunds}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Pending Requests</span>
                                <span className="font-medium">{pendingRefunds}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Rejected Requests</span>
                                <span className="font-medium">{rejectedRefunds}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-t pt-2">
                                <span className="text-sm font-medium">Total Refund Requests</span>
                                <span className="font-bold">{totalRefundRequests}</span>
                              </div>
                            </div>
                          </div>

                          {/* Commission Details */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Commission Details</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Commission Rate</span>
                                <span className="font-medium">{commissionRate}%</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Total Commission</span>
                                <span className="font-medium">${totalCommission.toFixed(2)}</span>
                              </div>
                              {earningsSummary && (
                                <>
                                  <div className="flex justify-between items-center py-1">
                                    <span className="text-sm text-muted-foreground">Available Commission</span>
                                    <span className="font-medium">${earningsSummary.available.commission.toFixed(2)}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground pl-2">
                                    From available orders
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sales Performance */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Sales Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Items Sold</span>
                          <span className="font-bold">{totalQuantitySold}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Different Products</span>
                          <span className="font-bold">{soldProducts.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Average Order Value</span>
                          <span className="font-bold">${averageOrderValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Active Product Listings</span>
                          <span className="font-bold">{productsPagination.total}</span>
                        </div>
                      </CardContent>
                    </Card>

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
                          <span className="font-bold">{totalOrdersCount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Statistics */}
                  {analytics && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Analytics Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Revenue ({analyticsPeriod} days)</span>
                            <span className="font-bold">${analytics.summary.totalRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Orders</span>
                            <span className="font-bold">{analytics.summary.totalOrders}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Items Sold</span>
                            <span className="font-bold">{analytics.summary.totalItems}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Average Order Value</span>
                            <span className="font-bold">${analytics.summary.averageOrderValue.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Product Status Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Product Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {products.filter((p) => p.status === 'approved').length}
                          </div>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {products.filter((p) => p.status === 'pending').length}
                          </div>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {products.filter((p) => p.status === 'rejected').length}
                          </div>
                          <p className="text-xs text-muted-foreground">Rejected</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Status Breakdown */}
                  {orders.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Order Status Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
                            const count = orders.filter((o) => o.status === status).length
                            if (count === 0) return null
                            return (
                              <div key={status} className="text-center">
                                <div className="text-2xl font-bold">{count}</div>
                                <p className="text-xs text-muted-foreground capitalize">{status}</p>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )
            })()}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductsList
            products={products}
            pagination={productsPagination}
            onProductUpdated={handleProductAdded}
            onPageChange={(page) => fetchProducts(page, productsSortBy, productsSortOrder, productsLimit)}
            onSortChange={handleProductsSortChange}
            onLimitChange={handleProductsLimitChange}
            sortBy={productsSortBy}
            sortOrder={productsSortOrder}
            headerAction={<AddProductForm onProductAdded={handleProductAdded} />}
          />
        </TabsContent>

        <TabsContent value="sold-products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sold Products</CardTitle>
                  <CardDescription>View all products that have been sold</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={soldProductsPagination.limit?.toString() || '10'}
                    onValueChange={(value) => {
                      setSoldProductsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
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
                    value={`${soldProductsSortBy}-${soldProductsSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setSoldProductsSortBy(newSortBy)
                      setSoldProductsSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue-desc">Revenue (High to Low)</SelectItem>
                      <SelectItem value="revenue-asc">Revenue (Low to High)</SelectItem>
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
                const soldProducts = getSoldProducts()
                const paginatedProducts = soldProducts.slice(
                  (soldProductsPagination.page - 1) * soldProductsPagination.limit,
                  soldProductsPagination.page * soldProductsPagination.limit
                )

                if (soldProducts.length === 0) {
                  return <p className="text-muted-foreground text-center py-8">No products have been sold yet</p>
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
                            <th className="h-12 px-4 text-left font-medium">Buyer Email</th>
                            <th className="h-12 px-4 text-left font-medium">Total Quantity Sold</th>
                            <th className="h-12 px-4 text-left font-medium">Total Revenue</th>
                            <th className="h-12 px-4 text-left font-medium">Average Price</th>
                            <th className="h-12 px-4 text-left font-medium">Order ID</th>
                            <th className="h-12 px-4 text-left font-medium">Last Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedProducts.map((product, index) => {
                            const rowNo = (soldProductsPagination.page - 1) * soldProductsPagination.limit + index + 1
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
                                  <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                    <img
                                      src={productImage}
                                      alt={product.title}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                </td>
                                <td className="h-16 px-4 align-middle">
                                  <p className="font-medium line-clamp-2 max-w-[200px]" title={product.title}>{product.title}</p>
                                </td>
                                <td className="h-16 px-4 align-middle text-muted-foreground">
                                  {product.buyerEmails && product.buyerEmails.length > 0 ? (
                                    <div className="max-w-[250px]">
                                      <p 
                                        className="text-sm truncate" 
                                        title={product.buyerEmails.join(', ')}
                                      >
                                        {product.buyerEmails.length === 1 
                                          ? product.buyerEmails[0]
                                          : `${product.buyerEmails[0]}${product.buyerEmails.length > 1 ? `, +${product.buyerEmails.length - 1} more` : ''}`
                                        }
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="h-16 px-4 align-middle text-muted-foreground">{product.totalQuantity}</td>
                                <td className="h-16 px-4 align-middle font-medium">${product.totalRevenue.toFixed(2)}</td>
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
                                  {product.lastSoldDate.toLocaleDateString()}
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
                          {soldProducts.length === 0
                            ? 0
                            : (soldProductsPagination.page - 1) * soldProductsPagination.limit + 1}
                          –{Math.min(soldProductsPagination.page * soldProductsPagination.limit, soldProducts.length)} of{' '}
                          {soldProducts.length} products
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Items per page:</span>
                          <Select
                            value={soldProductsPagination.limit?.toString() || '10'}
                            onValueChange={(value) => {
                              setSoldProductsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
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
                            value={`${soldProductsSortBy}-${soldProductsSortOrder}`}
                            onValueChange={(value) => {
                              const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                              setSoldProductsSortBy(newSortBy)
                              setSoldProductsSortOrder(newSortOrder)
                            }}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="revenue-desc">Revenue (High to Low)</SelectItem>
                              <SelectItem value="revenue-asc">Revenue (Low to High)</SelectItem>
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
                          disabled={soldProductsPagination.page <= 1}
                          onClick={() =>
                            setSoldProductsPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-muted-foreground min-w-[120px] text-center">
                          Page {soldProductsPagination.page} of{' '}
                          {Math.max(1, Math.ceil(soldProducts.length / soldProductsPagination.limit))}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            soldProductsPagination.page >= Math.ceil(soldProducts.length / soldProductsPagination.limit)
                          }
                          onClick={() =>
                            setSoldProductsPagination((p) => ({
                              ...p,
                              page: Math.min(
                                Math.ceil(soldProducts.length / soldProductsPagination.limit),
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

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Manage and fulfill customer orders</CardDescription>
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
                            // Backend now returns totalAmount calculated for seller's items only (with tax)
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
                                          variant="outline"
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
                                        <Badge variant="outline" className="w-fit">Refunded</Badge>
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
                              formatter={(value: number | undefined) => value !== undefined ? [`$${value.toFixed(2)}`, 'Revenue'] : ['', 'Revenue']}
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
                                formatter={(value: number | undefined) => value !== undefined ? [value, 'Orders'] : [0, 'Orders']}
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
                                  `${name}: ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {Object.entries(analytics.ordersByStatus)
                                  .filter(([_, value]) => value > 0)
                                  .map(([,], index) => {
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
                    {marketplaceSettings && (
                      <span className="ml-1">({marketplaceSettings.commissionRatePercent}% rate)</span>
                    )}
                  </p>
                  {marketplaceSettings && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You receive {100 - marketplaceSettings.commissionRatePercent}% of sales
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
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
                  <div className="text-2xl font-bold">
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
                  <div className="text-2xl font-bold">
                    ${earningsSummary.paidOut.amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {earningsSummary.paidOut.payoutCount} payout{earningsSummary.paidOut.payoutCount !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Available for Payout */}
          {earningsSummary && earningsSummary.available.netAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available for Payout</CardTitle>
                <CardDescription>Orders ready for payout request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium w-12"></th>
                          <th className="h-10 px-4 text-left font-medium">Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Commission</th>
                          <th className="h-10 px-4 text-left font-medium">Commission Rate</th>
                          <th className="h-10 px-4 text-left font-medium">Net Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Status</th>
                          <th className="h-10 px-4 text-left font-medium">Orders</th>
                          <th className="h-10 px-4 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            if (!availablePayoutExpanded && earningsSummary.available.orderIds.length > 0) {
                              setAvailablePayoutLoading(true)
                              const fetchOrderDetails = async () => {
                                try {
                                  const orderPromises = earningsSummary.available.orderIds.map(orderId => 
                                    orderService.getOrderById(orderId)
                                  )
                                  const orderResponses = await Promise.all(orderPromises)
                                  const fetchedOrders = orderResponses.map(res => res.order)
                                  
                                  const processedOrders = fetchedOrders.map(order => {
                                    // Backend already filters items for seller, so use order.items directly
                                    const items = order.items || []
                                    
                                    // Calculate seller revenue as subtotal (without tax) for earnings calculation
                                    // Note: order.totalAmount includes tax, but earnings are calculated on subtotal
                                    const sellerRevenue = items.reduce((sum: number, item: any) => {
                                      return sum + (item.price * item.quantity)
                                    }, 0)

                                    return {
                                      id: order.id || (order as any)._id || '',
                                      orderNumber: (order.id || (order as any)._id || '').slice(-8),
                                      createdAt: order.createdAt,
                                      status: order.status,
                                      items: items.map((item: any) => {
                                        const product = typeof item.productId === 'object' ? item.productId : null
                                        const productData = product as any
                                        return {
                                          productId: productData?._id || productData?.id || '',
                                          title: item.title || productData?.title || 'Unknown Product',
                                          imageUrl: productData?.imageUrl || productData?.imageUrls?.[0],
                                          quantity: item.quantity,
                                          price: item.price,
                                          subtotal: item.price * item.quantity
                                        }
                                      }),
                                      sellerRevenue
                                    }
                                  })
                                  
                                  setAvailablePayoutOrderDetails(processedOrders)
                                } catch (error) {
                                  console.error('Error fetching available payout order details:', error)
                                  setAvailablePayoutOrderDetails([])
                                } finally {
                                  setAvailablePayoutLoading(false)
                                }
                              }
                              fetchOrderDetails()
                            }
                            setAvailablePayoutExpanded(!availablePayoutExpanded)
                          }}
                        >
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!availablePayoutExpanded && earningsSummary.available.orderIds.length > 0) {
                                  setAvailablePayoutLoading(true)
                                  const fetchOrderDetails = async () => {
                                    try {
                                      const orderPromises = earningsSummary.available.orderIds.map(orderId => 
                                        orderService.getOrderById(orderId)
                                      )
                                      const orderResponses = await Promise.all(orderPromises)
                                      const fetchedOrders = orderResponses.map(res => res.order)
                                      
                                      const processedOrders = fetchedOrders.map(order => {
                                        // Backend already filters items for seller, so use order.items directly
                                        const items = order.items || []
                                        
                                        // Calculate seller revenue as subtotal (without tax) for earnings calculation
                                        // Note: order.totalAmount includes tax, but earnings are calculated on subtotal
                                        const sellerRevenue = items.reduce((sum: number, item: any) => {
                                          return sum + (item.price * item.quantity)
                                        }, 0)

                                        return {
                                          id: order.id || (order as any)._id || '',
                                          orderNumber: (order.id || (order as any)._id || '').slice(-8),
                                          createdAt: order.createdAt,
                                          status: order.status,
                                          items: items.map((item: any) => {
                                            const product = typeof item.productId === 'object' ? item.productId : null
                                            const productData = product as any
                                            return {
                                              productId: productData?._id || productData?.id || '',
                                              title: item.title || productData?.title || 'Unknown Product',
                                              imageUrl: productData?.imageUrl || productData?.imageUrls?.[0],
                                              quantity: item.quantity,
                                              price: item.price,
                                              subtotal: item.price * item.quantity
                                            }
                                          }),
                                          sellerRevenue
                                        }
                                      })
                                      
                                      setAvailablePayoutOrderDetails(processedOrders)
                                    } catch (error) {
                                      console.error('Error fetching available payout order details:', error)
                                      setAvailablePayoutOrderDetails([])
                                    } finally {
                                      setAvailablePayoutLoading(false)
                                    }
                                  }
                                  fetchOrderDetails()
                                }
                                setAvailablePayoutExpanded(!availablePayoutExpanded)
                              }}
                            >
                              {availablePayoutExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            ${earningsSummary.available.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            ${earningsSummary.available.commission.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {earningsSummary.available.amount > 0 ? (
                              <span>{((earningsSummary.available.commission / earningsSummary.available.amount) * 100).toFixed(1)}%</span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-green-600">
                            ${earningsSummary.available.netAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">Available</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {earningsSummary.available.orderCount} order{earningsSummary.available.orderCount !== 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRequestPayout()
                              }}
                              disabled={requestingPayout || earningsSummary.available.netAmount <= 0}
                              className="gap-2"
                              size="sm"
                            >
                              <Download className="h-4 w-4" />
                              {requestingPayout ? 'Requesting...' : 'Request'}
                            </Button>
                          </td>
                        </tr>
                        {availablePayoutExpanded && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-muted/30">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm mb-3">Order Details</h4>
                                {availablePayoutLoading ? (
                                  <div className="text-center py-8">
                                    <p className="text-muted-foreground">Loading order details...</p>
                                  </div>
                                ) : availablePayoutOrderDetails.length > 0 ? (
                                  <div className="space-y-2">
                                    {availablePayoutOrderDetails.map((order) => (
                                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                        <div className="flex items-center gap-4 flex-1">
                                          <div>
                                            <p className="font-medium">Order #{order.orderNumber}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm">
                                              <span className="text-muted-foreground">Amount: </span>
                                              <span className="font-medium">${order.sellerRevenue.toFixed(2)}</span>
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => navigate(`/order/${order.id}`)}
                                          variant="outline"
                                          size="sm"
                                          className="gap-2"
                                        >
                                          <Eye className="h-4 w-4" />
                                          View Order
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <p className="text-muted-foreground">No order details available</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                          <th className="h-10 px-4 text-left font-medium w-12"></th>
                          <th className="h-10 px-4 text-left font-medium">Date</th>
                          <th className="h-10 px-4 text-left font-medium">Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Commission</th>
                          <th className="h-10 px-4 text-left font-medium">Commission Rate</th>
                          <th className="h-10 px-4 text-left font-medium">Net Amount</th>
                          <th className="h-10 px-4 text-left font-medium">Status</th>
                          <th className="h-10 px-4 text-left font-medium">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutHistory.payouts.map((payout) => {
                          const isExpanded = expandedPayoutRows.has(payout.id)
                          const toggleExpand = () => {
                            const newExpanded = new Set(expandedPayoutRows)
                            if (isExpanded) {
                              newExpanded.delete(payout.id)
                            } else {
                              newExpanded.add(payout.id)
                            }
                            setExpandedPayoutRows(newExpanded)
                          }

                          return (
                            <>
                              <tr
                                key={payout.id}
                                className="border-b transition-colors hover:bg-muted/50 last:border-0 cursor-pointer"
                                onClick={toggleExpand}
                              >
                                <td className="px-4 py-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleExpand()
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {new Date(payout.requestedAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  ${payout.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  ${payout.commission.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {payout.commissionRate !== undefined && payout.commissionRate !== null ? (
                                    <span>{(payout.commissionRate * 100).toFixed(1)}%</span>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
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
                              {isExpanded && payout.orders && payout.orders.length > 0 && (
                                <tr key={`${payout.id}-details`}>
                                  <td colSpan={8} className="px-4 py-4 bg-muted/30">
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-sm mb-3">Order Details</h4>
                                      <div className="space-y-2">
                                        {payout.orders.map((order) => (
                                          <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                            <div className="flex items-center gap-4 flex-1">
                                              <div>
                                                <p className="font-medium">Order #{order.orderNumber}</p>
                                              </div>
                                              <div>
                                                <p className="text-sm">
                                                  <span className="text-muted-foreground">Amount: </span>
                                                  <span className="font-medium">${order.sellerRevenue.toFixed(2)}</span>
                                                </p>
                                              </div>
                                            </div>
                                            <Button
                                              onClick={() => navigate(`/order/${order.id}`)}
                                              variant="outline"
                                              size="sm"
                                              className="gap-2"
                                            >
                                              <Eye className="h-4 w-4" />
                                              View Order
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })}
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

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Reviews</CardTitle>
                  <CardDescription>View all reviews for your products</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={reviewsPagination.limit?.toString() || '10'}
                    onValueChange={(value) => {
                      setReviewsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
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
                    value={`${reviewsSortBy}-${reviewsSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setReviewsSortBy(newSortBy)
                      setReviewsSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
                      <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                      <SelectItem value="product-asc">Product (A-Z)</SelectItem>
                      <SelectItem value="product-desc">Product (Z-A)</SelectItem>
                      <SelectItem value="customer-asc">Customer (A-Z)</SelectItem>
                      <SelectItem value="customer-desc">Customer (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left font-medium w-12">No.</th>
                          <th className="h-12 px-4 text-left font-medium">Product</th>
                          <th className="h-12 px-4 text-left font-medium">Customer</th>
                          <th className="h-12 px-4 text-left font-medium">Rating</th>
                          <th className="h-12 px-4 text-left font-medium">Comment</th>
                          <th className="h-12 px-4 text-left font-medium">Status</th>
                          <th className="h-12 px-4 text-left font-medium">Date</th>
                          <th className="h-12 px-4 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const sortedReviews = getSortedReviews()
                          return sortedReviews
                            .slice(
                              (reviewsPagination.page - 1) * reviewsPagination.limit,
                              reviewsPagination.page * reviewsPagination.limit
                            )
                            .map((review, index) => {
                              const rowNo = (reviewsPagination.page - 1) * reviewsPagination.limit + index + 1
                              const productTitle = typeof review.productId === 'object' && review.productId !== null
                                ? (review.productId as any).title || 'Unknown Product'
                                : 'Unknown Product'
                              const userName = typeof review.userId === 'object' && review.userId !== null
                                ? (review.userId as any).fullName || (review.userId as any).email || 'Anonymous'
                                : 'Anonymous'
                              
                              return (
                                <tr key={review.id || review._id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                                  <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                                  <td className="px-4 py-3 font-medium max-w-[200px]">
                                    <p className="truncate" title={productTitle}>{productTitle}</p>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{userName}</td>
                                  <td className="px-4 py-3">
                                    <RatingDisplay rating={review.rating} size="sm" />
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground max-w-[300px]">
                                    {review.comment ? (
                                      <p className="truncate" title={review.comment}>{review.comment}</p>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge
                                      variant={
                                        review.status === 'approved'
                                          ? 'default'
                                          : review.status === 'rejected'
                                          ? 'destructive'
                                          : 'secondary'
                                      }
                                    >
                                      {review.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedReviewDetail(review)
                                        setReviewDetailDialogOpen(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Detail
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })
                        })()}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          Showing{' '}
                          {reviewsPagination.total === 0
                            ? 0
                            : (reviewsPagination.page - 1) * reviewsPagination.limit + 1}
                          –{Math.min(reviewsPagination.page * reviewsPagination.limit, reviewsPagination.total)} of{' '}
                          {reviewsPagination.total} reviews
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Items per page:</span>
                          <Select
                            value={reviewsPagination.limit?.toString() || '10'}
                            onValueChange={(value) => {
                              setReviewsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
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
                            value={`${reviewsSortBy}-${reviewsSortOrder}`}
                            onValueChange={(value) => {
                              const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                              setReviewsSortBy(newSortBy)
                              setReviewsSortOrder(newSortOrder)
                            }}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                              <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                              <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
                              <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
                              <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                              <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                              <SelectItem value="product-asc">Product (A-Z)</SelectItem>
                              <SelectItem value="product-desc">Product (Z-A)</SelectItem>
                              <SelectItem value="customer-asc">Customer (A-Z)</SelectItem>
                              <SelectItem value="customer-desc">Customer (Z-A)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reviewsPagination.page <= 1}
                          onClick={() => {
                            const newPage = Math.max(1, reviewsPagination.page - 1)
                            setReviewsPagination((p) => ({ ...p, page: newPage }))
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-muted-foreground min-w-[120px] text-center">
                          Page {reviewsPagination.page} of {reviewsPagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reviewsPagination.page >= reviewsPagination.pages}
                          onClick={() => {
                            const newPage = Math.min(reviewsPagination.pages, reviewsPagination.page + 1)
                            setReviewsPagination((p) => ({ ...p, page: newPage }))
                          }}
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
          
          {/* Review Detail Dialog */}
          <Dialog open={reviewDetailDialogOpen} onOpenChange={setReviewDetailDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
                <DialogDescription>Complete information about this review</DialogDescription>
              </DialogHeader>
              {selectedReviewDetail && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                      <p className="mt-1 font-medium">
                        {typeof selectedReviewDetail.productId === 'object' && selectedReviewDetail.productId !== null
                          ? (selectedReviewDetail.productId as any).title || 'N/A'
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedReviewDetail.status === 'approved'
                              ? 'default'
                              : selectedReviewDetail.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {selectedReviewDetail.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
                      <p className="mt-1">
                        {typeof selectedReviewDetail.userId === 'object' && selectedReviewDetail.userId !== null
                          ? (selectedReviewDetail.userId as any).fullName || (selectedReviewDetail.userId as any).email || 'Anonymous'
                          : 'Anonymous'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Customer Email</Label>
                      <p className="mt-1">
                        {typeof selectedReviewDetail.userId === 'object' && selectedReviewDetail.userId !== null
                          ? (selectedReviewDetail.userId as any).email || 'N/A'
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Rating</Label>
                    <div className="mt-1">
                      <RatingDisplay rating={selectedReviewDetail.rating} size="md" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Comment</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {selectedReviewDetail.comment || 'No comment provided'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                      <p className="mt-1 text-sm">
                        {new Date(selectedReviewDetail.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
                      <p className="mt-1 text-sm">
                        {new Date(selectedReviewDetail.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal and business details</CardDescription>
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
                      value={user?.fullName || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Full name cannot be changed</p>
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

                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={sellerProfile?.businessName || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Business name cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">Business Description</Label>
                    <Textarea
                      id="businessDescription"
                      {...register('businessDescription')}
                      placeholder="Enter your business description (optional)"
                      rows={4}
                    />
                    {errors.businessDescription && (
                      <p className="text-sm text-destructive">{errors.businessDescription.message}</p>
                    )}
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
                  <div>
                    <p className="text-sm font-medium mb-1">Business Name</p>
                    <p className="text-muted-foreground">{sellerProfile?.businessName || 'Not set'}</p>
                  </div>
                  {sellerProfile?.businessDescription && (
                    <div>
                      <p className="text-sm font-medium mb-1">Business Description</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{sellerProfile.businessDescription}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">Account Status</p>
                    <p className="text-muted-foreground capitalize">{sellerProfile?.status || 'Unknown'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog 
        open={payoutDialogOpen} 
        onOpenChange={(open) => {
          setPayoutDialogOpen(open)
          if (!open) {
            // Reset state when dialog closes
            setPayoutOrderDetails([])
            setPayoutAverageRating(null)
            setPayoutOrderDetailsLoading(false)
          }
        }}
      >
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Request Payout</AlertDialogTitle>
            <AlertDialogDescription>
              Review the payout details before confirming
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {earningsSummary && (
            <div className="space-y-6 py-4">
              {/* Payout Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payout Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">${earningsSummary.available.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="text-2xl font-bold">${earningsSummary.available.commission.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Amount</p>
                      <p className="text-2xl font-bold">${earningsSummary.available.netAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                      <div className="flex items-center gap-2">
                        {payoutOrderDetailsLoading ? (
                          <p className="text-2xl font-bold">Loading...</p>
                        ) : payoutAverageRating !== null ? (
                          <>
                            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            <p className="text-2xl font-bold">{payoutAverageRating.toFixed(1)}</p>
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-muted-foreground">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Available for Payout: ${earningsSummary.available.netAmount.toFixed(2)} from {earningsSummary.available.orderCount} order{earningsSummary.available.orderCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                  <CardDescription>
                    {earningsSummary.available.orderCount} order{earningsSummary.available.orderCount !== 1 ? 's' : ''} included in this payout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payoutOrderDetailsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading order details...</p>
                    </div>
                  ) : payoutOrderDetails.length > 0 ? (
                    <div className="space-y-4">
                      {payoutOrderDetails.map((order) => {
                        const orderId = order.id || (order as any)._id || ''
                        const orderDate = new Date(order.createdAt).toLocaleDateString()
                        const sellerItems = order.items?.filter((item: any) => {
                          const product = typeof item.productId === 'object' ? item.productId : null
                          const productData = product as any
                          return productData?.sellerId && productData.sellerId.toString() === user?.id
                        }) || []
                        
                        const sellerRevenue = sellerItems.reduce((sum: number, item: any) => {
                          return sum + (item.price * item.quantity)
                        }, 0)

                        const commissionRate = marketplaceSettings?.commissionRate || 0.1
                        const orderCommission = sellerRevenue * commissionRate
                        const orderNetAmount = sellerRevenue - orderCommission

                        return (
                          <div key={orderId} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">Order #{orderId.slice(-8)}</p>
                                <p className="text-sm text-muted-foreground">{orderDate}</p>
                              </div>
                              <Badge variant="outline">{order.status}</Badge>
                            </div>
                            
                            <div className="space-y-2">
                              {sellerItems.map((item: any, idx: number) => {
                                const product = typeof item.productId === 'object' ? item.productId : null
                                const productData = product as any
                                const productTitle = item.title || productData?.title || 'Unknown Product'
                                const productImage = productData?.imageUrl || productData?.imageUrls?.[0]
                                
                                return (
                                  <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                                    {productImage && (
                                      <img 
                                        src={productImage} 
                                        alt={productTitle}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{productTitle}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                                      </p>
                                    </div>
                                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                )
                              })}
                            </div>

                            <div className="pt-2 border-t space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-medium">${sellerRevenue.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Commission ({((commissionRate * 100).toFixed(0))}%):</span>
                                <span className="font-medium text-orange-600">${orderCommission.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-semibold pt-1">
                                <span>Net Amount:</span>
                                <span className="text-green-600">${orderNetAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No order details available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={requestingPayout}>Cancel</AlertDialogCancel>
            <Button
              variant="default"
              disabled={requestingPayout || !earningsSummary || earningsSummary.available.netAmount <= 0}
              onClick={handlePayoutConfirm}
            >
              {requestingPayout ? 'Requesting...' : 'Confirm Payout'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
