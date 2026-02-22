import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { useCart } from '../context/CartContext'
import * as categoryService from '../services/categoryService'
import * as productService from '../services/productService'
import { getImageUrl } from '../utils/imageUtils'
import type { Product } from '../services/productService'

export default function Category() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return

      try {
        setLoading(true)
        // Fetch category info and products
        const [categoryResponse, productsResponse] = await Promise.all([
          categoryService.getProductsByCategory(slug, { limit: 20 }),
          productService.getProducts({ category: slug, limit: 20 })
        ])

        setCategory(categoryResponse.category)
        setProducts(productsResponse.products)
      } catch (error) {
        console.error('Failed to fetch category data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

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
      <div className="bg-muted py-12">
        <div className="container">
          <div className="text-center">Loading category...</div>
        </div>
      </div>
    )
  }

  const categoryName = category?.name || slug?.replace(/-/g, ' ') || 'Category'

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
        {products.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const productId = product._id || product.id
              return (
              <Link key={productId} to={`/product/${productId}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-0">
                    <img
                      src={getImageUrl(product.imageUrl)}
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
        )}
      </div>
    </>
  )
}
