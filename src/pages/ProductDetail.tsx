import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, ShoppingCart, ArrowLeft, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import * as productService from '../services/productService'
import * as wishlistService from '../services/wishlistService'
import * as reviewService from '../services/reviewService'
import RatingDisplay from '../components/RatingDisplay'
import ReviewList from '../components/ReviewList'
import ReviewForm from '../components/ReviewForm'
import ReportDialog from '../components/ReportDialog'
import { getImageUrl } from '../utils/imageUtils'
import type { Product } from '../services/productService'
import type { ReviewStats, Review } from '../services/reviewService'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
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

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      
      try {
        setError(null)
        const response = await productService.getProductById(id)
        setProduct(response.product)
        
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

  const handleAddToCart = async () => {
    if (!product) return
    
    // Check authentication first
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to add items to your cart.',
        variant: 'default',
      })
      navigate('/auth/login')
      return
    }

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
      await addItem(productId, 1, selectedVariant || undefined)
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
        description: errorMessage.includes('log in') 
          ? 'Please log in to add items to your cart.' 
          : errorMessage,
        variant: 'destructive',
      })
      if (errorMessage.includes('log in')) {
        setTimeout(() => navigate('/auth/login'), 1500)
      }
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

  // Get price for selected variant or product
  const getDisplayPrice = () => {
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

  return (
    <div className="container py-12">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-row gap-4">
          {/* Vertical Thumbnail Strip (Left) */}
          {(product.imageUrls && product.imageUrls.length > 1) && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              {product.imageUrls.map((imageUrl, index) => (
                <button
                  key={index}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === index 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={getImageUrl(imageUrl)}
                    alt={`${product.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Main Image (Right of thumbnails) */}
          <div className="relative flex-1 min-w-0 bg-white rounded-lg overflow-hidden border">
            <img
              src={getImageUrl(
                (product.imageUrls && product.imageUrls.length > 0) 
                  ? product.imageUrls[selectedImageIndex] 
                  : product.imageUrl
              )}
              alt={product.title}
              className="w-full aspect-[4/5] object-contain main-product-image"
            />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              {reviewStats ? (
                <RatingDisplay
                  rating={reviewStats.averageRating}
                  totalReviews={reviewStats.totalReviews}
                  showCount
                  size="md"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-gray-300" />
                  <span className="text-muted-foreground">No ratings yet</span>
                </div>
              )}
            </div>
            <p className="text-3xl font-bold">${getDisplayPrice()}</p>
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
                        onClick={() => setSelectedVariant({ ...selectedVariant, size })}
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
                        onClick={() => setSelectedVariant({ ...selectedVariant, color })}
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

          {product.description && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-1">Category</p>
            <p className="font-medium capitalize">{product.category}</p>
          </div>

          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="flex-1" 
              onClick={handleAddToCart} 
              disabled={added || getAvailableStock() === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {getAvailableStock() === 0 
                ? "Out of Stock" 
                : added 
                  ? "Added to Cart!" 
                  : "Add to Cart"}
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
          
          <div className="flex justify-end">
            <ReportDialog
              reportedType="product"
              reportedId={product._id || product.id}
              reportedTitle={product.title}
            />
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
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => {
              const productId = relatedProduct._id || relatedProduct.id
              return (
                <Link key={productId} to={`/product/${productId}`} className="block">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-0">
                      <img
                        src={getImageUrl(relatedProduct.imageUrl)}
                        alt={relatedProduct.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-2 p-4">
                      <h4 className="font-semibold text-lg line-clamp-2" title={relatedProduct.title}>{relatedProduct.title}</h4>
                      <RatingDisplay rating={4.5} totalReviews={0} showCount size="sm" />
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
