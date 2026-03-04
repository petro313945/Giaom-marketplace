import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sliders, X, Store as StoreIcon } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from '@/components/ui/use-toast'
import * as productService from '../services/productService'
import { getFirstImageUrl } from '../utils/imageUtils'
import ProductRating from '../components/ProductRating'
import VariantSelectionModal from '../components/VariantSelectionModal'
import type { Product } from '../services/productService'

export default function Store() {
  const { sellerId } = useParams<{ sellerId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewAll, setViewAll] = useState(false)
  const [storeName, setStoreName] = useState<string>('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()

  // Get current filter values from URL
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const page = parseInt(searchParams.get('page') || '1', 10)

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) return

      try {
        setLoading(true)
        
        // Fetch products with filters
        const params: any = {
          sellerId: sellerId,
          page: viewAll ? 1 : page,
          limit: viewAll ? 1000 : 20 // Fetch all products when viewAll is true
        }

        if (minPrice) params.minPrice = minPrice
        if (maxPrice) params.maxPrice = maxPrice
        if (sortBy) params.sortBy = sortBy
        if (sortOrder) params.sortOrder = sortOrder

        const productsResponse = await productService.getProducts(params)
        setProducts(productsResponse.products)
        setPagination(productsResponse.pagination)
        
        // Extract store name from first product's sellerId if available
        if (productsResponse.products.length > 0) {
          const firstProduct = productsResponse.products[0]
          if (firstProduct.sellerId && typeof firstProduct.sellerId === 'object') {
            setStoreName(firstProduct.sellerId.businessName || firstProduct.sellerId.fullName || 'Store')
          } else {
            setStoreName('Store')
          }
        }
      } catch (error) {
        console.error('Failed to fetch store data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sellerId, minPrice, maxPrice, sortBy, sortOrder, page, viewAll])

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    // Reset to page 1 when filters change
    if (!updates.page) {
      newParams.set('page', '1')
    }
    setSearchParams(newParams)
  }

  const handleFilterChange = (key: string, value: string) => {
    updateSearchParams({ [key]: value || null })
  }

  const clearFilters = () => {
    setSearchParams({ page: '1' })
  }

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If product has variants, open variant selection modal
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product)
      setIsVariantModalOpen(true)
      return
    }
    
    // Check stock availability for simple products
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
      if (!productId) return
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
      if (!productId) return
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

  if (loading) {
    return (
      <div className="bg-muted py-12">
        <div className="container">
          <div className="text-center">Loading store...</div>
        </div>
      </div>
    )
  }

  const hasActiveFilters = minPrice || maxPrice || sortBy !== 'createdAt' || sortOrder !== 'desc'

  return (
    <>
      <div className="bg-muted py-12">
        <div className="container">
          <div className="flex items-center gap-3">
            <StoreIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">{storeName || 'Store'}</h1>
              <p className="text-muted-foreground mt-1">Browse all products from this seller</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Newest</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="title">Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Select value={sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{storeName || 'Store'}</h2>
                <p className="text-sm text-muted-foreground">
                  {viewAll 
                    ? `Showing all ${products.length} ${products.length === 1 ? 'product' : 'products'}`
                    : `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'} found`
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewAll ? "default" : "outline"}
                  onClick={() => {
                    setViewAll(!viewAll)
                    // Reset to page 1 when toggling view all
                    if (!viewAll) {
                      updateSearchParams({ page: '1' })
                    }
                  }}
                >
                  {viewAll ? 'View Paginated' : 'View All Products'}
                </Button>
                <Button
                  variant="outline"
                  className="md:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Sliders className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-12">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found in this store.</p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => {
                    const productId = product._id || product.id
                    if (!productId) return null
                    return (
                    <Link key={productId} to={`/product/${productId}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardContent className="p-0">
                    <img
                      src={getFirstImageUrl(product)}
                      alt={product.title}
                      className="w-full h-64 object-contain rounded-t-lg bg-muted"
                    />
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-2 p-4">
                          <h4 className="font-semibold text-lg line-clamp-2" title={product.title}>{product.title}</h4>
                          <ProductRating productId={productId} size="sm" showCount />
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xl font-bold">${product.price}</span>
                            <Button 
                              size="sm" 
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
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                    )
                  })}
                </div>

                {/* Pagination */}
                {!viewAll && pagination.pages > 1 && (
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
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      <VariantSelectionModal
        product={selectedProduct}
        open={isVariantModalOpen}
        onOpenChange={setIsVariantModalOpen}
        onAddToCart={handleVariantAddToCart}
      />
    </>
  )
}
