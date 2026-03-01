import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Sliders, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import { getFirstImageUrl } from '../utils/imageUtils'
import { truncateText } from '../utils/textUtils'
import ProductRating from '../components/ProductRating'
import VariantSelectionModal from '../components/VariantSelectionModal'
import type { Product } from '../services/productService'
import type { Category } from '../services/categoryService'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Get current filter values from URL
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Fetch categories
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

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const params: any = {
          page,
          limit: 20
        }

        if (search) params.search = search
        if (category) params.category = category
        if (minPrice) params.minPrice = minPrice
        if (maxPrice) params.maxPrice = maxPrice
        if (sortBy) params.sortBy = sortBy
        if (sortOrder) params.sortOrder = sortOrder

        const response = await productService.getProducts(params)
        setProducts(response.products)
        setPagination(response.pagination)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [search, category, minPrice, maxPrice, sortBy, sortOrder, page])

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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchValue = formData.get('search') as string
    updateSearchParams({ search: searchValue || null, page: null })
  }

  const handleFilterChange = (key: string, value: string) => {
    updateSearchParams({ [key]: value || null })
  }

  const clearFilters = () => {
    setSearchParams({})
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

  const hasActiveFilters = category || minPrice || maxPrice || sortBy !== 'createdAt' || sortOrder !== 'desc'

  return (
    <div className="container py-8">
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

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={category || 'all'} 
                    onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id || cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <Input
                name="search"
                placeholder="Search products..."
                defaultValue={search}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
              <Button
                type="button"
                variant="outline"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Sliders className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {search ? `Search: "${search}"` : 'All Products'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {pagination.total} {pagination.total === 1 ? 'product' : 'products'} found
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
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
                          <h4 className="font-semibold text-lg" title={product.title}>{truncateText(product.title, 80)}</h4>
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
