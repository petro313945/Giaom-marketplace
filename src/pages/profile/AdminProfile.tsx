import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
import { Users, ShoppingBag, Store, AlertCircle, Trash2, Edit, Package, DollarSign, TrendingUp, ArrowRight, ShoppingCart, Clock, Star, Eye, Wallet, CheckCircle, XCircle, ChevronLeft, ChevronRight, Plus, BarChart3, Key, Tags, Home } from 'lucide-react'
import * as userService from '../../services/userService'
import * as sellerService from '../../services/sellerService'
import * as productService from '../../services/productService'
import * as orderService from '../../services/orderService'
import * as reviewService from '../../services/reviewService'
import * as reportService from '../../services/reportService'
import * as payoutService from '../../services/payoutService'
import * as categoryService from '../../services/categoryService'
import * as homeSettingsService from '../../services/homeSettingsService'
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
  const validTabs = ['sellers', 'buyers', 'products', 'orders', 'reviews', 'reports', 'payouts', 'categories', 'home']
  
  // Get active tab from URL or use default
  const urlTab = searchParams.get('tab')
  const activeTab = (urlTab && validTabs.includes(urlTab)) 
    ? urlTab 
    : 'sellers'
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSellers, setAllSellers] = useState<any[]>([])
  const [sellersPagination, setSellersPagination] = useState({ page: 1, perPage: 10 })
  const [buyersPagination, setBuyersPagination] = useState({ page: 1, perPage: 10 })
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, perPage: 10 })
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [productStats, setProductStats] = useState({ total: 0, pending: 0 })
  const [productsSortBy, setProductsSortBy] = useState<string>('createdAt')
  const [productsSortOrder, setProductsSortOrder] = useState<'asc' | 'desc'>('desc')
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
  const [editReportDialogOpen, setEditReportDialogOpen] = useState(false)
  const [editingReportStatus, setEditingReportStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending')
  const [editingReportNotes, setEditingReportNotes] = useState<string>('')
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null)
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
  const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false)
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

  const fetchProducts = async (page = 1) => {
    const response = await productService.getAllProducts({ page, limit: 10 })
    setAllProducts(response.products)
    setProductsPagination(response.pagination)
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
    if (activeTab === 'home') {
      fetchHomeSettings()
    }
  }, [activeTab])

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

  const pendingSellers = allSellers.filter((s) => s.status === 'pending')
  const activeSellers = allSellers.filter((s) => s.status === 'approved').length

  // Separate buyers (customers) and sellers from all users
  const allBuyers = allUsers.filter((u) => u.role === 'customer')
  const allSellersFromUsers = allUsers.filter((u) => u.role === 'seller')

  const sellersTotalPages = Math.ceil(allSellers.length / sellersPagination.perPage) || 1
  const paginatedSellers = allSellers.slice(
    (sellersPagination.page - 1) * sellersPagination.perPage,
    sellersPagination.page * sellersPagination.perPage
  )

  const buyersTotalPages = Math.ceil(allBuyers.length / buyersPagination.perPage) || 1
  const paginatedBuyers = allBuyers.slice(
    (buyersPagination.page - 1) * buyersPagination.perPage,
    buyersPagination.page * buyersPagination.perPage
  )

  const ordersTotalPages = Math.ceil(allOrders.length / ordersPagination.perPage) || 1
  const paginatedOrders = allOrders.slice(
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
          <Button
            variant="default"
            size="sm"
            onClick={() => setStatisticsDialogOpen(true)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            View Statistic
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-6">
        <TabsList>
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
        </TabsList>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Sellers</CardTitle>
                  <CardDescription>View and manage all sellers - review and approve seller applications</CardDescription>
                </div>
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

        <TabsContent value="buyers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Buyers</CardTitle>
                  <CardDescription>View and manage all customer accounts (buyers)</CardDescription>
                </div>
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
              {allBuyers.length > 0 && allBuyers.length > buyersPagination.perPage && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={buyersPagination.page <= 1}
                    onClick={() => setBuyersPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {buyersPagination.page} of {buyersTotalPages} ({allBuyers.length} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={buyersPagination.page >= buyersTotalPages}
                    onClick={() => setBuyersPagination((p) => ({ ...p, page: p.page + 1 }))}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Approvals</CardTitle>
                  <CardDescription>Review and approve product listings</CardDescription>
                </div>
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
                        const rowNo = (productsPagination.page - 1) * 10 + index + 1

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

        <TabsContent value="orders" className="space-y-4">
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
                        <th className="h-12 px-4 text-left font-medium">Status</th>
                        <th className="h-12 px-4 text-left font-medium">Description</th>
                        <th className="h-12 px-4 text-left font-medium">Reported Content</th>
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

                          await fetchReports(reportsPagination.page)
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

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Category Management</CardTitle>
                  <CardDescription>Create, edit, and manage product categories</CardDescription>
                </div>
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
                      {allCategories.map((category, index) => {
                        const categoryId = category._id || category.id
                        return (
                          <tr key={categoryId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                            <td className="px-4 py-3 font-medium">{category.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {category.description || '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {category.productCount || 0}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={category.isActive ? 'default' : 'secondary'}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </Badge>
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

      {/* Statistics Dialog */}
      <Dialog open={statisticsDialogOpen} onOpenChange={setStatisticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Admin Statistics
            </DialogTitle>
            <DialogDescription>
              Overview of platform performance and key metrics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
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

            {/* Revenue and Order Stats */}
            {orderStats && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Order Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="font-bold">${orderStats.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Orders</span>
                      <span className="font-bold">{orderStats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pending Orders</span>
                      <span className="font-bold text-orange-600">{orderStats.pendingOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Delivered Orders</span>
                      <span className="font-bold text-green-600">{orderStats.deliveredOrders}</span>
                    </div>
                  </CardContent>
                </Card>

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
                      <span className="font-bold text-orange-600">{productStats.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Approved</span>
                      <span className="font-bold text-green-600">
                        {allProducts.filter((p) => p.status === 'approved').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rejected</span>
                      <span className="font-bold text-red-600">
                        {allProducts.filter((p) => p.status === 'rejected').length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* User Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">User Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {allUsers.filter((u) => u.role === 'customer').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Buyers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {allUsers.filter((u) => u.role === 'seller').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Sellers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
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
                      <div className="text-2xl font-bold text-green-600">
                        {allSellers.filter((s) => s.status === 'approved').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {allSellers.filter((s) => s.status === 'pending').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
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
                  <div className="text-2xl font-bold">{allReviews.length}</div>
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
                      <span className="text-orange-600">{pendingReportsCount} pending</span>
                    )}
                    {pendingReportsCount === 0 && 'All resolved'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payout Statistics */}
            {payoutStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Payout Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Payouts</span>
                    <span className="font-bold">{payoutStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="font-bold text-orange-600">{payoutStats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-bold text-green-600">{payoutStats.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Failed</span>
                    <span className="font-bold text-red-600">{payoutStats.failed}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
