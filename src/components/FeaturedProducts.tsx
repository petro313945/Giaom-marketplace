import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Star } from 'lucide-react'
import { useCart } from '../context/CartContext'
import * as productService from '../services/productService'
import type { Product } from '../services/productService'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

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
    try {
      const productId = product._id || product.id
      await addItem(productId, 1)
      // Success feedback could be added here with toast
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to add to cart'
      alert(errorMessage)
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
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 p-4">
                <h4 className="font-semibold text-lg">{product.title}</h4>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">4.5</span>
                  <span className="text-sm text-muted-foreground">(0)</span>
                </div>
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
