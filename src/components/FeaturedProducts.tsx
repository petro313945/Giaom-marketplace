import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Star } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ui/use-toast'
import * as productService from '../services/productService'
import { getFirstImageUrl } from '../utils/imageUtils'
import ProductRating from './ProductRating'
import type { Product } from '../services/productService'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts({ limit: 6 })
        setProducts(response.products)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    
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
          return (
          <Link key={productId} to={`/product/${productId}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-0">
                <img
                  src={getFirstImageUrl(product)}
                  alt={product.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 p-4">
                <h4 className="font-semibold text-lg line-clamp-2" title={product.title}>{product.title}</h4>
                <ProductRating productId={productId} size="sm" showCount />
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl font-bold">${product.price}</span>
                  <Button size="sm" onClick={(e) => handleAddToCart(e, product)}>
                    Add to Cart
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </Link>
          )
        })}
      </div>
    </section>
  )
}
