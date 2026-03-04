import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ShoppingBag, Store, StoreIcon, AlertCircle, Trash2, Edit, Package, DollarSign, ShoppingCart, Star, Eye, Wallet, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, BarChart3, Key, Tags, Home, RefreshCw, Database, Download } from 'lucide-react'
import * as userService from '../../services/userService'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import * as reviewService from '../../services/reviewService'
import * as reportService from '../../services/reportService'
import * as payoutService from '../../services/payoutService'
import * as categoryService from '../../services/categoryService'
import * as homeSettingsService from '../../services/homeSettingsService'
import * as marketplaceSettingsService from '../../services/marketplaceSettingsService'
import * as backupService from '../../services/backupService'
import RatingDisplay from '../../components/RatingDisplay'
import { getFirstImageUrl } from '../../utils/imageUtils'
import { getOrderStatusColor, ORDER_STATUS_CLASS } from '../../utils/orderStatusUtils'
import { useAuth } from '../../context/AuthContext'

export default function AdminProfile() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Valid tab values
  const validTabs = ['statistics', 'sellers', 'buyers', 'products', 'orders', 'reviews', 'reports', 'payouts', 'categories', 'home', 'refunds']
  
  // Get active tab from URL or use default
  const urlTab = searchParams.get('tab')
  const activeTab = (urlTab && validTabs.includes(urlTab)) 
    ? urlTab 
    : 'statistics'
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSellers, setAllSellers] = useState<any[]>([])
  const [sellersPagination, setSellersPagination] = useState({ page: 1, perPage: 10 })
  const [sellersSortBy, setSellersSortBy] = useState<string>('date')
  const [sellersSortOrder, setSellersSortOrder] = useState<'asc' | 'desc'>('desc')
  const [buyersPagination, setBuyersPagination] = useState({ page: 1, perPage: 10 })
  const [buyersSortBy, setBuyersSortBy] = useState<string>('date')
  const [buyersSortOrder, setBuyersSortOrder] = useState<'asc' | 'desc'>('desc')
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, perPage: 10 })
  const [ordersSortBy, setOrdersSortBy] = useState<string>('date')
  const [ordersSortOrder, setOrdersSortOrder] = useState<'asc' | 'desc'>('desc')
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [productsLimit, setProductsLimit] = useState(10)
  const [productStats, setProductStats] = useState({ total: 0, pending: 0 })
  const [productsSortBy, setProductsSortBy] = useState<string>('createdAt')
  const [productsSortOrder, setProductsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [orderStats, setOrderStats] = useState<{ totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number } | null>(null)
  const [allReviews, setAllReviews] = useState<any[]>([])
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [adminReviewsSortBy, setAdminReviewsSortBy] = useState<string>('date')
  const [adminReviewsSortOrder, setAdminReviewsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [allReports, setAllReports] = useState<any[]>([])
  const [reportsPagination, setReportsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('all')
  const [reportsSortBy, setReportsSortBy] = useState<string>('date')
  const [reportsSortOrder, setReportsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pendingReportsCount, setPendingReportsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [editReportDialogOpen, setEditReportDialogOpen] = useState(false)
  const [editingReportStatus, setEditingReportStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending')
  const [editingReportNotes, setEditingReportNotes] = useState<string>('')
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null)
  const [allPayouts, setAllPayouts] = useState<payoutService.Payout[]>([])
  const [payoutsPagination, setPayoutsPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [payoutsSortBy, setPayoutsSortBy] = useState<string>('date')
  const [payoutsSortOrder, setPayoutsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('all')
  const [payoutStats, setPayoutStats] = useState<payoutService.PayoutStats | null>(null)
  const [updatingPayoutId, setUpdatingPayoutId] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<payoutService.Payout | null>(null)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutStatusUpdate, setPayoutStatusUpdate] = useState<{ status: string; failureReason?: string }>({ status: '' })
  const [payoutOrderDetails, setPayoutOrderDetails] = useState<any[]>([])
  const [payoutOrderDetailsLoading, setPayoutOrderDetailsLoading] = useState(false)
  const [expandedPayoutRows, setExpandedPayoutRows] = useState<Set<string>>(new Set())
  const [payoutOrdersMap, setPayoutOrdersMap] = useState<{ [key: string]: any[] }>({})
  const [payoutOrdersLoadingMap, setPayoutOrdersLoadingMap] = useState<{ [key: string]: boolean }>({})
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null)
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [isCreatingSeller, setIsCreatingSeller] = useState(false)
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null)
  const [editSellerDialogOpen, setEditSellerDialogOpen] = useState(false)
  const [editingSeller, setEditingSeller] = useState({
    businessName: '',
    businessDescription: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    userId: '',
    email: '',
    fullName: ''
  })
  const [updatingSeller, setUpdatingSeller] = useState(false)
  const [deleteSellerDialogOpen, setDeleteSellerDialogOpen] = useState(false)
  const [sellerToDelete, setSellerToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deletingSeller, setDeletingSeller] = useState(false)
  const [editingBuyerId, setEditingBuyerId] = useState<string | null>(null)
  const [editBuyerDialogOpen, setEditBuyerDialogOpen] = useState(false)
  const [editingBuyer, setEditingBuyer] = useState({
    fullName: '',
    email: ''
  })
  const [updatingBuyer, setUpdatingBuyer] = useState(false)
  const [resettingPasswordUserId, setResettingPasswordUserId] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'customer' as 'customer' | 'seller' | 'admin',
    businessName: '',
    businessDescription: ''
  })
  const [allCategories, setAllCategories] = useState<categoryService.Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesPagination, setCategoriesPagination] = useState({ page: 1, perPage: 10 })
  const [categoriesSortBy, setCategoriesSortBy] = useState<string>('name')
  const [categoriesSortOrder, setCategoriesSortOrder] = useState<'asc' | 'desc'>('asc')
  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false)
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: ''
  })
  const [editingCategory, setEditingCategory] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true
  })
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [updatingCategory, setUpdatingCategory] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(false)
  const [homeSettings, setHomeSettings] = useState<homeSettingsService.HomeSettingsAdminResponse | null>(null)
  const [homeSettingsLoading, setHomeSettingsLoading] = useState(false)
  const [updatingHomeSettings, setUpdatingHomeSettings] = useState(false)
  const [selectedFeaturedCategories, setSelectedFeaturedCategories] = useState<string[]>([])
  const [selectedFeaturedProducts, setSelectedFeaturedProducts] = useState<string[]>([])
  const [marketplaceSettings, setMarketplaceSettings] = useState<marketplaceSettingsService.MarketplaceSettingsAdmin | null>(null)
  const [marketplaceSettingsLoading, setMarketplaceSettingsLoading] = useState(false)
  const [updatingMarketplaceSettings, setUpdatingMarketplaceSettings] = useState(false)
  const [commissionRateInput, setCommissionRateInput] = useState<string>('')
  const [allRefundRequests, setAllRefundRequests] = useState<orderService.RefundRequest[]>([])
  const [refundRequestsLoading, setRefundRequestsLoading] = useState(false)
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('all')
  const [selectedRefundRequest, setSelectedRefundRequest] = useState<orderService.RefundRequest | null>(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundStatusUpdate, setRefundStatusUpdate] = useState<{ status: 'pending' | 'approved' | 'rejected'; adminNotes?: string }>({ status: 'pending' })
  const [updatingRefundStatus, setUpdatingRefundStatus] = useState(false)
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null)
  const [backups, setBackups] = useState<backupService.Backup[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [deletingBackupFilename, setDeletingBackupFilename] = useState<string | null>(null)
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<any | null>(null)
  const [reviewDetailDialogOpen, setReviewDetailDialogOpen] = useState(false)

  const fetchProducts = async (page = 1, limit: number = productsLimit) => {
    const response = await productService.getAllProducts({ page, limit })
    setAllProducts(response.products)
    setProductsPagination(response.pagination)
    setProductsLimit(response.pagination.limit ?? limit)
  }

  // Get sorted products
  const getSortedProducts = () => {
    const sorted = [...allProducts].sort((a, b) => {
      let comparison = 0
      switch (productsSortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        case 'price':
          comparison = (a.price || 0) - (b.price || 0)
          break
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '')
          break
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          break
        default:
          return 0
      }
      return productsSortOrder === 'asc' ? comparison : -comparison
    })
    return sorted
  }

  // Get sorted payouts (sorts current page results)
  const getSortedPayouts = () => {
    const getSellerName = (payout: payoutService.Payout) => {
      const seller = (payout as any).sellerId
      return (seller?.fullName || seller?.email || 'Unknown').toString()
    }

    const sorted = [...allPayouts].sort((a, b) => {
      let comparison = 0
      switch (payoutsSortBy) {
        case 'date':
          comparison = new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'commission':
          comparison = a.commission - b.commission
          break
        case 'netAmount':
          comparison = a.netAmount - b.netAmount
          break
        case 'status':
          comparison = a.status.toString().localeCompare(b.status.toString())
          break
        case 'seller':
          comparison = getSellerName(a).localeCompare(getSellerName(b))
          break
        case 'orders':
          comparison = a.orderCount - b.orderCount
          break
        default:
          return 0
      }
      return payoutsSortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  // Get sorted categories (client-side)
  const getSortedCategories = () => {
    const sorted = [...allCategories].sort((a, b) => {
      let comparison = 0
      switch (categoriesSortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'slug':
          comparison = (a.slug || '').localeCompare(b.slug || '')
          break
        case 'products':
          comparison = (a.productCount || 0) - (b.productCount || 0)
          break
        case 'status':
          comparison = (a.isActive ? 'Active' : 'Inactive').localeCompare(b.isActive ? 'Active' : 'Inactive')
          break
        default:
          return 0
      }
      return categoriesSortOrder === 'asc' ? comparison : -comparison
    })
    return sorted
  }

  const categoriesTotalPages = Math.ceil(allCategories.length / categoriesPagination.perPage) || 1
  const sortedCategories = getSortedCategories()
  const paginatedCategories = sortedCategories.slice(
    (categoriesPagination.page - 1) * categoriesPagination.perPage,
    categoriesPagination.page * categoriesPagination.perPage
  )

  const fetchReviews = async (page = 1, limit: number = reviewsPagination.limit) => {
    try {
      const response = await reviewService.getAllReviewsAdmin({ page, limit })
      setAllReviews(response.reviews)
      setReviewsPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }

  // Get sorted admin reviews (sorts current page results)
  const getSortedAdminReviews = () => {
    const getProductTitle = (review: any) => {
      const product = review.productId as any
      return (typeof product === 'object' ? (product?.title || 'N/A') : 'N/A').toString()
    }
    const getUserLabel = (review: any) => {
      const user = review.userId as any
      const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
      const userName = typeof user === 'object' ? (user?.fullName || userEmail) : userEmail
      return userName.toString()
    }

    const sorted = [...allReviews].sort((a, b) => {
      let comparison = 0
      switch (adminReviewsSortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0)
          break
        case 'status':
          comparison = (a.status || '').toString().localeCompare((b.status || '').toString())
          break
        case 'product':
          comparison = getProductTitle(a).localeCompare(getProductTitle(b))
          break
        case 'user':
          comparison = getUserLabel(a).localeCompare(getUserLabel(b))
          break
        default:
          return 0
      }
      return adminReviewsSortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  const fetchReports = async (
    page = 1,
    status: string = reportsStatusFilter,
    limit: number = reportsPagination.limit
  ) => {
    try {
      const params: any = { page, limit }
      if (status && status !== 'all') {
        params.status = status
      }
      const response = await reportService.getAllReports(params)
      setAllReports(response.reports)
      setReportsPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  // Get sorted admin reports (sorts current page results)
  const getSortedAdminReports = () => {
    const getContentSummary = (report: any) => {
      if (!report?.reportedContent) return 'Deleted'
      if (report.reportedType === 'product') return (report.reportedContent.title || 'N/A').toString()
      if (report.reportedType === 'user') return (report.reportedContent.fullName || report.reportedContent.email || 'N/A').toString()
      if (report.reportedType === 'review') {
        const comment = report.reportedContent.comment || ''
        return comment ? (comment.substring(0, 50) + (comment.length > 50 ? '...' : '')) : 'No comment'
      }
      return 'N/A'
    }

    const sorted = [...allReports].sort((a, b) => {
      let comparison = 0
      switch (reportsSortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'status':
          comparison = (a.status || '').toString().localeCompare((b.status || '').toString())
          break
        case 'type':
          comparison = (a.reportedType || '').toString().localeCompare((b.reportedType || '').toString())
          break
        case 'reportId':
          comparison = (a.id || a._id || '').toString().localeCompare((b.id || b._id || '').toString())
          break
        case 'description':
          comparison = (a.description || '').toString().localeCompare((b.description || '').toString())
          break
        case 'content':
          comparison = getContentSummary(a).localeCompare(getContentSummary(b))
          break
        default:
          return 0
      }
      return reportsSortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  const fetchPendingReportsCount = async () => {
    try {
      const response = await reportService.getPendingReportsCount()
      setPendingReportsCount(response.count)
    } catch (error) {
      console.error('Failed to fetch pending reports count:', error)
    }
  }

  const fetchPayouts = async (page = 1, status?: string, limit: number = payoutsPagination.limit) => {
    try {
      const params: payoutService.GetAllPayoutsParams = { page, limit }
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

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await categoryService.getAllCategoriesAdmin()
      setAllCategories(response.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      })
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchHomeSettings = async () => {
    setHomeSettingsLoading(true)
    try {
      const response = await homeSettingsService.getHomeSettingsAdmin()
      setHomeSettings(response)
      setSelectedFeaturedCategories(response.featuredCategoryIds)
      setSelectedFeaturedProducts(response.featuredProductIds)
    } catch (error) {
      console.error('Failed to fetch home settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch home settings',
        variant: 'destructive',
      })
    } finally {
      setHomeSettingsLoading(false)
    }
  }

  const fetchMarketplaceSettings = async () => {
    setMarketplaceSettingsLoading(true)
    try {
      const response = await marketplaceSettingsService.getMarketplaceSettingsAdmin()
      setMarketplaceSettings(response)
      setCommissionRateInput(response.commissionRatePercent.toString())
    } catch (error) {
      console.error('Failed to fetch marketplace settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch marketplace settings',
        variant: 'destructive',
      })
    } finally {
      setMarketplaceSettingsLoading(false)
    }
  }

  const fetchRefundRequests = async () => {
    setRefundRequestsLoading(true)
    try {
      const response = await orderService.getRefundRequests()
      setAllRefundRequests(response.refundRequests)
    } catch (error) {
      console.error('Failed to fetch refund requests:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch refund requests',
        variant: 'destructive',
      })
    } finally {
      setRefundRequestsLoading(false)
    }
  }

  const fetchBackups = async () => {
    setBackupsLoading(true)
    try {
      const response = await backupService.listBackups()
      setBackups(response.backups)
    } catch (error) {
      console.error('Failed to fetch backups:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch backups',
        variant: 'destructive',
      })
    } finally {
      setBackupsLoading(false)
    }
  }

  const handleUpdateRefundStatus = async () => {
    if (!selectedRefundRequest) return

    setUpdatingRefundStatus(true)
    try {
      await orderService.updateRefundRequestStatus(
        selectedRefundRequest.id,
        refundStatusUpdate.status,
        refundStatusUpdate.adminNotes
      )
      await fetchRefundRequests()
      setRefundDialogOpen(false)
      setSelectedRefundRequest(null)
      setRefundStatusUpdate({ status: 'pending' })
      toast({
        title: 'Success',
        description: 'Refund request status updated successfully',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update refund status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingRefundStatus(false)
    }
  }

  const handleProcessRefund = async (refundRequestId: string) => {
    setProcessingRefundId(refundRequestId)
    try {
      await orderService.processRefund(refundRequestId)
      await fetchRefundRequests()
      toast({
        title: 'Success',
        description: 'Refund processed successfully',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to process refund',
        variant: 'destructive',
      })
    } finally {
      setProcessingRefundId(null)
    }
  }

  const handleUpdateMarketplaceSettings = async () => {
    const ratePercent = parseFloat(commissionRateInput)
    if (isNaN(ratePercent) || ratePercent < 0 || ratePercent > 100) {
      toast({
        title: 'Validation Error',
        description: 'Commission rate must be between 0 and 100',
        variant: 'destructive',
      })
      return
    }

    setUpdatingMarketplaceSettings(true)
    try {
      const rate = ratePercent / 100 // Convert percentage to decimal
      await marketplaceSettingsService.updateMarketplaceSettings({ commissionRate: rate })
      await fetchMarketplaceSettings()
      toast({
        title: 'Success',
        description: 'Marketplace settings updated successfully',
      })
    } catch (error: any) {
      console.error('Failed to update marketplace settings:', error)
      const errorMessage = error?.response?.data?.error || 'Failed to update marketplace settings'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUpdatingMarketplaceSettings(false)
    }
  }

  const handleUpdateHomeSettings = async () => {
    if (selectedFeaturedCategories.length > 6) {
      toast({
        title: 'Validation Error',
        description: 'You can only select up to 6 categories',
        variant: 'destructive',
      })
      return
    }
    if (selectedFeaturedProducts.length > 12) {
      toast({
        title: 'Validation Error',
        description: 'You can only select up to 12 products',
        variant: 'destructive',
      })
      return
    }

    setUpdatingHomeSettings(true)
    try {
      await homeSettingsService.updateHomeSettings({
        featuredCategoryIds: selectedFeaturedCategories,
        featuredProductIds: selectedFeaturedProducts
      })
      await fetchHomeSettings()
      toast({
        title: 'Success',
        description: 'Home settings updated successfully',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update home settings'
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUpdatingHomeSettings(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast({
        title: 'Validation Error',
        description: 'Name and slug are required.',
        variant: 'destructive',
      })
      return
    }

    setCreatingCategory(true)
    try {
      await categoryService.createCategory(newCategory)
      await fetchCategories()
      setCreateCategoryDialogOpen(false)
      setNewCategory({ name: '', slug: '', description: '' })
      toast({
        title: 'Category Created',
        description: 'Category has been created successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to create category'
      toast({
        title: 'Creation Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleEditCategory = (category: categoryService.Category) => {
    const categoryId = category._id || category.id
    setEditingCategoryId(categoryId || '')
    setEditingCategory({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive
    })
    setEditCategoryDialogOpen(true)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || !editingCategory.name || !editingCategory.slug) {
      toast({
        title: 'Validation Error',
        description: 'Name and slug are required.',
        variant: 'destructive',
      })
      return
    }

    setUpdatingCategory(true)
    try {
      await categoryService.updateCategory(editingCategoryId, editingCategory)
      await fetchCategories()
      setEditCategoryDialogOpen(false)
      setEditingCategoryId(null)
      setEditingCategory({ name: '', slug: '', description: '', isActive: true })
      toast({
        title: 'Category Updated',
        description: 'Category has been updated successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update category'
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUpdatingCategory(false)
    }
  }

  const handleDeleteCategory = (category: categoryService.Category) => {
    const categoryId = category._id || category.id
    const categoryName = category.name
    setCategoryToDelete({ id: categoryId || '', name: categoryName })
    setDeleteCategoryDialogOpen(true)
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return

    setDeletingCategory(true)
    try {
      await categoryService.deleteCategory(categoryToDelete.id)
      await fetchCategories()
      setDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
      toast({
        title: 'Category Deleted',
        description: 'Category has been deleted successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete category'
      toast({
        title: 'Deletion Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setDeletingCategory(false)
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
    if (activeTab === 'refunds') {
      fetchRefundRequests()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchBackups()
    }
  }, [activeTab])

  useEffect(() => {
    if (payoutStatusFilter) {
      // reset to first page when filter changes
      setPayoutsPagination((p) => ({ ...p, page: 1 }))
      fetchPayoutStats()
    }
  }, [payoutStatusFilter])

  useEffect(() => {
    fetchPayouts(payoutsPagination.page, payoutStatusFilter, payoutsPagination.limit)
  }, [payoutsPagination.page, payoutsPagination.limit, payoutStatusFilter])

  useEffect(() => {
    const fetchPayoutOrderDetails = async () => {
      if (payoutDialogOpen && selectedPayout) {
        setPayoutOrderDetailsLoading(true)
        try {
          const payoutDetails = await payoutService.getPayoutById(selectedPayout.id)
          if (payoutDetails.orders && Array.isArray(payoutDetails.orders)) {
            const processedOrders = payoutDetails.orders.map((order: any) => {
              const orderId = order._id || order.id || ''
              const items = order.items || []
              const sellerRevenue = order.totalAmount || items.reduce((sum: number, item: any) => {
                return sum + (item.price * item.quantity)
              }, 0)

              return {
                id: orderId,
                orderNumber: orderId.slice(-8),
                createdAt: order.createdAt,
                status: order.status,
                sellerRevenue
              }
            })
            setPayoutOrderDetails(processedOrders)
          } else {
            setPayoutOrderDetails([])
          }
        } catch (error) {
          console.error('Error fetching payout order details:', error)
          setPayoutOrderDetails([])
        } finally {
          setPayoutOrderDetailsLoading(false)
        }
      } else {
        setPayoutOrderDetails([])
      }
    }

    fetchPayoutOrderDetails()
  }, [payoutDialogOpen, selectedPayout])

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
        await fetchMarketplaceSettings()
        setAllUsers(users)
        setAllSellers(sellers)
        setProductStats(productStatsData)
        setAllProducts(productsResponse.products)
        setProductsPagination(productsResponse.pagination)
        setAllOrders(ordersData.orders)
        setOrderStats(ordersData.statistics)
        await fetchReviews(1)
        await fetchReports(1, reportsStatusFilter, reportsPagination.limit)
        await fetchPendingReportsCount()
        await fetchCategories()
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // reset to first page when filter changes
    setReportsPagination((p) => ({ ...p, page: 1 }))
  }, [reportsStatusFilter])

  useEffect(() => {
    fetchReports(reportsPagination.page, reportsStatusFilter, reportsPagination.limit)
  }, [reportsPagination.page, reportsPagination.limit, reportsStatusFilter])

  useEffect(() => {
    if (activeTab === 'home') {
      fetchHomeSettings()
    }
  }, [activeTab])


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

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: 'Validation Error',
        description: 'Email and password are required.',
        variant: 'destructive',
      })
      return
    }

    // Ensure role is 'seller' when creating from All Sellers section
    const userRole = isCreatingSeller ? 'seller' : newUser.role

    if ((isCreatingSeller || newUser.role === 'seller') && !newUser.businessName) {
      toast({
        title: 'Validation Error',
        description: 'Business name is required for seller accounts.',
        variant: 'destructive',
      })
      return
    }

    setCreatingUser(true)
    try {
      const response = await userService.createUser({
        email: newUser.email,
        password: newUser.password,
        fullName: newUser.fullName || undefined,
        role: userRole,
        businessName: (isCreatingSeller || newUser.role === 'seller') ? newUser.businessName : undefined,
        businessDescription: (isCreatingSeller || newUser.role === 'seller') ? newUser.businessDescription : undefined
      })

      // Refresh users and sellers lists
      const [users, sellers] = await Promise.all([
        userService.getAllUsers(),
        sellerService.getAllSellers()
      ])
      setAllUsers(users)
      setAllSellers(sellers)

      // Reset form
      setNewUser({
        email: '',
        password: '',
        fullName: '',
        role: 'customer',
        businessName: '',
        businessDescription: ''
      })
      setIsCreatingSeller(false)
      setCreateUserDialogOpen(false)

      toast({
        title: 'User Created',
        description: response.message || 'User has been created successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to create user'
      toast({
        title: 'Creation Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleEditSeller = (seller: any) => {
    setEditingSellerId((seller as any)._id || seller.id)
    const user = seller.userId as any
    const userId = typeof user === 'object' ? (user?._id || user?.id) : user
    const userEmail = typeof user === 'object' ? (user?.email || '') : ''
    const userFullName = typeof user === 'object' ? (user?.fullName || '') : ''
    setEditingSeller({
      businessName: seller.businessName,
      businessDescription: seller.businessDescription || '',
      status: seller.status,
      userId: userId || '',
      email: userEmail,
      fullName: userFullName
    })
    setEditSellerDialogOpen(true)
  }

  const handleUpdateSeller = async () => {
    if (!editingSeller.businessName) {
      toast({
        title: 'Validation Error',
        description: 'Business name is required.',
        variant: 'destructive',
      })
      return
    }

    if (!editingSeller.email) {
      toast({
        title: 'Validation Error',
        description: 'Email is required.',
        variant: 'destructive',
      })
      return
    }

    if (!editingSellerId || !editingSeller.userId) return

    setUpdatingSeller(true)
    try {
      // Update seller profile
      await sellerService.updateSellerProfileAdmin(editingSellerId, {
        businessName: editingSeller.businessName,
        businessDescription: editingSeller.businessDescription || undefined,
        status: editingSeller.status
      })

      // Update user email and fullName
      await userService.updateUser(editingSeller.userId, {
        email: editingSeller.email,
        fullName: editingSeller.fullName || undefined
      })

      // Refresh sellers list
      const sellers = await sellerService.getAllSellers()
      setAllSellers(sellers)

      setEditSellerDialogOpen(false)
      setEditingSellerId(null)
      setEditingSeller({
        businessName: '',
        businessDescription: '',
        status: 'pending',
        userId: '',
        email: '',
        fullName: ''
      })

      toast({
        title: 'Seller Updated',
        description: 'Seller profile and user information have been updated successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update seller'
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUpdatingSeller(false)
    }
  }

  const handleDeleteSeller = (sellerId: string, sellerName: string) => {
    setSellerToDelete({ id: sellerId, name: sellerName })
    setDeleteSellerDialogOpen(true)
  }

  const handleDeleteSellerConfirm = async () => {
    if (!sellerToDelete) return

    setDeletingSeller(true)
    try {
      await sellerService.deleteSeller(sellerToDelete.id)
      
      // Refresh both sellers and users lists since we're deleting the user account too
      const [sellers, users] = await Promise.all([
        sellerService.getAllSellers(),
        userService.getAllUsers()
      ])
      setAllSellers(sellers)
      setAllUsers(users)
      
      setDeleteSellerDialogOpen(false)
      setSellerToDelete(null)
      toast({
        title: 'Seller Deleted',
        description: 'The seller and owner account have been deleted successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete seller'
      toast({
        title: 'Deletion Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setDeletingSeller(false)
    }
  }

  const handleEditBuyer = (buyer: any) => {
    const buyerId = (buyer as any)._id || buyer.id
    setEditingBuyerId(buyerId)
    setEditingBuyer({
      fullName: buyer.fullName || '',
      email: buyer.email || ''
    })
    setEditBuyerDialogOpen(true)
  }

  const handleUpdateBuyer = async () => {
    if (!editingBuyer.email) {
      toast({
        title: 'Validation Error',
        description: 'Email is required.',
        variant: 'destructive',
      })
      return
    }

    if (!editingBuyerId) return

    setUpdatingBuyer(true)
    try {
      await userService.updateUser(editingBuyerId, {
        fullName: editingBuyer.fullName || undefined,
        email: editingBuyer.email
      })

      // Refresh users list
      const users = await userService.getAllUsers()
      setAllUsers(users)

      setEditBuyerDialogOpen(false)
      setEditingBuyerId(null)
      setEditingBuyer({
        fullName: '',
        email: ''
      })

      toast({
        title: 'Buyer Updated',
        description: 'Buyer profile has been updated successfully.',
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update buyer'
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUpdatingBuyer(false)
    }
  }

  const handleInitPassword = async (userId: string, userName: string) => {
    setResettingPasswordUserId(userId)
    try {
      await userService.resetUserPassword(userId, 'Root123!')
      toast({
        title: 'Password Initialized',
        description: `Password has been reset to "Root123!" for ${userName}.`,
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to reset password'
      toast({
        title: 'Password Reset Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setResettingPasswordUserId(null)
    }
  }

  // Separate buyers (customers) and sellers from all users
  const allBuyers = allUsers.filter((u) => u.role === 'customer')

  // Get sorted sellers
  const getSortedSellers = () => {
    const sortedSellers = [...allSellers].sort((a, b) => {
      let comparison = 0
      switch (sellersSortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'businessName':
          comparison = (a.businessName || '').localeCompare(b.businessName || '')
          break
        case 'owner':
          const aUserName = typeof a.userId === 'object' && a.userId !== null
            ? (a.userId as any).fullName || (a.userId as any).email || ''
            : ''
          const bUserName = typeof b.userId === 'object' && b.userId !== null
            ? (b.userId as any).fullName || (b.userId as any).email || ''
            : ''
          comparison = aUserName.localeCompare(bUserName)
          break
        case 'email':
          const aEmail = typeof a.userId === 'object' && a.userId !== null
            ? (a.userId as any).email || ''
            : ''
          const bEmail = typeof b.userId === 'object' && b.userId !== null
            ? (b.userId as any).email || ''
            : ''
          comparison = aEmail.localeCompare(bEmail)
          break
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '')
          break
        default:
          return 0
      }
      return sellersSortOrder === 'asc' ? comparison : -comparison
    })
    return sortedSellers
  }

  const sellersTotalPages = Math.ceil(allSellers.length / sellersPagination.perPage) || 1
  const sortedSellers = getSortedSellers()
  const paginatedSellers = sortedSellers.slice(
    (sellersPagination.page - 1) * sellersPagination.perPage,
    sellersPagination.page * sellersPagination.perPage
  )

  // Get sorted buyers
  const getSortedBuyers = () => {
    const sortedBuyers = [...allBuyers].sort((a, b) => {
      let comparison = 0
      switch (buyersSortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'name':
          const aName = (a.fullName || a.name || a.email || '').toString()
          const bName = (b.fullName || b.name || b.email || '').toString()
          comparison = aName.localeCompare(bName)
          break
        case 'email':
          comparison = (a.email || '').toString().localeCompare((b.email || '').toString())
          break
        case 'role':
          comparison = (a.role || '').toString().localeCompare((b.role || '').toString())
          break
        default:
          return 0
      }
      return buyersSortOrder === 'asc' ? comparison : -comparison
    })
    return sortedBuyers
  }

  const buyersTotalPages = Math.ceil(allBuyers.length / buyersPagination.perPage) || 1
  const sortedBuyers = getSortedBuyers()
  const paginatedBuyers = sortedBuyers.slice(
    (buyersPagination.page - 1) * buyersPagination.perPage,
    buyersPagination.page * buyersPagination.perPage
  )

  // Get sorted orders
  const getSortedOrders = () => {
    const getCustomerLabel = (order: any) => {
      const isGuestOrder = !order?.userId || (order as any)?.guestEmail
      if (isGuestOrder) {
        return `Guest${(order as any)?.guestEmail ? ` (${(order as any).guestEmail})` : ''}`
      }
      const user = order?.userId as any
      return typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
    }

    const sortedOrders = [...allOrders].sort((a, b) => {
      let comparison = 0
      switch (ordersSortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'amount':
          comparison = (a.totalAmount || 0) - (b.totalAmount || 0)
          break
        case 'status':
          comparison = (a.status || '').toString().localeCompare((b.status || '').toString())
          break
        case 'items':
          comparison = (a.items?.length ?? 0) - (b.items?.length ?? 0)
          break
        case 'customer':
          comparison = getCustomerLabel(a).localeCompare(getCustomerLabel(b))
          break
        case 'orderId':
          comparison = (a._id || a.id || '').toString().localeCompare((b._id || b.id || '').toString())
          break
        default:
          return 0
      }
      return ordersSortOrder === 'asc' ? comparison : -comparison
    })

    return sortedOrders
  }

  const ordersTotalPages = Math.ceil(allOrders.length / ordersPagination.perPage) || 1
  const sortedOrders = getSortedOrders()
  const paginatedOrders = sortedOrders.slice(
    (ordersPagination.page - 1) * ordersPagination.perPage,
    ordersPagination.page * ordersPagination.perPage
  )

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">
              Admin Dashboard
              {user?.email && (
                <span className="text-base font-normal text-muted-foreground ml-2">
                  {user.email}
                </span>
              )}
            </h1>
          </div>
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

      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-6">
        <TabsList>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="sellers" className="gap-2">
            <Store className="h-4 w-4" />
            All Sellers
          </TabsTrigger>
          <TabsTrigger value="buyers" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Buyers
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tags className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="home" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="refunds" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refunds
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2" style={{ display: 'none' }}>
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <BarChart3 className="h-6 w-6" />
                Admin Statistics
              </h2>
              <p className="text-muted-foreground">
                Overview of platform performance and key metrics
              </p>
            </div>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allUsers.length}</div>
                  <p className="text-xs text-muted-foreground">All users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allSellers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {allSellers.filter((s) => s.status === 'approved').length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allProducts.length}</div>
                  <p className="text-xs text-muted-foreground">Total listings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allOrders.length}</div>
                  <p className="text-xs text-muted-foreground">Total orders</p>
                </CardContent>
              </Card>
            </div>

            {/* Finance Overview Section */}
            {orderStats && (() => {
              // Calculate refund statistics
              const processedRefunds = allRefundRequests.filter(r => r.status === 'processed')
              const approvedRefunds = allRefundRequests.filter(r => r.status === 'approved')
              const pendingRefunds = allRefundRequests.filter(r => r.status === 'pending')
              const rejectedRefunds = allRefundRequests.filter(r => r.status === 'rejected')
              const totalRefundAmount = allRefundRequests
                .filter(r => r.status === 'processed' || r.status === 'approved')
                .reduce((sum, r) => sum + (r.refundAmount || 0), 0)
              
              // Calculate platform metrics
              const totalRevenue = orderStats.totalRevenue
              const totalCommission = payoutStats ? payoutStats.totalCommission : 0
              const totalPaidToSellers = payoutStats ? payoutStats.totalPaidOut : 0
              const pendingPayouts = payoutStats ? payoutStats.pendingAmount : 0
              
              // Calculate net platform revenue (commission minus commission lost on refunds)
              const commissionRate = marketplaceSettings 
                ? marketplaceSettings.commissionRatePercent / 100 
                : (totalRevenue > 0 ? totalCommission / totalRevenue : 0.1)
              const commissionLostOnRefunds = totalRefundAmount * commissionRate
              const netPlatformRevenue = totalCommission - commissionLostOnRefunds
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Finance Overview
                    </CardTitle>
                    <CardDescription>
                      Complete platform financial status and earnings breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Key Finance Metrics */}
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">All orders revenue</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Refunded Amount</p>
                        <p className="text-xl font-bold">${totalRefundAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{allRefundRequests.length} refund{allRefundRequests.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Platform Commission</p>
                        <p className="text-xl font-bold">${totalCommission.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Total collected</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Net Platform Revenue</p>
                        <p className="text-xl font-bold">${netPlatformRevenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">After refunds impact</p>
                      </div>
                      {payoutStats && (
                        <>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total Paid to Sellers</p>
                            <p className="text-xl font-bold">${totalPaidToSellers.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Completed payouts</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Pending Payouts</p>
                            <p className="text-xl font-bold">${pendingPayouts.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">In process</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-sm font-semibold">Detailed Breakdown</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Revenue & Commission Details */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue & Commission</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Total Revenue</span>
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
                              <span className="text-sm text-muted-foreground">Platform Commission</span>
                              <span className="font-medium">${totalCommission.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-t pt-2">
                              <span className="text-sm font-semibold">Net Platform Revenue</span>
                              <span className="font-bold">${netPlatformRevenue.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payout Details */}
                        {payoutStats && (
                          <div className="space-y-3">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Seller Payouts</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Total Paid to Sellers</span>
                                <span className="font-medium">${totalPaidToSellers.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground pl-2">
                                {payoutStats.completed} completed payout{payoutStats.completed !== 1 ? 's' : ''}
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Pending Payouts</span>
                                <span className="font-medium">${pendingPayouts.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground pl-2">
                                {payoutStats.pending + payoutStats.processing} payout{(payoutStats.pending + payoutStats.processing) !== 1 ? 's' : ''} in process
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Total Payout Amount</span>
                                <span className="font-medium">${payoutStats.totalAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-t pt-2">
                                <span className="text-sm font-medium">Total Payouts</span>
                                <span className="font-bold">{payoutStats.total}</span>
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
                              <span className="font-medium">{processedRefunds.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Approved (Processing)</span>
                              <span className="font-medium">{approvedRefunds.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Pending Requests</span>
                              <span className="font-medium">{pendingRefunds.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Rejected Requests</span>
                              <span className="font-medium">{rejectedRefunds.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-t pt-2">
                              <span className="text-sm font-medium">Total Refund Requests</span>
                              <span className="font-bold">{allRefundRequests.length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Statistics */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Statistics</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Total Orders</span>
                              <span className="font-medium">{orderStats.totalOrders}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Delivered Orders</span>
                              <span className="font-medium">{orderStats.deliveredOrders}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Pending Orders</span>
                              <span className="font-medium">{orderStats.pendingOrders}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">Cancelled Orders</span>
                              <span className="font-medium">
                                {allOrders.filter(o => o.status === 'cancelled').length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Product Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Product Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <span className="font-bold">{productStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Approval</span>
                  <span className="font-bold">{productStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="font-bold">
                    {allProducts.filter((p) => p.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rejected</span>
                  <span className="font-bold">
                    {allProducts.filter((p) => p.status === 'rejected').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* User Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">User Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {allUsers.filter((u) => u.role === 'customer').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Buyers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {allUsers.filter((u) => u.role === 'seller').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Sellers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {allUsers.filter((u) => u.role === 'admin').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Status Breakdown */}
            {allSellers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Seller Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {allSellers.filter((s) => s.status === 'approved').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {allSellers.filter((s) => s.status === 'pending').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {allSellers.filter((s) => s.status === 'rejected').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Rejected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Status Breakdown */}
            {allOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Order Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
                      const count = allOrders.filter((o) => o.status === status).length
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

            {/* Reviews and Reports */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reviewsPagination.total}</div>
                  <p className="text-xs text-muted-foreground">Total reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allReports.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingReportsCount > 0 && (
                      <span>{pendingReportsCount} pending</span>
                    )}
                    {pendingReportsCount === 0 && 'All resolved'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Sellers</CardTitle>
                  <CardDescription>View and manage all sellers - review and approve seller applications</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={sellersPagination.perPage?.toString() || '10'}
                    onValueChange={(value) => {
                      setSellersPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                    value={`${sellersSortBy}-${sellersSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setSellersSortBy(newSortBy)
                      setSellersSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="businessName-asc">Business Name (A-Z)</SelectItem>
                      <SelectItem value="businessName-desc">Business Name (Z-A)</SelectItem>
                      <SelectItem value="owner-asc">Owner (A-Z)</SelectItem>
                      <SelectItem value="owner-desc">Owner (Z-A)</SelectItem>
                      <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                      <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setNewUser({
                        email: '',
                        password: '',
                        fullName: '',
                        role: 'seller',
                        businessName: '',
                        businessDescription: ''
                      })
                      setIsCreatingSeller(true)
                      setCreateUserDialogOpen(true)
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Seller
                  </Button>
                </div>
              </div>
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
                        <th className="px-4 py-3 text-left font-medium">Owner</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Applied</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSellers.map((seller, index) => {
                        const sellerId = (seller as any)._id || seller.id
                        const user = seller.userId as any
                        const userId = typeof user === 'object' ? (user?._id || user?.id) : user
                        const userEmail = typeof user === 'object' ? (user?.email || 'N/A') : 'N/A'
                        const userName = typeof user === 'object' ? (user?.fullName || userEmail) : userEmail
                        const userRole = typeof user === 'object' ? (user?.role || 'N/A') : 'N/A'
                        const rowNo = (sellersPagination.page - 1) * sellersPagination.perPage + index + 1

                        return (
                          <tr key={sellerId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3 font-medium">{seller.businessName}</td>
                            <td className="px-4 py-3">{userName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{userEmail}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="capitalize">
                                {userRole}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="capitalize">{seller.status}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(seller.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (userId) {
                                      handleInitPassword(userId, userName)
                                    }
                                  }}
                                  disabled={!userId || resettingPasswordUserId === userId}
                                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                  <Key className="h-4 w-4 mr-1" />
                                  {resettingPasswordUserId === userId ? 'Resetting...' : 'Init Password'}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleEditSeller(seller)}
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteSeller(sellerId, seller.businessName)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allSellers.length > 0 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Showing{' '}
                      {allSellers.length === 0
                        ? 0
                        : (sellersPagination.page - 1) * sellersPagination.perPage + 1}
                      –{Math.min(sellersPagination.page * sellersPagination.perPage, allSellers.length)} of{' '}
                      {allSellers.length} sellers
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Items per page:</span>
                      <Select
                        value={sellersPagination.perPage?.toString() || '10'}
                        onValueChange={(value) => {
                          setSellersPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                        value={`${sellersSortBy}-${sellersSortOrder}`}
                        onValueChange={(value) => {
                          const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                          setSellersSortBy(newSortBy)
                          setSellersSortOrder(newSortOrder)
                        }}
                      >
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                          <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                          <SelectItem value="businessName-asc">Business Name (A-Z)</SelectItem>
                          <SelectItem value="businessName-desc">Business Name (Z-A)</SelectItem>
                          <SelectItem value="owner-asc">Owner (A-Z)</SelectItem>
                          <SelectItem value="owner-desc">Owner (Z-A)</SelectItem>
                          <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                          <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                          <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                          <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {allSellers.length > sellersPagination.perPage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={sellersPagination.page <= 1}
                        onClick={() => setSellersPagination((p) => ({ ...p, page: p.page - 1 }))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-muted-foreground min-w-[120px] text-center">
                        Page {sellersPagination.page} of {sellersTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={sellersPagination.page >= sellersTotalPages}
                        onClick={() => setSellersPagination((p) => ({ ...p, page: p.page + 1 }))}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Buyers</CardTitle>
                  <CardDescription>View and manage all customer accounts (buyers)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={buyersPagination.perPage?.toString() || '10'}
                    onValueChange={(value) => {
                      setBuyersPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                    value={`${buyersSortBy}-${buyersSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setBuyersSortBy(newSortBy)
                      setBuyersSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                      <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                      <SelectItem value="role-asc">Role (A-Z)</SelectItem>
                      <SelectItem value="role-desc">Role (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setNewUser({
                        email: '',
                        password: '',
                        fullName: '',
                        role: 'customer',
                        businessName: '',
                        businessDescription: ''
                      })
                      setIsCreatingSeller(false)
                      setCreateUserDialogOpen(true)
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Buyer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading buyers...</p>
              ) : allBuyers.length === 0 ? (
                <p className="text-muted-foreground">No buyers yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium w-12">No.</th>
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-left font-medium">Joined</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBuyers.map((buyer, index) => {
                        const buyerId = (buyer as any)._id || buyer.id
                        const buyerName = (buyer as any).fullName || buyer.name || buyer.email || 'N/A'
                        const rowNo = (buyersPagination.page - 1) * buyersPagination.perPage + index + 1

                        return (
                          <tr key={buyerId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3 font-medium">{buyerName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{buyer.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="capitalize">
                                {buyer.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(buyer.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleInitPassword(buyerId, buyerName)}
                                  disabled={resettingPasswordUserId === buyerId}
                                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                  <Key className="h-4 w-4 mr-1" />
                                  {resettingPasswordUserId === buyerId ? 'Resetting...' : 'Init Password'}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleEditBuyer(buyer)}
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(buyerId, buyerName)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allBuyers.length > 0 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Showing{' '}
                      {allBuyers.length === 0
                        ? 0
                        : (buyersPagination.page - 1) * buyersPagination.perPage + 1}
                      –{Math.min(buyersPagination.page * buyersPagination.perPage, allBuyers.length)} of{' '}
                      {allBuyers.length} buyers
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Items per page:</span>
                      <Select
                        value={buyersPagination.perPage?.toString() || '10'}
                        onValueChange={(value) => {
                          setBuyersPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                        value={`${buyersSortBy}-${buyersSortOrder}`}
                        onValueChange={(value) => {
                          const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                          setBuyersSortBy(newSortBy)
                          setBuyersSortOrder(newSortOrder)
                        }}
                      >
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                          <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                          <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                          <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                          <SelectItem value="role-asc">Role (A-Z)</SelectItem>
                          <SelectItem value="role-desc">Role (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {allBuyers.length > buyersPagination.perPage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={buyersPagination.page <= 1}
                        onClick={() => setBuyersPagination((p) => ({ ...p, page: p.page - 1 }))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-muted-foreground min-w-[120px] text-center">
                        Page {buyersPagination.page} of {buyersTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={buyersPagination.page >= buyersTotalPages}
                        onClick={() => setBuyersPagination((p) => ({ ...p, page: p.page + 1 }))}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Approvals</CardTitle>
                  <CardDescription>Review and approve product listings</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={(productsPagination.limit ?? productsLimit).toString()}
                    onValueChange={(value) => {
                      const nextLimit = parseInt(value)
                      setProductsLimit(nextLimit)
                      fetchProducts(1, nextLimit)
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
                    value={`${productsSortBy}-${productsSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setProductsSortBy(newSortBy)
                      setProductsSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="createdAt-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                      <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                      <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                      <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                      <SelectItem value="category-desc">Category (Z-A)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                        <th className="px-4 py-3 text-left font-medium">Price</th>
                        <th className="px-4 py-3 text-left font-medium">Category</th>
                        <th className="px-4 py-3 text-left font-medium">Seller</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedProducts().map((product, index) => {
                        const productId = product._id || product.id
                        const seller = product.sellerId as any
                        const sellerName = typeof seller === 'object' ? (seller?.fullName || seller?.email || 'N/A') : 'N/A'
                        const limit = productsPagination.limit ?? productsLimit
                        const rowNo = (productsPagination.page - 1) * limit + index + 1

                        return (
                          <tr key={productId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3">
                              <img
                                key={`product-img-${productId}`}
                                src={getFirstImageUrl(product)}
                                alt={product.title}
                                className="h-12 w-12 rounded-lg object-contain bg-muted"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium max-w-[180px]" title={product.title}>
                              <span className="line-clamp-2">{product.title}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-primary">${product.price?.toFixed(2) ?? '0.00'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{product.category || '—'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{sellerName}</td>
                            <td className="px-4 py-3">
                              <span className="capitalize">{product.status}</span>
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
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Showing{' '}
                      {productsPagination.total === 0
                        ? 0
                        : (productsPagination.page - 1) * (productsPagination.limit ?? productsLimit) + 1}
                      –{Math.min(
                        productsPagination.page * (productsPagination.limit ?? productsLimit),
                        productsPagination.total
                      )}{' '}
                      of {productsPagination.total} products
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Items per page:</span>
                      <Select
                        value={(productsPagination.limit ?? productsLimit).toString()}
                        onValueChange={(value) => {
                          const nextLimit = parseInt(value)
                          setProductsLimit(nextLimit)
                          fetchProducts(1, nextLimit)
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
                        value={`${productsSortBy}-${productsSortOrder}`}
                        onValueChange={(value) => {
                          const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                          setProductsSortBy(newSortBy)
                          setProductsSortOrder(newSortOrder)
                        }}
                      >
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt-desc">Date (Newest First)</SelectItem>
                          <SelectItem value="createdAt-asc">Date (Oldest First)</SelectItem>
                          <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                          <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                          <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                          <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                          <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                          <SelectItem value="category-desc">Category (Z-A)</SelectItem>
                          <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                          <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {productsPagination.pages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productsPagination.page <= 1}
                        onClick={() => fetchProducts(productsPagination.page - 1, productsPagination.limit ?? productsLimit)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-muted-foreground min-w-[120px] text-center">
                        Page {productsPagination.page} of {productsPagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productsPagination.page >= productsPagination.pages}
                        onClick={() => fetchProducts(productsPagination.page + 1, productsPagination.limit ?? productsLimit)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>View and manage all marketplace orders</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={ordersPagination.perPage?.toString() || '10'}
                    onValueChange={(value) => {
                      setOrdersPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                      <SelectItem value="customer-asc">Customer (A-Z)</SelectItem>
                      <SelectItem value="customer-desc">Customer (Z-A)</SelectItem>
                      <SelectItem value="orderId-asc">Order ID (A-Z)</SelectItem>
                      <SelectItem value="orderId-desc">Order ID (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                        <th className="px-4 py-3 text-left font-medium">Refund</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order, index) => {
                        const orderId = order._id || order.id
                        const user = order.userId as any
                        const isGuestOrder = !order.userId || (order as any).guestEmail
                        const userEmail = isGuestOrder 
                          ? `Guest${(order as any).guestEmail ? ` (${(order as any).guestEmail})` : ''}`
                          : (typeof user === 'object' ? (user?.email || 'N/A') : 'N/A')
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
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allOrders.length > 0 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Showing{' '}
                      {allOrders.length === 0 ? 0 : (ordersPagination.page - 1) * ordersPagination.perPage + 1}
                      –{Math.min(ordersPagination.page * ordersPagination.perPage, allOrders.length)} of{' '}
                      {allOrders.length} orders
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Items per page:</span>
                      <Select
                        value={ordersPagination.perPage?.toString() || '10'}
                        onValueChange={(value) => {
                          setOrdersPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                          <SelectItem value="customer-asc">Customer (A-Z)</SelectItem>
                          <SelectItem value="customer-desc">Customer (Z-A)</SelectItem>
                          <SelectItem value="orderId-asc">Order ID (A-Z)</SelectItem>
                          <SelectItem value="orderId-desc">Order ID (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {allOrders.length > ordersPagination.perPage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPagination.page <= 1}
                        onClick={() => setOrdersPagination((p) => ({ ...p, page: p.page - 1 }))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-muted-foreground min-w-[120px] text-center">
                        Page {ordersPagination.page} of {ordersTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPagination.page >= ordersTotalPages}
                        onClick={() => setOrdersPagination((p) => ({ ...p, page: p.page + 1 }))}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Review Moderation</CardTitle>
                  <CardDescription>Review and manage all product reviews</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={reviewsPagination.limit?.toString() || '10'}
                    onValueChange={(value) => {
                      const nextLimit = parseInt(value)
                      setReviewsPagination((p) => ({ ...p, limit: nextLimit, page: 1 }))
                      fetchReviews(1, nextLimit)
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
                    </SelectContent>
                  </Select>
                  <Select
                    value={`${adminReviewsSortBy}-${adminReviewsSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setAdminReviewsSortBy(newSortBy)
                      setAdminReviewsSortOrder(newSortOrder)
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
                      <SelectItem value="user-asc">User (A-Z)</SelectItem>
                      <SelectItem value="user-desc">User (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading reviews...</p>
              ) : allReviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews found</p>
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
                      {getSortedAdminReviews().map((review, index) => {
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
                              <span className="text-muted-foreground capitalize">
                                {review.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
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
              {allReviews.length > 0 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm mt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Showing {((reviewsPagination.page - 1) * reviewsPagination.limit) + 1}–
                      {Math.min(reviewsPagination.page * reviewsPagination.limit, reviewsPagination.total)} of{' '}
                      {reviewsPagination.total} reviews
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Items per page:</span>
                      <Select
                        value={reviewsPagination.limit?.toString() || '10'}
                        onValueChange={(value) => {
                          const nextLimit = parseInt(value)
                          setReviewsPagination((p) => ({ ...p, limit: nextLimit, page: 1 }))
                          fetchReviews(1, nextLimit)
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
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Sort by:</span>
                      <Select
                        value={`${adminReviewsSortBy}-${adminReviewsSortOrder}`}
                        onValueChange={(value) => {
                          const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                          setAdminReviewsSortBy(newSortBy)
                          setAdminReviewsSortOrder(newSortOrder)
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
                          <SelectItem value="user-asc">User (A-Z)</SelectItem>
                          <SelectItem value="user-desc">User (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {reviewsPagination.pages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reviewsPagination.page <= 1}
                        onClick={() => {
                          const newPage = Math.max(1, reviewsPagination.page - 1)
                          setReviewsPagination((p) => ({ ...p, page: newPage }))
                          fetchReviews(newPage, reviewsPagination.limit)
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
                          fetchReviews(newPage, reviewsPagination.limit)
                        }}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reports Management</CardTitle>
                  <CardDescription>Review and manage user reports for products, users, and reviews</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={reportsPagination.limit?.toString() || '10'}
                    onValueChange={(value) => {
                      const nextLimit = parseInt(value)
                      setReportsPagination((p) => ({ ...p, limit: nextLimit, page: 1 }))
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
                    </SelectContent>
                  </Select>
                  <Select
                    value={`${reportsSortBy}-${reportsSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setReportsSortBy(newSortBy)
                      setReportsSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                      <SelectItem value="type-asc">Type (A-Z)</SelectItem>
                      <SelectItem value="type-desc">Type (Z-A)</SelectItem>
                      <SelectItem value="reportId-asc">Report ID (A-Z)</SelectItem>
                      <SelectItem value="reportId-desc">Report ID (Z-A)</SelectItem>
                      <SelectItem value="content-asc">Content (A-Z)</SelectItem>
                      <SelectItem value="content-desc">Content (Z-A)</SelectItem>
                      <SelectItem value="description-asc">Description (A-Z)</SelectItem>
                      <SelectItem value="description-desc">Description (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={reportsStatusFilter} onValueChange={setReportsStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                        <th className="h-12 px-4 text-left font-medium">Status</th>
                        <th className="h-12 px-4 text-left font-medium">Description</th>
                        <th className="h-12 px-4 text-left font-medium">Reported Content</th>
                        <th className="h-12 px-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedAdminReports().map((report, index) => {
                        const reportId = report.id || report._id
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
                              <span className="text-muted-foreground capitalize">
                                {report.status}
                              </span>
                            </td>
                            <td className="h-16 px-4 align-middle">
                              <p className="max-w-[200px] truncate" title={report.description || 'No description'}>
                                {report.description || '—'}
                              </p>
                            </td>
                            <td className="h-16 px-4 align-middle">
                              <p className="max-w-[150px] truncate" title={contentSummary}>
                                {contentSummary}
                              </p>
                            </td>
                            <td className="h-16 px-4 align-middle text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    setReportDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    setEditingReportStatus(report.status)
                                    setEditingReportNotes(report.adminNotes || '')
                                    setEditReportDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allReports.length > 0 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm mt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Showing {((reportsPagination.page - 1) * reportsPagination.limit) + 1}–
                      {Math.min(reportsPagination.page * reportsPagination.limit, reportsPagination.total)} of{' '}
                      {reportsPagination.total} reports
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Items per page:</span>
                      <Select
                        value={reportsPagination.limit?.toString() || '10'}
                        onValueChange={(value) => {
                          const nextLimit = parseInt(value)
                          setReportsPagination((p) => ({ ...p, limit: nextLimit, page: 1 }))
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
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Sort by:</span>
                      <Select
                        value={`${reportsSortBy}-${reportsSortOrder}`}
                        onValueChange={(value) => {
                          const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                          setReportsSortBy(newSortBy)
                          setReportsSortOrder(newSortOrder)
                        }}
                      >
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                          <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                          <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                          <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                          <SelectItem value="type-asc">Type (A-Z)</SelectItem>
                          <SelectItem value="type-desc">Type (Z-A)</SelectItem>
                          <SelectItem value="reportId-asc">Report ID (A-Z)</SelectItem>
                          <SelectItem value="reportId-desc">Report ID (Z-A)</SelectItem>
                          <SelectItem value="content-asc">Content (A-Z)</SelectItem>
                          <SelectItem value="content-desc">Content (Z-A)</SelectItem>
                          <SelectItem value="description-asc">Description (A-Z)</SelectItem>
                          <SelectItem value="description-desc">Description (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Filter:</span>
                      <Select value={reportsStatusFilter} onValueChange={setReportsStatusFilter}>
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {reportsPagination.pages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reportsPagination.page <= 1}
                        onClick={() => setReportsPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-muted-foreground min-w-[120px] text-center">
                        Page {reportsPagination.page} of {reportsPagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reportsPagination.page >= reportsPagination.pages}
                        onClick={() => setReportsPagination((p) => ({ ...p, page: Math.min(reportsPagination.pages, p.page + 1) }))}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
                                  className="h-16 w-16 rounded object-contain bg-muted"
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

                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Report Dialog */}
          <Dialog open={editReportDialogOpen} onOpenChange={setEditReportDialogOpen}>
            <DialogContent className="max-w-lg">
              {selectedReport && (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      Edit Report #{selectedReport.id?.slice(-8) || selectedReport._id?.slice(-8)}
                    </DialogTitle>
                    <DialogDescription>
                      Update the status and add admin notes for this report
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={editingReportStatus}
                        onValueChange={(value) => setEditingReportStatus(value as 'pending' | 'resolved' | 'dismissed')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Admin Notes (Optional)</label>
                      <Textarea
                        placeholder="Add notes about this report..."
                        value={editingReportNotes}
                        onChange={(e) => setEditingReportNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditReportDialogOpen(false)
                        setEditingReportNotes('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        const reportId = selectedReport.id || selectedReport._id
                        setUpdatingReportId(reportId)
                        try {
                          const currentStatus = selectedReport.status
                          const newStatus = editingReportStatus

                          // Check if status or notes changed
                          const notesChanged = editingReportNotes.trim() !== (selectedReport.adminNotes || '')
                          
                          if (newStatus !== currentStatus || notesChanged) {
                            // Use the general update endpoint to change status to any value including pending
                            await reportService.updateReportStatus(reportId, {
                              status: newStatus,
                              adminNotes: editingReportNotes.trim() || undefined
                            })
                            
                            toast({
                              title: 'Report Updated',
                              description: newStatus !== currentStatus 
                                ? `The report status has been updated to ${newStatus}.`
                                : 'Admin notes have been updated.',
                              variant: 'default',
                            })
                          } else {
                            // No changes made
                            toast({
                              title: 'No Changes',
                              description: 'No changes were made to the report.',
                              variant: 'default',
                            })
                            setUpdatingReportId(null)
                            setEditReportDialogOpen(false)
                            return
                          }

                          await fetchReports(reportsPagination.page, reportsStatusFilter, reportsPagination.limit)
                          await fetchPendingReportsCount()
                          setEditReportDialogOpen(false)
                          setEditingReportNotes('')
                        } catch (error: any) {
                          const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update report'
                          toast({
                            title: 'Update Failed',
                            description: errorMessage,
                            variant: 'destructive',
                          })
                        } finally {
                          setUpdatingReportId(null)
                        }
                      }}
                      disabled={updatingReportId === (selectedReport.id || selectedReport._id)}
                    >
                      {updatingReportId === (selectedReport.id || selectedReport._id) ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Refund Requests</CardTitle>
                  <CardDescription>View and manage all refund requests from customers</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={refundStatusFilter}
                    onValueChange={(value) => {
                      setRefundStatusFilter(value)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRefundRequests}
                    disabled={refundRequestsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refundRequestsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {refundRequestsLoading ? (
                <p className="text-muted-foreground">Loading refund requests...</p>
              ) : allRefundRequests.length === 0 ? (
                <p className="text-muted-foreground">No refund requests found</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Order ID</th>
                        <th className="px-4 py-3 text-left font-medium">Customer</th>
                        <th className="px-4 py-3 text-left font-medium">Reason</th>
                        <th className="px-4 py-3 text-left font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Requested</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRefundRequests
                        .filter((req) => refundStatusFilter === 'all' || req.status === refundStatusFilter)
                        .map((refundRequest) => {
                          const order = refundRequest.orderId as any
                          const orderId = typeof order === 'object' ? (order?.id || order?._id) : order
                          const userId = refundRequest.userId as any
                          const customerName = typeof userId === 'object' 
                            ? (userId?.fullName || userId?.email || 'N/A')
                            : refundRequest.guestEmail || 'Guest'
                          const customerEmail = typeof userId === 'object' 
                            ? userId?.email 
                            : refundRequest.guestEmail || 'N/A'

                          return (
                            <tr key={refundRequest.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3">
                                <Button
                                  variant="link"
                                  className="h-auto p-0 font-mono text-xs"
                                  onClick={() => navigate(`/order/${orderId}`)}
                                >
                                  {String(orderId).slice(-8)}
                                </Button>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{customerName}</p>
                                  <p className="text-xs text-muted-foreground">{customerEmail}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="capitalize">{refundRequest.reason.replace('_', ' ')}</p>
                                  {refundRequest.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={refundRequest.description}>
                                      {refundRequest.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium">
                                ${refundRequest.refundAmount?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-4 py-3">
                                <Badge 
                                  variant={
                                    refundRequest.status === 'pending' ? 'secondary' :
                                    refundRequest.status === 'approved' ? 'default' :
                                    refundRequest.status === 'rejected' ? 'destructive' :
                                    'outline'
                                  }
                                  className="capitalize"
                                >
                                  {refundRequest.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {new Date(refundRequest.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRefundRequest(refundRequest)
                                      setRefundStatusUpdate({ 
                                        status: refundRequest.status as 'pending' | 'approved' | 'rejected',
                                        adminNotes: refundRequest.adminNotes || ''
                                      })
                                      setRefundDialogOpen(true)
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View/Update
                                  </Button>
                                  {refundRequest.status === 'approved' && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleProcessRefund(refundRequest.id)}
                                      disabled={processingRefundId === refundRequest.id}
                                    >
                                      {processingRefundId === refundRequest.id ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <DollarSign className="h-4 w-4 mr-1" />
                                          Process Refund
                                        </>
                                      )}
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
            </CardContent>
          </Card>

          {/* Refund Status Update Dialog */}
          <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Refund Request Details</DialogTitle>
                <DialogDescription>
                  Review and update refund request status
                </DialogDescription>
              </DialogHeader>
              {selectedRefundRequest && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Order ID</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {(selectedRefundRequest.orderId as any)?.id || (selectedRefundRequest.orderId as any)?._id || selectedRefundRequest.orderId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Refund Amount</p>
                      <p className="text-sm font-bold">${selectedRefundRequest.refundAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Customer</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRefundRequest.userId && typeof selectedRefundRequest.userId === 'object' 
                          ? `${(selectedRefundRequest.userId as any)?.fullName || 'N/A'} (${(selectedRefundRequest.userId as any)?.email || 'N/A'})`
                          : selectedRefundRequest.guestEmail || 'Guest'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Requested Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedRefundRequest.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium mb-1">Reason</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedRefundRequest.reason.replace('_', ' ')}
                      </p>
                    </div>
                    {selectedRefundRequest.description && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium mb-1">Description</p>
                        <p className="text-sm text-muted-foreground">{selectedRefundRequest.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <Label htmlFor="refund-status">Status</Label>
                      <Select
                        value={refundStatusUpdate.status}
                        onValueChange={(value) => setRefundStatusUpdate({ ...refundStatusUpdate, status: value as 'pending' | 'approved' | 'rejected' })}
                      >
                        <SelectTrigger id="refund-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                      <Textarea
                        id="admin-notes"
                        value={refundStatusUpdate.adminNotes || ''}
                        onChange={(e) => setRefundStatusUpdate({ ...refundStatusUpdate, adminNotes: e.target.value })}
                        placeholder="Add notes about this refund request..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setRefundDialogOpen(false)} disabled={updatingRefundStatus}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRefundStatus} disabled={updatingRefundStatus}>
                  {updatingRefundStatus ? 'Updating...' : 'Update Status'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          {/* Commission Rate Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commission Rate Settings</CardTitle>
                  <CardDescription>Manage the marketplace commission rate applied to seller payouts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {marketplaceSettingsLoading ? (
                <p className="text-muted-foreground">Loading settings...</p>
              ) : marketplaceSettings ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">
                        Commission Rate (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commissionRateInput}
                          onChange={(e) => setCommissionRateInput(e.target.value)}
                          className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="10"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current rate: {marketplaceSettings.commissionRatePercent}% (sellers receive {100 - marketplaceSettings.commissionRatePercent}% of their sales)
                      </p>
                      {marketplaceSettings.updatedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last updated: {new Date(marketplaceSettings.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleUpdateMarketplaceSettings}
                      disabled={updatingMarketplaceSettings || marketplaceSettingsLoading}
                      className="mt-6"
                    >
                      {updatingMarketplaceSettings ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Failed to load settings</p>
              )}
            </CardContent>
          </Card>

          {/* Payouts List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payout Management</CardTitle>
                  <CardDescription>Review and process seller payout requests</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={payoutsPagination.limit?.toString() || '20'}
                    onValueChange={(value) => {
                      setPayoutsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
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
                    value={`${payoutsSortBy}-${payoutsSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setPayoutsSortBy(newSortBy)
                      setPayoutsSortOrder(newSortOrder)
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
                      <SelectItem value="commission-desc">Commission (High to Low)</SelectItem>
                      <SelectItem value="commission-asc">Commission (Low to High)</SelectItem>
                      <SelectItem value="netAmount-desc">Net Amount (High to Low)</SelectItem>
                      <SelectItem value="netAmount-asc">Net Amount (Low to High)</SelectItem>
                      <SelectItem value="orders-desc">Orders (High to Low)</SelectItem>
                      <SelectItem value="orders-asc">Orders (Low to High)</SelectItem>
                      <SelectItem value="seller-asc">Seller (A-Z)</SelectItem>
                      <SelectItem value="seller-desc">Seller (Z-A)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
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
                          <th className="h-10 px-4 text-left font-medium w-12"></th>
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
                        {getSortedPayouts().map((payout) => {
                          const seller = (payout as any).sellerId
                          const sellerName = seller?.fullName || seller?.email || 'Unknown'
                          const isExpanded = expandedPayoutRows.has(payout.id)
                          const toggleExpand = () => {
                            const newExpanded = new Set(expandedPayoutRows)
                            if (isExpanded) {
                              newExpanded.delete(payout.id)
                            } else {
                              newExpanded.add(payout.id)
                              // Fetch order details if not already loaded
                              if (!payoutOrdersMap[payout.id] && !payoutOrdersLoadingMap[payout.id]) {
                                setPayoutOrdersLoadingMap(prev => ({ ...prev, [payout.id]: true }))
                                const fetchOrderDetails = async () => {
                                  try {
                                    const payoutDetails = await payoutService.getPayoutById(payout.id)
                                    if (payoutDetails.orders && Array.isArray(payoutDetails.orders)) {
                                      const processedOrders = payoutDetails.orders.map((order: any) => {
                                        const orderId = order._id || order.id || ''
                                        const items = order.items || []
                                        const sellerRevenue = order.totalAmount || items.reduce((sum: number, item: any) => {
                                          return sum + (item.price * item.quantity)
                                        }, 0)

                                        return {
                                          id: orderId,
                                          orderNumber: orderId.slice(-8),
                                          createdAt: order.createdAt,
                                          status: order.status,
                                          sellerRevenue
                                        }
                                      })
                                      setPayoutOrdersMap(prev => ({ ...prev, [payout.id]: processedOrders }))
                                    } else {
                                      setPayoutOrdersMap(prev => ({ ...prev, [payout.id]: [] }))
                                    }
                                  } catch (error) {
                                    console.error('Error fetching payout order details:', error)
                                    setPayoutOrdersMap(prev => ({ ...prev, [payout.id]: [] }))
                                  } finally {
                                    setPayoutOrdersLoadingMap(prev => ({ ...prev, [payout.id]: false }))
                                  }
                                }
                                fetchOrderDetails()
                              }
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
                                    onClick={(e) => {
                                      e.stopPropagation()
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
                              {isExpanded && (
                                <tr key={`${payout.id}-details`}>
                                  <td colSpan={9} className="px-4 py-4 bg-muted/30">
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-sm mb-3">Order Details</h4>
                                      {payoutOrdersLoadingMap[payout.id] ? (
                                        <div className="text-center py-4">
                                          <p className="text-sm text-muted-foreground">Loading order details...</p>
                                        </div>
                                      ) : payoutOrdersMap[payout.id] && payoutOrdersMap[payout.id].length > 0 ? (
                                        <div className="space-y-2">
                                          {payoutOrdersMap[payout.id].map((order) => (
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
                                        <div className="text-center py-4">
                                          <p className="text-sm text-muted-foreground">No order details available</p>
                                        </div>
                                      )}
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
                  <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Showing {((payoutsPagination.page - 1) * payoutsPagination.limit) + 1}–
                        {Math.min(payoutsPagination.page * payoutsPagination.limit, payoutsPagination.total)} of{' '}
                        {payoutsPagination.total} payouts
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Items per page:</span>
                        <Select
                          value={payoutsPagination.limit?.toString() || '20'}
                          onValueChange={(value) => {
                            setPayoutsPagination((p) => ({ ...p, limit: parseInt(value), page: 1 }))
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
                          value={`${payoutsSortBy}-${payoutsSortOrder}`}
                          onValueChange={(value) => {
                            const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                            setPayoutsSortBy(newSortBy)
                            setPayoutsSortOrder(newSortOrder)
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
                            <SelectItem value="commission-desc">Commission (High to Low)</SelectItem>
                            <SelectItem value="commission-asc">Commission (Low to High)</SelectItem>
                            <SelectItem value="netAmount-desc">Net Amount (High to Low)</SelectItem>
                            <SelectItem value="netAmount-asc">Net Amount (Low to High)</SelectItem>
                            <SelectItem value="orders-desc">Orders (High to Low)</SelectItem>
                            <SelectItem value="orders-asc">Orders (Low to High)</SelectItem>
                            <SelectItem value="seller-asc">Seller (A-Z)</SelectItem>
                            <SelectItem value="seller-desc">Seller (Z-A)</SelectItem>
                            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                            <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {payoutsPagination.pages > 1 && (
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
                    )}
                  </div>
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
                  <div>
                    <p className="text-sm font-medium mb-3">Order Details</p>
                    {payoutOrderDetailsLoading ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Loading order details...</p>
                      </div>
                    ) : payoutOrderDetails.length > 0 ? (
                      <div className="space-y-2">
                        {payoutOrderDetails.map((order) => (
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
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No order details available</p>
                      </div>
                    )}
                  </div>
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

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Category Management</CardTitle>
                  <CardDescription>Create, edit, and manage product categories</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={categoriesPagination.perPage?.toString() || '10'}
                    onValueChange={(value) => {
                      setCategoriesPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                    value={`${categoriesSortBy}-${categoriesSortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                      setCategoriesSortBy(newSortBy)
                      setCategoriesSortOrder(newSortOrder)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="slug-asc">Slug (A-Z)</SelectItem>
                      <SelectItem value="slug-desc">Slug (Z-A)</SelectItem>
                      <SelectItem value="products-desc">Products (High to Low)</SelectItem>
                      <SelectItem value="products-asc">Products (Low to High)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setNewCategory({ name: '', slug: '', description: '' })
                      setCreateCategoryDialogOpen(true)
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Category
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <p className="text-muted-foreground">Loading categories...</p>
              ) : allCategories.length === 0 ? (
                <p className="text-muted-foreground">No categories yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium w-12">No.</th>
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-left font-medium">Products</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCategories.map((category, index) => {
                        const categoryId = category._id || category.id
                        const rowNo = (categoriesPagination.page - 1) * categoriesPagination.perPage + index + 1
                        return (
                          <tr key={categoryId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{rowNo}</td>
                            <td className="px-4 py-3 font-medium">{category.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {category.description || '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {category.productCount || 0}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-muted-foreground">
                                {category.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category)}
                                  disabled={category.productCount > 0}
                                  title={category.productCount > 0 ? 'Cannot delete category with products' : ''}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Showing{' '}
                        {allCategories.length === 0
                          ? 0
                          : (categoriesPagination.page - 1) * categoriesPagination.perPage + 1}
                        –{Math.min(categoriesPagination.page * categoriesPagination.perPage, allCategories.length)} of{' '}
                        {allCategories.length} categories
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Items per page:</span>
                        <Select
                          value={categoriesPagination.perPage?.toString() || '10'}
                          onValueChange={(value) => {
                            setCategoriesPagination((p) => ({ ...p, perPage: parseInt(value), page: 1 }))
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
                          value={`${categoriesSortBy}-${categoriesSortOrder}`}
                          onValueChange={(value) => {
                            const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                            setCategoriesSortBy(newSortBy)
                            setCategoriesSortOrder(newSortOrder)
                          }}
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            <SelectItem value="slug-asc">Slug (A-Z)</SelectItem>
                            <SelectItem value="slug-desc">Slug (Z-A)</SelectItem>
                            <SelectItem value="products-desc">Products (High to Low)</SelectItem>
                            <SelectItem value="products-asc">Products (Low to High)</SelectItem>
                            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                            <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {categoriesTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={categoriesPagination.page <= 1}
                          onClick={() => setCategoriesPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-muted-foreground min-w-[120px] text-center">
                          Page {categoriesPagination.page} of {categoriesTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={categoriesPagination.page >= categoriesTotalPages}
                          onClick={() => setCategoriesPagination((p) => ({ ...p, page: Math.min(categoriesTotalPages, p.page + 1) }))}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Category Dialog */}
          <Dialog open={createCategoryDialogOpen} onOpenChange={setCreateCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new product category to the marketplace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setNewCategory({
                        ...newCategory,
                        name,
                        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                      })
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Slug *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="category-slug"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL-friendly identifier (auto-generated from name)
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="Category description..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateCategoryDialogOpen(false)
                    setNewCategory({ name: '', slug: '', description: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategory.name || !newCategory.slug}
                >
                  {creatingCategory ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Category Dialog */}
          <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update category information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Category Name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Slug *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="category-slug"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="Category description..."
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select
                    value={editingCategory.isActive ? 'active' : 'inactive'}
                    onValueChange={(value) => setEditingCategory({ ...editingCategory, isActive: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditCategoryDialogOpen(false)
                    setEditingCategoryId(null)
                    setEditingCategory({ name: '', slug: '', description: '', isActive: true })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCategory}
                  disabled={updatingCategory || !editingCategory.name || !editingCategory.slug}
                >
                  {updatingCategory ? 'Updating...' : 'Update Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Category Dialog */}
          <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                <AlertDialogDescription>
                  {categoryToDelete && `Are you sure you want to delete category "${categoryToDelete.name}"? This action cannot be undone. Categories with products cannot be deleted.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCategoryConfirm}
                  disabled={deletingCategory}
                >
                  {deletingCategory ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4" style={{ display: 'none' }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Database Backup</CardTitle>
                  <CardDescription>Create and manage database backups</CardDescription>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      setCreatingBackup(true)
                      const result = await backupService.createBackup()
                      toast({
                        title: 'Backup Created',
                        description: `Backup created successfully: ${result.backup.filename}`,
                        variant: 'default',
                      })
                      fetchBackups()
                    } catch (error: any) {
                      toast({
                        title: 'Backup Failed',
                        description: error?.response?.data?.error || 'Failed to create backup',
                        variant: 'destructive',
                      })
                    } finally {
                      setCreatingBackup(false)
                    }
                  }}
                  disabled={creatingBackup}
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  {creatingBackup ? 'Creating...' : 'Create Backup'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {backupsLoading ? (
                <p className="text-muted-foreground">Loading backups...</p>
              ) : backups.length === 0 ? (
                <p className="text-muted-foreground">No backups found. Create your first backup to get started.</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium">Filename</th>
                          <th className="px-4 py-3 text-left font-medium">Size</th>
                          <th className="px-4 py-3 text-left font-medium">Created</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map((backup) => (
                          <tr key={backup.filename} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 font-medium">{backup.filename}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {(backup.size / 1024 / 1024).toFixed(2)} MB
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(backup.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await backupService.downloadBackup(backup.filename)
                                      toast({
                                        title: 'Download Started',
                                        description: 'Backup download has started',
                                        variant: 'default',
                                      })
                                    } catch (error: any) {
                                      toast({
                                        title: 'Download Failed',
                                        description: error?.response?.data?.error || 'Failed to download backup',
                                        variant: 'destructive',
                                      })
                                    }
                                  }}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeletingBackupFilename(backup.filename)
                                  }}
                                  disabled={deletingBackupFilename === backup.filename}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Backup Dialog */}
          <AlertDialog 
            open={deletingBackupFilename !== null} 
            onOpenChange={(open) => !open && setDeletingBackupFilename(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                <AlertDialogDescription>
                  {deletingBackupFilename && `Are you sure you want to delete backup "${deletingBackupFilename}"? This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingBackupFilename(null)}>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deletingBackupFilename) {
                      try {
                        await backupService.deleteBackup(deletingBackupFilename)
                        toast({
                          title: 'Backup Deleted',
                          description: 'Backup has been deleted successfully',
                          variant: 'default',
                        })
                        setDeletingBackupFilename(null)
                        fetchBackups()
                      } catch (error: any) {
                        toast({
                          title: 'Delete Failed',
                          description: error?.response?.data?.error || 'Failed to delete backup',
                          variant: 'destructive',
                        })
                      }
                    }
                  }}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="home" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Home Page Settings</CardTitle>
                </div>
                <Button
                  onClick={handleUpdateHomeSettings}
                  disabled={updatingHomeSettings || homeSettingsLoading}
                  className="gap-2"
                >
                  {updatingHomeSettings ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {homeSettingsLoading ? (
                <p className="text-muted-foreground">Loading home settings...</p>
              ) : !homeSettings ? (
                <p className="text-muted-foreground">No settings available</p>
              ) : (
                <div className="space-y-6">
                  {/* Featured Categories Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Featured Categories (Max 6)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {homeSettings.allCategories.map((category) => {
                        const categoryId = category._id || category.id || ''
                        const isSelected = selectedFeaturedCategories.includes(categoryId)
                        return (
                          <div
                            key={categoryId}
                            className={`border rounded-md p-2 cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            } ${!category.isActive ? 'opacity-50' : ''}`}
                            onClick={() => {
                              if (!category.isActive) return
                              if (isSelected) {
                                setSelectedFeaturedCategories(prev => prev.filter(id => id !== categoryId))
                              } else {
                                if (selectedFeaturedCategories.length < 6) {
                                  setSelectedFeaturedCategories(prev => [...prev, categoryId])
                                } else {
                                  toast({
                                    title: 'Limit Reached',
                                    description: 'You can only select up to 6 categories',
                                    variant: 'destructive',
                                  })
                                }
                              }
                            }}
                          >
                            <div className="flex items-start gap-1.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                disabled={!category.isActive}
                                className="mt-0.5 w-3 h-3"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-xs font-medium truncate">{category.name}</span>
                                  {!category.isActive && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Inactive</Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {category.productCount || 0} {category.productCount === 1 ? 'product' : 'products'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Featured Products Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Featured Products (Max 12)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
                      {homeSettings.allProducts.map((product) => {
                        const productId = product._id || product.id || ''
                        const isSelected = selectedFeaturedProducts.includes(productId)
                        const imageUrl = getFirstImageUrl(product)
                        return (
                          <div
                            key={productId}
                            className={`border rounded-md p-2 cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedFeaturedProducts(prev => prev.filter(id => id !== productId))
                              } else {
                                if (selectedFeaturedProducts.length < 12) {
                                  setSelectedFeaturedProducts(prev => [...prev, productId])
                                } else {
                                  toast({
                                    title: 'Limit Reached',
                                    description: 'You can only select up to 12 products',
                                    variant: 'destructive',
                                  })
                                }
                              }
                            }}
                          >
                            <div className="flex flex-col gap-1.5">
                              {imageUrl && (
                                <img
                                  src={imageUrl}
                                  alt={product.title}
                                  className="w-full h-20 object-contain rounded border bg-muted"
                                />
                              )}
                              <div className="flex items-start gap-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="mt-0.5 w-3 h-3 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium line-clamp-1 block truncate" title={product.title}>{product.title}</span>
                                  <p className="text-xs font-semibold text-primary mt-0.5">${product.price}</p>
                                  {product.category && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{product.category}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreatingSeller ? 'Create New Seller' : 'Create New Buyer'}</DialogTitle>
            <DialogDescription>
              Create a new {isCreatingSeller ? 'seller' : newUser.role === 'seller' ? 'seller' : 'buyer'} account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Password *</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Minimum 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="John Doe"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              />
            </div>

            {(isCreatingSeller || newUser.role === 'seller') && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Business Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="My Business"
                    value={newUser.businessName}
                    onChange={(e) => setNewUser({ ...newUser, businessName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Business Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="Describe your business..."
                    value={newUser.businessDescription}
                    onChange={(e) => setNewUser({ ...newUser, businessDescription: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateUserDialogOpen(false)
                setIsCreatingSeller(false)
                setNewUser({
                  email: '',
                  password: '',
                  fullName: '',
                  role: 'customer',
                  businessName: '',
                  businessDescription: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creatingUser || !newUser.email || !newUser.password || ((isCreatingSeller || newUser.role === 'seller') && !newUser.businessName)}
            >
              {creatingUser ? (isCreatingSeller ? 'Creating Seller...' : 'Creating...') : (isCreatingSeller ? 'Create Seller' : 'Create Buyer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Seller Dialog */}
      <Dialog open={editSellerDialogOpen} onOpenChange={setEditSellerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Seller</DialogTitle>
            <DialogDescription>
              Update seller profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Seller's full name"
                value={editingSeller.fullName}
                onChange={(e) => setEditingSeller({ ...editingSeller, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="seller@example.com"
                value={editingSeller.email}
                onChange={(e) => setEditingSeller({ ...editingSeller, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Business Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="My Business"
                value={editingSeller.businessName}
                onChange={(e) => setEditingSeller({ ...editingSeller, businessName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Business Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                placeholder="Describe the business..."
                value={editingSeller.businessDescription}
                onChange={(e) => setEditingSeller({ ...editingSeller, businessDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={editingSeller.status}
                onValueChange={(value: 'pending' | 'approved' | 'rejected') => {
                  setEditingSeller({ ...editingSeller, status: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditSellerDialogOpen(false)
                setEditingSellerId(null)
                setEditingSeller({
                  businessName: '',
                  businessDescription: '',
                  status: 'pending',
                  userId: '',
                  email: '',
                  fullName: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSeller}
              disabled={updatingSeller || !editingSeller.businessName || !editingSeller.email}
            >
              {updatingSeller ? 'Updating...' : 'Update Seller'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Buyer Dialog */}
      <Dialog open={editBuyerDialogOpen} onOpenChange={setEditBuyerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Buyer</DialogTitle>
            <DialogDescription>
              Update buyer profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="John Doe"
                value={editingBuyer.fullName}
                onChange={(e) => setEditingBuyer({ ...editingBuyer, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="buyer@example.com"
                value={editingBuyer.email}
                onChange={(e) => setEditingBuyer({ ...editingBuyer, email: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditBuyerDialogOpen(false)
                setEditingBuyerId(null)
                setEditingBuyer({
                  fullName: '',
                  email: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBuyer}
              disabled={updatingBuyer || !editingBuyer.email}
            >
              {updatingBuyer ? 'Updating...' : 'Update Buyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Seller Dialog */}
      <AlertDialog open={deleteSellerDialogOpen} onOpenChange={setDeleteSellerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Seller</AlertDialogTitle>
            <AlertDialogDescription>
              {sellerToDelete && `Are you sure you want to delete seller "${sellerToDelete.name}"? This will remove the seller profile and revert the user to customer role. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteSellerConfirm}
              disabled={deletingSeller}
            >
              {deletingSeller ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
