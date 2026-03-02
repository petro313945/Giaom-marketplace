import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, User, Menu, Heart, LogOut, Package, MapPin, ShoppingBag, TrendingUp, DollarSign, CheckCircle2, Store, ShoppingCart, Star, AlertCircle, Wallet, Tags, Home } from 'lucide-react'
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

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<categoryService.Category[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const { isAuthenticated, user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories()
        // Get first 4 categories for mobile menu
        setCategories(response.categories.slice(0, 4))
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/">
            <h1 className="text-2xl font-bold cursor-pointer">Giaom</h1>
          </Link>
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
          {/* Cart icon - visible for both authenticated and guest users */}
          <CartDrawer />
          
          {isAuthenticated && (
            <>
              {user?.role === 'customer' && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/become-seller">Become a Seller</Link>
                  </Button>
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
                        <Link to="/profile?tab=bought-product" className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Bought Product
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
                      <Link to="/profile" className="flex items-center gap-2">
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
    </header>
  )
}
