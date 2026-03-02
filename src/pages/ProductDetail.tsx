import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, ShoppingCart, ArrowLeft, Heart, Minus, Plus, Truck, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import * as productService from '../services/productService'
import * as wishlistService from '../services/wishlistService'
import * as reviewService from '../services/reviewService'
import * as categoryService from '../services/categoryService'
import RatingDisplay from '../components/RatingDisplay'
import ProductRating from '../components/ProductRating'
import ReviewList from '../components/ReviewList'
import ReviewForm from '../components/ReviewForm'
import ReportDialog from '../components/ReportDialog'
import ImageZoom from '../components/ImageZoom'
import { getImageUrl, getFirstImageUrl } from '../utils/imageUtils'
import { calculateBulkDiscountPrice, calculateBulkDiscountTotal, getApplicableDiscountTier } from '../utils/bulkDiscount'
import type { Product } from '../services/productService'
import type { ReviewStats, Review } from '../services/reviewService'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loadingReviewStats, setLoadingReviewStats] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<{ size?: string; color?: string } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [categoryName, setCategoryName] = useState<string>('')
  const [purchaseCount, setPurchaseCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      
      try {
        setError(null)
        const response = await productService.getProductById(id)
        setProduct(response.product)
        
        // Fetch category name for breadcrumb
        if (response.product.category) {
          try {
            const categoriesResponse = await categoryService.getCategories()
            const category = categoriesResponse.categories.find(
              cat => cat.slug === response.product.category
            )
            if (category) {
              setCategoryName(category.name)
            } else {
              // Fallback to capitalized slug if category not found
              setCategoryName(response.product.category.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' '))
            }
          } catch (error) {
            console.error('Failed to fetch category:', error)
            // Fallback to capitalized slug
            setCategoryName(response.product.category.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '))
          }
        }
        
        // Fetch purchase statistics
        try {
          const statsResponse = await productService.getProductPurchaseStats(id)
          setPurchaseCount(statsResponse.purchaseCount)
        } catch (error) {
          console.error('Failed to fetch purchase stats:', error)
          // Don't show error to user, just don't display purchase count
        }
        
        // Fetch related products from the same category
        if (response.product.category) {
          setLoadingRelated(true)
          try {
            const relatedResponse = await productService.getProducts({
              category: response.product.category,
              limit: 5 // Fetch 5 to ensure we get 4 after filtering
            })
            // Filter out the current product
            const currentProductId = response.product._id || response.product.id
            const filtered = relatedResponse.products.filter(
              (p: Product) => {
                const productId = p._id || p.id
                return productId !== currentProductId && productId !== id
              }
            )
            setRelatedProducts(filtered.slice(0, 4))
          } catch (error) {
            console.error('Failed to fetch related products:', error)
            setRelatedProducts([])
          } finally {
            setLoadingRelated(false)
          }
        } else {
          setRelatedProducts([])
        }
      } catch (error: any) {
        console.error('Failed to fetch product:', error)
        setError(error.response?.data?.error || 'Product not found')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated || !product) return
      
      try {
        const productId = product._id || product.id
        const response = await wishlistService.checkWishlistStatus(productId)
        setInWishlist(response.inWishlist)
      } catch (error) {
        console.error('Failed to check wishlist status:', error)
      }
    }

    checkWishlistStatus()
  }, [isAuthenticated, product])

  useEffect(() => {
    const fetchReviewData = async () => {
      if (!product) return
      
      const productId = product._id || product.id
      if (!productId) return

      try {
        setLoadingReviewStats(true)
        const [statsResponse, reviewResponse] = await Promise.allSettled([
          reviewService.getReviewStats(productId),
          isAuthenticated ? reviewService.getUserReview(productId).catch(() => null) : Promise.resolve(null)
        ])

        if (statsResponse.status === 'fulfilled') {
          setReviewStats(statsResponse.value)
        }

        if (reviewResponse.status === 'fulfilled' && reviewResponse.value && reviewResponse.value.review) {
          setUserReview(reviewResponse.value.review)
        } else {
          setUserReview(null)
        }
      } catch (error) {
        console.error('Failed to fetch review data:', error)
      } finally {
        setLoadingReviewStats(false)
      }
    }

    fetchReviewData()
  }, [product, isAuthenticated])

  // Set default variant when product loads
  useEffect(() => {
    if (!product) {
      setSelectedVariant(null)
      return
    }

    if (!product.variants || product.variants.length === 0) {
      setSelectedVariant(null)
      return
    }

    // Select the first available variant with stock, or first variant if all are out of stock
    const inStockVariant = product.variants.find(v => v.stock > 0)
    const defaultVariant = inStockVariant || product.variants[0]

    if (defaultVariant) {
      const variant: { size?: string; color?: string } = {}
      if (defaultVariant.size) variant.size = defaultVariant.size
      if (defaultVariant.color) variant.color = defaultVariant.color
      setSelectedVariant(Object.keys(variant).length > 0 ? variant : null)
    } else {
      setSelectedVariant(null)
    }
  }, [product, id])

  // Adjust quantity when available stock changes
  useEffect(() => {
    const availableStock = getAvailableStock()
    if (quantity > availableStock && availableStock > 0) {
      setQuantity(availableStock)
    } else if (availableStock === 0) {
      setQuantity(1)
    }
  }, [selectedVariant, product])

  const handleAddToCart = async () => {
    if (!product) return

    // If product has variants, require variant selection
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: 'Variant Required',
        description: 'Please select a variant (size/color) before adding to cart.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      const productId = product._id || product.id
      await addItem(productId, quantity, selectedVariant || undefined)
      setAdded(true)
      const variantLabel = selectedVariant 
        ? ` (${[selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ')})`
        : ''
      toast({
        title: 'Added to Cart',
        description: `${product.title}${variantLabel} has been added to your cart.`,
        variant: 'default',
      })
      setTimeout(() => setAdded(false), 2000)
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to add to cart'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleBuyNow = async () => {
    if (!product) return

    // If product has variants, require variant selection
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: 'Variant Required',
        description: 'Please select a variant (size/color) before purchasing.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      const productId = product._id || product.id
      
      // Clear cart first, then add this item
      await clearCart()
      await addItem(productId, quantity, selectedVariant || undefined)
      
      // Navigate to checkout
      navigate('/checkout')
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to proceed to checkout'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Get available stock for selected variant or product
  const getAvailableStock = () => {
    if (!product) return 0
    if (selectedVariant && product.variants && product.variants.length > 0) {
      const matchingVariant = product.variants.find(v => {
        const sizeMatch = !selectedVariant.size || v.size === selectedVariant.size
        const colorMatch = !selectedVariant.color || v.color === selectedVariant.color
        return sizeMatch && colorMatch
      })
      return matchingVariant?.stock || 0
    }
    return product.stockQuantity || 0
  }

  // Get base price for selected variant or product
  const getBasePrice = () => {
    if (!product) return 0
    if (selectedVariant && product.variants && product.variants.length > 0) {
      const matchingVariant = product.variants.find(v => {
        const sizeMatch = !selectedVariant.size || v.size === selectedVariant.size
        const colorMatch = !selectedVariant.color || v.color === selectedVariant.color
        return sizeMatch && colorMatch
      })
      if (matchingVariant && matchingVariant.price !== undefined) {
        return matchingVariant.price
      }
    }
    return product.price
  }

  // Get price with discount applied
  const getDisplayPrice = () => {
    const basePrice = getBasePrice()
    if (!product || !product.bulkDiscountTiers || product.bulkDiscountTiers.length === 0) {
      return basePrice
    }
    return calculateBulkDiscountPrice(basePrice, quantity, product.bulkDiscountTiers)
  }

  // Get total price with discount
  const getTotalPrice = () => {
    const basePrice = getBasePrice()
    if (!product || !product.bulkDiscountTiers || product.bulkDiscountTiers.length === 0) {
      return basePrice * quantity
    }
    return calculateBulkDiscountTotal(basePrice, quantity, product.bulkDiscountTiers)
  }

  // Get applicable discount tier
  const getCurrentDiscountTier = () => {
    if (!product || !product.bulkDiscountTiers) return null
    return getApplicableDiscountTier(quantity, product.bulkDiscountTiers)
  }

  // Get the matching variant object based on selected variant
  // Prioritizes variants with images when multiple matches exist
  const getMatchingVariant = () => {
    if (!product || !product.variants || !selectedVariant) return null
    
    // Find all matching variants
    const matchingVariants = product.variants.filter(v => {
      const sizeMatch = !selectedVariant.size || v.size === selectedVariant.size
      const colorMatch = !selectedVariant.color || v.color === selectedVariant.color
      return sizeMatch && colorMatch
    })
    
    if (matchingVariants.length === 0) return null
    
    // Prioritize variant with images if available
    const variantWithImages = matchingVariants.find(v => v.imageUrls && v.imageUrls.length > 0)
    if (variantWithImages) return variantWithImages
    
    // Otherwise return the first matching variant
    return matchingVariants[0]
  }

  // Get main product images only (for thumbnail list)
  const getMainProductImages = () => {
    if (!product) return []
    
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls
    }
    
    if (product.imageUrl) {
      return [product.imageUrl]
    }
    
    return []
  }

  // Get images to display (color-based images if available, with fallback to product images)
  // Images are per color, not per size - following Amazon/e-commerce best practices
  const getDisplayImages = () => {
    if (!product) return []
    
    // Get color-based images if color is selected
    if (selectedVariant?.color && product.colorImages) {
      const colorImages = product.colorImages[selectedVariant.color]
      if (colorImages && Array.isArray(colorImages) && colorImages.length > 0) {
        return colorImages
      }
    }
    
    // Fallback to product images
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls
    } else if (product.imageUrl) {
      return [product.imageUrl]
    }
    
    return []
  }

  // Reset image index when color changes (not size) and ensure it's within bounds
  // Images are per color, so only color changes should trigger image updates
  useEffect(() => {
    if (!product) return
    
    let displayImages: string[] = []
    
    // Get color-based images if color is selected
    if (selectedVariant?.color && product.colorImages) {
      const colorImages = product.colorImages[selectedVariant.color]
      if (colorImages && Array.isArray(colorImages) && colorImages.length > 0) {
        displayImages = colorImages
      }
    }
    
    // Fallback to product images
    if (displayImages.length === 0) {
      if (product.imageUrls && product.imageUrls.length > 0) {
        displayImages = product.imageUrls
      } else if (product.imageUrl) {
        displayImages = [product.imageUrl]
      }
    }
    
    if (displayImages.length > 0) {
      // Reset to first image, or keep current index if still valid
      setSelectedImageIndex(prev => {
        return prev < displayImages.length ? prev : 0
      })
    } else {
      setSelectedImageIndex(0)
    }
  }, [selectedVariant?.color, product]) // Only depend on color, not size

  // Format purchase count (e.g., "1K+", "500+", "50+")
  const formatPurchaseCount = (count: number): string => {
    if (count >= 1000) {
      const thousands = Math.floor(count / 1000)
      return `${thousands}K+`
    } else if (count >= 100) {
      const hundreds = Math.floor(count / 100) * 100
      return `${hundreds}+`
    } else if (count > 0) {
      return `${count}+`
    }
    return ''
  }

  const handleToggleWishlist = async () => {
    if (!product) return

    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to add items to your wishlist.',
        variant: 'default',
      })
      navigate('/auth/login')
      return
    }

    setWishlistLoading(true)
    try {
      const productId = product._id || product.id
      if (inWishlist) {
        await wishlistService.removeFromWishlist(productId)
        setInWishlist(false)
        toast({
          title: 'Removed from Wishlist',
          description: `${product.title} has been removed from your wishlist.`,
        })
      } else {
        await wishlistService.addToWishlist(productId)
        setInWishlist(true)
        toast({
          title: 'Added to Wishlist',
          description: `${product.title} has been added to your wishlist.`,
        })
      }
      // Dispatch event to update header wishlist count
      window.dispatchEvent(new Event('wishlistChanged'))
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error.message || 'Failed to update wishlist'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setWishlistLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading product...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Product not found'}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Parse category name for hierarchical breadcrumb (e.g., "Cell Phones & Accessories › Cell Phones")
  const parseCategoryBreadcrumb = (name: string) => {
    // Check if category name contains separator (› or >)
    const separators = ['›', '>', '→']
    for (const sep of separators) {
      if (name.includes(sep)) {
        return name.split(sep).map(part => part.trim()).filter(Boolean)
      }
    }
    return [name]
  }

  const categoryBreadcrumbs = categoryName ? parseCategoryBreadcrumb(categoryName) : []

  return (
    <div className="container py-12">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <li>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          {categoryBreadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">›</span>
              {index === categoryBreadcrumbs.length - 1 ? (
                <span className="text-foreground capitalize">{crumb}</span>
              ) : (
                <Link 
                  to={`/category/${product?.category}`} 
                  className="hover:text-foreground transition-colors capitalize"
                >
                  {crumb}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-row gap-4">
          {/* Vertical Thumbnail Strip (Left) - Show images for selected color */}
          {(() => {
            const displayImages = getDisplayImages()
            return displayImages.length > 1 && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                {displayImages.map((imageUrl, index) => {
                  const isSelected = selectedImageIndex === index
                  
                  return (
                    <button
                      key={index}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                      onClick={() => {
                        setSelectedImageIndex(index)
                      }}
                    >
                      <img
                        src={getImageUrl(imageUrl)}
                        alt={`${product.title} - Image ${index + 1}`}
                        className="w-full h-full object-contain bg-muted"
                      />
                    </button>
                  )
                })}
              </div>
            )
          })()}
          
          {/* Main Image Container and Info Sections */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Main Image (Right of thumbnails) */}
            <div className="relative bg-muted rounded-lg border overflow-visible">
              <div className="overflow-hidden rounded-lg">
                {(() => {
                  const displayImages = getDisplayImages()
                  const imageUrl = displayImages.length > 0 
                    ? (displayImages[selectedImageIndex] || displayImages[0])
                    : (product.imageUrl || '')
                  return (
                    <ImageZoom
                      src={getImageUrl(imageUrl)}
                      alt={product.title}
                      className="w-full aspect-[4/5] main-product-image"
                      zoomLevel={3}
                    />
                  )
                })()}
              </div>
            </div>
            
            {/* Shipping/Returns/Payment Info - Below Main Image */}
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Free Shipping</span>
                  <p className="text-muted-foreground text-xs">Available on orders over $50</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Free Returns</span>
                  <p className="text-muted-foreground text-xs">30-day return policy</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Secure Payment</span>
                  <p className="text-muted-foreground text-xs">Your payment information is protected</p>
                </div>
              </div>
            </div>

            {/* About this item - Below Main Image */}
            {product.description && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">About this item</h2>
                <p className="text-muted-foreground text-sm">{product.description}</p>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            {/* Seller/Store Name */}
            {product.sellerId && (() => {
              const sellerIdValue = typeof product.sellerId === 'object' 
                ? ((product.sellerId as any)._id || (product.sellerId as any).id || product.sellerId)
                : product.sellerId;
              const storeName = typeof product.sellerId === 'object' 
                ? (product.sellerId.businessName || product.sellerId.fullName)
                : null;
              
              return sellerIdValue && storeName ? (
                <div className="mb-2">
                  <Link 
                    to={`/store/${sellerIdValue}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Visit the {storeName} Store
                  </Link>
                </div>
              ) : null;
            })()}
            
            <h1 className="text-2xl font-semibold mb-2">{product.title}</h1>
            
            {/* Rating and Review Count */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {reviewStats ? (
                <>
                  <div className="flex items-center gap-1">
                    <RatingDisplay
                      rating={reviewStats.averageRating}
                      totalReviews={reviewStats.totalReviews}
                      showCount
                      size="sm"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({reviewStats.totalReviews.toLocaleString()} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-gray-300" />
                  <span className="text-sm text-muted-foreground">No ratings yet</span>
                </div>
              )}
              {purchaseCount !== null && purchaseCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {formatPurchaseCount(purchaseCount)} bought in past month
                </span>
              )}
            </div>

            {/* Price Information */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                {getCurrentDiscountTier() ? (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">${getDisplayPrice().toFixed(2)}</p>
                    <p className="text-lg text-muted-foreground line-through">${getBasePrice().toFixed(2)}</p>
                    <Badge variant="destructive" className="ml-2">
                      {getCurrentDiscountTier()?.discountPercent}% OFF
                    </Badge>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">${getDisplayPrice().toFixed(2)}</p>
                )}
              </div>
              {getCurrentDiscountTier() && (
                <div className="text-sm text-green-600 font-medium">
                  Save ${((getBasePrice() - getDisplayPrice()) * quantity).toFixed(2)} on {quantity} {quantity === 1 ? 'item' : 'items'}
                </div>
              )}
              {quantity > 1 && (
                <div className="text-sm text-muted-foreground mt-1">
                  Total: ${getTotalPrice().toFixed(2)} for {quantity} {quantity === 1 ? 'item' : 'items'}
                </div>
              )}
            </div>

            {/* Bulk Discount Tiers Display */}
            {product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Bulk Discounts Available:</p>
                <div className="space-y-1">
                  {product.bulkDiscountTiers
                    .sort((a, b) => a.minQuantity - b.minQuantity)
                    .map((tier, index) => {
                      const isActive = quantity >= tier.minQuantity
                      const tierPrice = calculateBulkDiscountPrice(getBasePrice(), tier.minQuantity, product.bulkDiscountTiers)
                      return (
                        <div
                          key={index}
                          className={`text-xs flex items-center justify-between p-2 rounded ${
                            isActive ? 'bg-primary/10 border border-primary' : 'bg-background'
                          }`}
                        >
                          <span>
                            Buy {tier.minQuantity}+ {tier.minQuantity === 1 ? 'item' : 'items'}: 
                            <span className="font-semibold ml-1">{tier.discountPercent}% OFF</span>
                          </span>
                          <span className="text-muted-foreground">
                            ${tierPrice.toFixed(2)}/unit
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              {/* Size Selector */}
              {product.variants.some(v => v.size) && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(
                      product.variants
                        .filter(v => v.size)
                        .map(v => v.size)
                        .filter((size): size is string => !!size)
                    )).map(size => (
                      <Button
                        key={size}
                        type="button"
                        variant={selectedVariant?.size === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedVariant({ ...(selectedVariant || {}), size })
                          setQuantity(1)
                        }}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.variants.some(v => v.color) && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(
                      product.variants
                        .filter(v => v.color)
                        .map(v => v.color)
                        .filter((color): color is string => !!color)
                    )).map(color => (
                      <Button
                        key={color}
                        type="button"
                        variant={selectedVariant?.color === color ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedVariant({ ...(selectedVariant || {}), color })
                          setQuantity(1)
                        }}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-1">Stock Status</p>
            {getAvailableStock() === 0 ? (
              <Badge variant="destructive" className="text-sm">
                Out of Stock
              </Badge>
            ) : getAvailableStock() < 10 ? (
              <Badge variant="secondary" className="text-sm">
                Only {getAvailableStock()} left in stock
              </Badge>
            ) : (
              <Badge variant="default" className="text-sm">
                In Stock ({getAvailableStock()} available)
              </Badge>
            )}
          </div>

          {/* Quantity Selector */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                max={getAvailableStock()}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  const maxStock = getAvailableStock()
                  setQuantity(Math.max(1, Math.min(value, maxStock)))
                }}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const maxStock = getAvailableStock()
                  setQuantity(prev => Math.min(maxStock, prev + 1))
                }}
                disabled={quantity >= getAvailableStock()}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Category</p>
              <p className="font-medium capitalize">{product.category}</p>
            </div>
            <ReportDialog
              reportedType="product"
              reportedId={product._id || product.id}
              reportedTitle={product.title}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={handleBuyNow} 
                disabled={added || getAvailableStock() === 0}
                variant="default"
              >
                Buy Now
              </Button>
              <Button
                size="lg"
                variant={inWishlist ? "default" : "outline"}
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className="px-4"
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleAddToCart} 
              disabled={added || getAvailableStock() === 0}
              variant="outline"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {getAvailableStock() === 0 
                ? "Out of Stock" 
                : added 
                  ? "Added to Cart!" 
                  : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {isAuthenticated && !userReview && (
              <TabsTrigger value="write-review">Write a Review</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="reviews" className="mt-6">
            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
                    <RatingDisplay rating={reviewStats.averageRating} size="sm" />
                    <div className="text-sm text-muted-foreground mt-1">
                      {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewStats.ratingDistribution[star as keyof typeof reviewStats.ratingDistribution];
                      const percentage = reviewStats.totalReviews > 0 
                        ? (count / reviewStats.totalReviews) * 100 
                        : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-sm w-8">{star}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {userReview && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Review</h3>
                    {userReview.status === 'pending' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Pending Moderation
                      </span>
                    )}
                  </div>
                  <ReviewForm
                    productId={product._id || product.id || ''}
                    existingReview={userReview}
                    onSuccess={() => {
                      // Refresh review data
                      const productId = product._id || product.id
                      if (productId) {
                        reviewService.getUserReview(productId)
                          .then(res => setUserReview(res.review))
                          .catch(() => {})
                        reviewService.getReviewStats(productId)
                          .then(setReviewStats)
                          .catch(() => {})
                      }
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <ReviewList
              productId={product._id || product.id || ''}
              onReviewSubmit={() => {
                // Refresh review stats when a new review is submitted
                const productId = product._id || product.id
                if (productId) {
                  reviewService.getReviewStats(productId)
                    .then(setReviewStats)
                    .catch(() => {})
                }
              }}
            />
          </TabsContent>

          {isAuthenticated && !userReview && (
            <TabsContent value="write-review" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <ReviewForm
                    productId={product._id || product.id || ''}
                    onSuccess={() => {
                      // Refresh review data
                      const productId = product._id || product.id
                      if (productId) {
                        reviewService.getUserReview(productId)
                          .then(res => setUserReview(res.review))
                          .catch(() => {})
                        reviewService.getReviewStats(productId)
                          .then(setReviewStats)
                          .catch(() => {})
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Related Products Section */}
      {!loadingRelated && relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">More items to explore</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => {
              const productId = relatedProduct._id || relatedProduct.id
              return (
                <Link key={productId} to={`/product/${productId}`} className="block">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-0">
                      <img
                        src={getFirstImageUrl(relatedProduct)}
                        alt={relatedProduct.title}
                        className="w-full h-48 object-contain rounded-t-lg bg-muted"
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-2 p-4">
                      <h4 className="font-semibold text-lg line-clamp-2" title={relatedProduct.title}>{relatedProduct.title}</h4>
                      <ProductRating productId={productId} size="sm" showCount />
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xl font-bold">${relatedProduct.price}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
