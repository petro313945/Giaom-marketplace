import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import * as productService from '../services/productService'
import { getImageUrl } from '../utils/imageUtils'
import type { Product } from '../services/productService'

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
    
    try {
      const productId = product._id || product.id
      await addItem(productId, 1)
      setAdded(true)
      toast({
        title: 'Added to Cart',
        description: `${product.title} has been added to your cart.`,
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
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">4.5</span>
                        <span className="text-sm text-muted-foreground">(0)</span>
                      </div>
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
