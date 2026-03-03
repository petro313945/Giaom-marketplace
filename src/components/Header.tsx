import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, User, Menu, Heart, LogOut, Package, MapPin, ShoppingBag, TrendingUp, DollarSign, CheckCircle2, Store, ShoppingCart, Star, AlertCircle, Wallet, Tags, Home, Bell, RotateCcw, BarChart3 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { useToast } from './ui/use-toast'
import { useAuth } from '../context/AuthContext'
import CartDrawer from './CartDrawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import * as categoryService from '../services/categoryService'
import * as wishlistService from '../services/wishlistService'
import * as homeSettingsService from '../services/homeSettingsService'
import * as productService from '../services/productService'
import type { Product } from '../services/productService'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<categoryService.Category[]>([])
  const [allCategories, setAllCategories] = useState<categoryService.Category[]>([])
  const [headerCategories, setHeaderCategories] = useState<categoryService.Category[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [dealsCount, setDealsCount] = useState(0)
  const { isAuthenticated, user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories()
        // Get first 4 categories for mobile menu
        setCategories(response.categories.slice(0, 4))
        // Get all categories for dropdown menu
        setAllCategories(response.categories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        const response = await homeSettingsService.getHomeSettings()
        // Use featured categories, limit to max 6
        setHeaderCategories(response.featuredCategories.slice(0, 6))
      } catch (error) {
        console.error('Failed to fetch featured categories:', error)
        // Fallback to empty array if API fails
        setHeaderCategories([])
      }
    }
    fetchFeaturedCategories()
  }, [])

  useEffect(() => {
    const fetchWishlistCount = async () => {
      if (!isAuthenticated || user?.role !== 'customer') {
        setWishlistCount(0)
        return
      }

      try {
        const response = await wishlistService.getWishlist()
        setWishlistCount(response.wishlist.items.length)
      } catch (error) {
        console.error('Failed to fetch wishlist count:', error)
      }
    }

    fetchWishlistCount()
    
    // Listen for wishlist changes from other components
    const handleWishlistChange = () => {
      fetchWishlistCount()
    }
    
    window.addEventListener('wishlistChanged', handleWishlistChange)
    
    // Refresh count when user changes
    const interval = setInterval(fetchWishlistCount, 30000) // Refresh every 30 seconds as fallback
    return () => {
      clearInterval(interval)
      window.removeEventListener('wishlistChanged', handleWishlistChange)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    const fetchDealsCount = async () => {
      try {
        // Fetch products in batches (max limit is 100 per backend validation)
        const maxLimit = 100
        let allDealsProducts: Product[] = []
        let currentPage = 1
        let hasMore = true

        // Fetch all products with bulk discounts by making multiple requests
        while (hasMore) {
          const response = await productService.getProducts({ 
            page: currentPage,
            limit: maxLimit
          })
          
          // Filter products that have bulkDiscountTiers
          const dealsProducts = response.products.filter(
            (product) => product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0
          )
          
          allDealsProducts = [...allDealsProducts, ...dealsProducts]
          
          // Check if there are more pages
          hasMore = response.products.length === maxLimit && currentPage < response.pagination.pages
          currentPage++
          
          // Safety limit to prevent infinite loops
          if (currentPage > 50) break
        }
        
        setDealsCount(allDealsProducts.length)
      } catch (error) {
        console.error('Failed to fetch deals count:', error)
      }
    }

    fetchDealsCount()
    // Refresh deals count periodically
    const interval = setInterval(fetchDealsCount, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    toast({
      title: 'Logged Out Successfully',
      description: 'You have been logged out. Thank you for using Giaom Marketplace!',
      variant: 'default',
    })
    // Navigate after a short delay to show the toast
    setTimeout(() => {
      navigate('/auth/login')
    }, 500)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?search=${encodeURIComponent(searchQuery)}`)
    } else {
      navigate('/search')
    }
  }

  return (
    <>
      {/* Overlay for category menu */}
      {isCategoryMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCategoryMenuOpen(false)}
        />
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/">
              <h1 className="text-2xl font-bold cursor-pointer text-foreground">Giaom</h1>
            </Link>
            <DropdownMenu open={isCategoryMenuOpen} onOpenChange={setIsCategoryMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="header-button flex items-center gap-2"
                  aria-haspopup="true"
                  aria-expanded={isCategoryMenuOpen}
                >
                  <Menu className="h-5 w-5" />
                  <span>Categories</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56 max-h-[calc(100vh-80px)] overflow-y-auto z-50 p-2"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {allCategories.length > 0 ? (
                  allCategories.map((category) => (
                    <DropdownMenuItem key={category._id || category.id} asChild className="px-3 py-2.5">
                      <Link 
                        to={`/category/${category.slug}`}
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="w-full"
                      >
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="px-3 py-2.5">Loading categories...</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        <div className="flex-1 flex items-center gap-4 max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              {user?.role === 'customer' && (
                <>
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/profile?tab=wishlist">
                      <Heart className="h-5 w-5" />
                      {wishlistCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {wishlistCount > 9 ? '9+' : wishlistCount}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=statistics" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Statistics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=bought-product" className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Purchased Products
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=orders" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=wishlist" className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Wishlist
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=addresses" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Addresses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=profile" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/become-seller" className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Become a Seller
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {user?.role === 'seller' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=statistics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Statistics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=sold-products" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Sold Products
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=products" className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Products
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=analytics" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=payments" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payments
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=reviews" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Reviews
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {user?.role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=statistics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Statistics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=sellers" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Sellers
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=buyers" className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Buyers
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=products" className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Products
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=payouts" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Payouts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=categories" className="flex items-center gap-2">
                        <Tags className="h-4 w-4" />
                        Categories
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=home" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=reviews" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Reviews
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=reports" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Reports
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=refunds" className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Refunds
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
          {!isAuthenticated && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth/login">Sign In</Link>
            </Button>
          )}
           {/* Deals Bell Icon - Visible to all users */}
           <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/deals">
              <Bell className="h-5 w-5" />
              {dealsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-orange-600">
                  {dealsCount > 9 ? '9+' : dealsCount}
                </Badge>
              )}
            </Link>
          </Button>
          {/* Cart icon - visible for both authenticated and guest users, positioned on the right */}
          <CartDrawer />
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container py-4 flex flex-col gap-2">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Button key={category._id || category.id} variant="ghost" className="justify-start" asChild>
                  <Link to={`/category/${category.slug}`}>{category.name}</Link>
                </Button>
              ))
            ) : (
              <div className="text-sm text-muted-foreground px-4">Loading categories...</div>
            )}
          </nav>
        </div>
      )}

      {/* Shop by Category Navigation Bar */}
      {headerCategories.length > 0 && (
        <div>
          <nav className="container flex items-center justify-center gap-8 overflow-x-auto pb-2.5">
            {headerCategories.map((category) => (
              <Link
                key={category._id || category.id}
                to={`/category/${category.slug}`}
                className="text-sm text-gray-700 hover:text-gray-900 whitespace-nowrap transition-colors font-medium"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
    </>
  )
}
