import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useCart } from '../context/CartContext'
import * as productService from '../services/productService'
import type { Product } from '../services/productService'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      
      try {
        setError(null)
        const response = await productService.getProductById(id)
        setProduct(response.product)
      } catch (error: any) {
        console.error('Failed to fetch product:', error)
        setError(error.response?.data?.error || 'Product not found')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = async () => {
    if (!product) return
    
    try {
      await addItem(product.id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">Loading product...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-12">
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
    <div className="container mx-auto py-12">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.title}
            className="w-full rounded-lg"
          />
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.5</span>
              </div>
              <span className="text-muted-foreground">(0 reviews)</span>
            </div>
            <p className="text-3xl font-bold">${product.price}</p>
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

          <Button 
            size="lg" 
            className="w-full md:w-auto" 
            onClick={handleAddToCart} 
            disabled={added}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {added ? "Added to Cart!" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  )
}
