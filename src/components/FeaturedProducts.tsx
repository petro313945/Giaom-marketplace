import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { useCart } from '../context/CartContext'
import { useToast } from './ui/use-toast'
import * as homeSettingsService from '../services/homeSettingsService'
import { getFirstImageUrl } from '../utils/imageUtils'
import ProductRating from './ProductRating'
import VariantSelectionModal from './VariantSelectionModal'
import type { Product } from '../services/productService'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await homeSettingsService.getHomeSettings()
        // Limit to 12 products
        setProducts(response.featuredProducts.slice(0, 12))
      } catch (error) {
        console.error('Failed to fetch featured products:', error)
        // Fallback to empty array if API fails
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

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
      <section className="container py-12 md:py-16 bg-muted/30">
        <div className="text-center">Loading products...</div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="container py-12 md:py-16 bg-muted/30">
        <h3 className="text-2xl md:text-3xl font-bold mb-8">Featured Products</h3>
        <div className="text-center text-muted-foreground">No products available yet</div>
      </section>
    )
  }

  return (
    <section className="container py-12 md:py-16 bg-muted/30">
      <h3 className="text-2xl md:text-3xl font-bold mb-8">Featured Products</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {productId && <ProductRating productId={productId} size="sm" showCount />}
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

      {/* Variant Selection Modal */}
      <VariantSelectionModal
        product={selectedProduct}
        open={isVariantModalOpen}
        onOpenChange={setIsVariantModalOpen}
        onAddToCart={handleVariantAddToCart}
      />
    </section>
  )
}
