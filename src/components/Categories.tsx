import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from './ui/card'
import { Laptop, Shirt, Home, Dumbbell, Paintbrush, Book, ShoppingBag, Utensils } from 'lucide-react'
import * as homeSettingsService from '../services/homeSettingsService'
import type { Category } from '../services/categoryService'

// Icon mapping for categories
const iconMap: Record<string, any> = {
  electronics: Laptop,
  clothing: Shirt,
  fashion: Shirt,
  home: Home,
  'home-garden': Home,
  sports: Dumbbell,
  art: Paintbrush,
  books: Book,
  toys: ShoppingBag,
  beauty: Paintbrush,
  food: Utensils,
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await homeSettingsService.getHomeSettings()
        // Limit to 6 categories
        setCategories(response.featuredCategories.slice(0, 6))
      } catch (error) {
        console.error('Failed to fetch featured categories:', error)
        // Fallback to empty array if API fails
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="container py-12 md:py-16">
        <h3 className="text-2xl md:text-3xl font-bold mb-8">Shop by Category</h3>
        <div className="text-center">Loading categories...</div>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="container py-12 md:py-16">
        <h3 className="text-2xl md:text-3xl font-bold mb-8">Shop by Category</h3>
        <div className="text-center text-muted-foreground">No categories available yet</div>
      </section>
    )
  }

  return (
    <section className="container py-12 md:py-16">
      <h3 className="text-2xl md:text-3xl font-bold mb-8">Shop by Category</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.slice(0, 6).map((category) => {
          const Icon = iconMap[category.slug] || ShoppingBag
          const categoryId = (category as any)._id || category.id
          return (
            <Link key={categoryId} to={`/category/${category.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <Icon className="h-8 w-8" />
                  <span className="font-medium text-center">{category.name}</span>
                  <span className="text-xs text-muted-foreground">{category.productCount || 0} products</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
