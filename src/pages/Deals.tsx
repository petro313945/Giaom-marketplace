import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import * as productService from '../services/productService'
import { getFirstImageUrl } from '../utils/imageUtils'
import { truncateText } from '../utils/textUtils'
import ProductRating from '../components/ProductRating'
import VariantSelectionModal from '../components/VariantSelectionModal'
import { calculateBulkDiscountPrice, getApplicableDiscountTier } from '../utils/bulkDiscount'
import type { Product } from '../services/productService'
import { Percent } from 'lucide-react'

export default function Deals() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Fetch products with bulk discounts
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        // Fetch products in batches (max limit is 100 per backend validation)
        const maxLimit = 100
        let allDealsProducts: Product[] = []
        let currentPage = 1
        let hasMore = true

        // Fetch all products with bulk discounts by making multiple requests
        while (hasMore) {
          const response = await productService.getProducts({ 
            page: currentPage,
            limit: maxLimit,
            sortBy,
            sortOrder
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
        
        // Apply client-side pagination
        const limit = 20
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedProducts = allDealsProducts.slice(startIndex, endIndex)
        
        setProducts(paginatedProducts)
        // Update pagination to reflect filtered results
        setPagination({
          page,
          limit,
          total: allDealsProducts.length,
          pages: Math.ceil(allDealsProducts.length / limit)
        })
      } catch (error) {
        console.error('Failed to fetch deals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [sortBy, sortOrder, page])

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    if (!updates.page) {
      newParams.set('page', '1')
    }
    setSearchParams(newParams)
  }

  const handleSortChange = (value: string) => {
    const [sortByValue, sortOrderValue] = value.split('-')
    updateSearchParams({ sortBy: sortByValue, sortOrder: sortOrderValue })
  }

  const getSortValue = () => {
    return `${sortBy}-${sortOrder}`
  }

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product)
      setIsVariantModalOpen(true)
      return
    }
    
    if (product.stockQuantity === 0 || !product.stockQuantity) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      const productId = product._id || product.id
      await addItem(productId, 1)
      toast({
        title: 'Added to Cart',
        description: `${product.title} has been added to your cart.`,
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to add to cart'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleVariantAddToCart = async (variant?: { size?: string; color?: string }) => {
    if (!selectedProduct) return

    try {
      const productId = selectedProduct._id || selectedProduct.id
      await addItem(productId, 1, variant)
      toast({
        title: 'Added to Cart',
        description: `${selectedProduct.title} has been added to your cart.`,
        variant: 'default',
      })
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to add to cart'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Get the best discount percentage for a product
  const getBestDiscount = (product: Product) => {
    if (!product.bulkDiscountTiers || product.bulkDiscountTiers.length === 0) return 0
    return Math.max(...product.bulkDiscountTiers.map(tier => tier.discountPercent))
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Percent className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Deals & Discounts</h1>
        </div>
        <p className="text-muted-foreground">
          Discover amazing products with bulk discounts and special offers
        </p>
      </div>

      {/* Sort */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'deal' : 'deals'} available
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <select
            value={getSortValue()}
            onChange={(e) => handleSortChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-asc">Name: A to Z</option>
            <option value="title-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">Loading deals...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Percent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No deals available at the moment</p>
          <p className="text-muted-foreground mb-4">Check back later for amazing discounts!</p>
          <Button asChild variant="outline">
            <Link to="/">Browse All Products</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product) => {
              const productId = product._id || product.id
              const bestDiscount = getBestDiscount(product)
              const discountTier = getApplicableDiscountTier(1, product.bulkDiscountTiers)
              const discountedPrice = discountTier 
                ? calculateBulkDiscountPrice(product.price, 1, product.bulkDiscountTiers)
                : product.price
              
              return (
                <Link key={productId} to={`/product/${productId}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full relative">
                    {bestDiscount > 0 && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="destructive" className="text-sm font-bold">
                          Up to {bestDiscount}% OFF
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-0">
                      <img
                        src={getFirstImageUrl(product)}
                        alt={product.title}
                        className="w-full h-64 object-contain rounded-t-lg bg-muted"
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-2 p-4">
                      <h4 className="font-semibold text-m" title={product.title}>
                        {truncateText(product.title, 80)}
                      </h4>
                      <ProductRating productId={productId} size="sm" showCount />
                      <div className="flex items-center gap-2 w-full">
                        {discountTier && discountTier.discountPercent > 0 ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-green-600">
                              ${discountedPrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              ${product.price.toFixed(2)}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {discountTier.discountPercent}% OFF
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                      {product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0 && (
                        <div className="text-xs text-muted-foreground w-full">
                          <p className="font-medium mb-1">Bulk Discounts:</p>
                          <div className="space-y-1">
                            {product.bulkDiscountTiers.map((tier, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>Buy {tier.minQuantity}+ items:</span>
                                <span className="font-semibold text-green-600">
                                  {tier.discountPercent}% OFF
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={
                          !(product.variants && product.variants.length > 0) &&
                          (product.stockQuantity === 0 || !product.stockQuantity)
                        }
                      >
                        {product.variants && product.variants.length > 0
                          ? 'Add to Cart'
                          : product.stockQuantity === 0 || !product.stockQuantity
                          ? 'Out of Stock'
                          : 'Add to Cart'}
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => updateSearchParams({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <Button
                variant="outline"
                disabled={page === pagination.pages}
                onClick={() => updateSearchParams({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Variant Selection Modal */}
      <VariantSelectionModal
        product={selectedProduct}
        open={isVariantModalOpen}
        onOpenChange={setIsVariantModalOpen}
        onAddToCart={handleVariantAddToCart}
      />
    </div>
  )
}
