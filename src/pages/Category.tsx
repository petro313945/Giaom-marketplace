import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sliders, X, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from '@/components/ui/use-toast'
import * as categoryService from '../services/categoryService'
import * as productService from '../services/productService'
import { getFirstImageUrl } from '../utils/imageUtils'
import { truncateText } from '../utils/textUtils'
import ProductRating from '../components/ProductRating'
import VariantSelectionModal from '../components/VariantSelectionModal'
import type { Product } from '../services/productService'
import type { Category } from '../services/categoryService'

export default function Category() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [allProductsForFilters, setAllProductsForFilters] = useState<Product[]>([])
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
  const size = searchParams.get('size') || ''
  const color = searchParams.get('color') || ''
  const stockStatus = searchParams.get('stockStatus') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Fetch all categories for the category selector
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories()
        setCategories(response.categories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch all products in category for filter options
  useEffect(() => {
    const fetchAllProductsForFilters = async () => {
      if (!slug) return
      try {
        // Fetch a large set of products to extract all unique sizes and colors
        // If slug is "all", fetch all products, otherwise fetch by category
        const params = slug === 'all' ? { limit: 1000 } : { category: slug, limit: 1000 }
        const response = await productService.getProducts(params)
        setAllProductsForFilters(response.products)
      } catch (error) {
        console.error('Failed to fetch products for filters:', error)
      }
    }
    fetchAllProductsForFilters()
  }, [slug])

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return

      try {
        setLoading(true)
        
        // Fetch category info only if not "all"
        if (slug !== 'all') {
          const categoryResponse = await categoryService.getProductsByCategory(slug, { limit: 1 })
          setCategory(categoryResponse.category)
        } else {
          setCategory(null)
        }

        // Fetch products with filters
        const params: any = {
          page: page,
          limit: 20
        }

        // Only add category filter if not "all"
        if (slug !== 'all') {
          params.category = slug
        }

        if (minPrice) params.minPrice = minPrice
        if (maxPrice) params.maxPrice = maxPrice
        if (size) params.size = size
        if (color) params.color = color
        if (stockStatus) params.stockStatus = stockStatus
        if (sortBy) params.sortBy = sortBy
        if (sortOrder) params.sortOrder = sortOrder

        const productsResponse = await productService.getProducts(params)
        setProducts(productsResponse.products)
        setPagination(productsResponse.pagination)
      } catch (error) {
        console.error('Failed to fetch category data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, minPrice, maxPrice, size, color, stockStatus, sortBy, sortOrder, page])

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

  const handleSortChange = (value: string) => {
    // Parse combined sort value (e.g., "price-asc", "createdAt-desc")
    const [sortByValue, sortOrderValue] = value.split('-')
    updateSearchParams({ sortBy: sortByValue, sortOrder: sortOrderValue })
  }

  const getSortValue = () => {
    return `${sortBy}-${sortOrder}`
  }

  const toggleSize = (selectedSize: string) => {
    handleFilterChange('size', size === selectedSize ? '' : selectedSize)
  }

  const toggleColor = (selectedColor: string) => {
    handleFilterChange('color', color === selectedColor ? '' : selectedColor)
  }

  const toggleStockStatus = (status: string) => {
    handleFilterChange('stockStatus', stockStatus === status ? '' : status)
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
      if (!productId) {
        toast({
          title: 'Error',
          description: 'Product ID is missing.',
          variant: 'destructive',
        })
        return
      }
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
      if (!productId) {
        toast({
          title: 'Error',
          description: 'Product ID is missing.',
          variant: 'destructive',
        })
        return
      }
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

  // Extract unique sizes and colors from all products in category (for filter options)
  // Must be called before any early returns to follow rules of hooks
  const { uniqueSizes, uniqueColors } = useMemo(() => {
    const sizesSet = new Set<string>()
    const colorsSet = new Set<string>()
    
    // Use allProductsForFilters to get all available options, not just filtered results
    // Fallback to current products if allProductsForFilters hasn't loaded yet
    const productsToUse = allProductsForFilters.length > 0 ? allProductsForFilters : products
    
    productsToUse.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          if (variant.size && variant.size.trim()) {
            sizesSet.add(variant.size.trim())
          }
          if (variant.color && variant.color.trim()) {
            colorsSet.add(variant.color.trim())
          }
        })
      }
    })
    
    return {
      uniqueSizes: Array.from(sizesSet).sort(),
      uniqueColors: Array.from(colorsSet).sort()
    }
  }, [allProductsForFilters, products])

  const categoryName = slug === 'all' ? 'All Products' : (category?.name || slug?.replace(/-/g, ' ') || 'Category')
  const hasActiveFilters = minPrice || maxPrice || size || color || stockStatus || sortBy !== 'createdAt' || sortOrder !== 'desc'

  if (loading) {
    return (
      <div className="bg-muted py-12">
        <div className="container">
          <div className="text-center">Loading category...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-muted py-12">
        <div className="container">
          <h1 className="text-4xl font-bold capitalize">{categoryName}</h1>
          {category?.description && (
            <p className="text-muted-foreground mt-2">{category.description}</p>
          )}
        </div>
      </div>

      <div className="container py-12">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`md:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select
                      value={slug || ''}
                      onValueChange={(value) => navigate(`/category/${value}`)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id || cat.id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort - Combined */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Sort</Label>
                    <Select value={getSortValue()} onValueChange={handleSortChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt-desc">Newest First</SelectItem>
                        <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="title-asc">Name: A to Z</SelectItem>
                        <SelectItem value="title-desc">Name: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min $"
                        value={minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Max $"
                        value={maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Size Filter - Button Group */}
                  {uniqueSizes.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Size</Label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSizes.map((s) => (
                          <Button
                            key={s}
                            type="button"
                            variant={size === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSize(s)}
                            className="h-8 px-3 text-xs"
                          >
                            {size === s && <Check className="h-3 w-3 mr-1" />}
                            {s}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Filter - Button Group */}
                  {uniqueColors.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Color</Label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueColors.map((c) => (
                          <Button
                            key={c}
                            type="button"
                            variant={color === c ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleColor(c)}
                            className="h-8 px-3 text-xs"
                          >
                            {color === c && <Check className="h-3 w-3 mr-1" />}
                            {c}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Status - Button Group */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Availability</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={stockStatus === 'inStock' ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStockStatus('inStock')}
                        className="h-8 flex-1 text-xs"
                      >
                        {stockStatus === 'inStock' && <Check className="h-3 w-3 mr-1" />}
                        In Stock
                      </Button>
                      <Button
                        type="button"
                        variant={stockStatus === 'outOfStock' ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStockStatus('outOfStock')}
                        className="h-8 flex-1 text-xs"
                      >
                        {stockStatus === 'outOfStock' && <Check className="h-3 w-3 mr-1" />}
                        Out of Stock
                      </Button>
                    </div>
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
                <h2 className="text-2xl font-bold">{categoryName}</h2>
                <p className="text-sm text-muted-foreground">
                  {pagination.total} {pagination.total === 1 ? 'product' : 'products'} found
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                <p className="text-muted-foreground">No products found in this category.</p>
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
                          <h4 className="font-semibold text-m" title={product.title}>
                            {truncateText(product.title, 40)}
                          </h4>
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
