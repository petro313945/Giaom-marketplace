import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus } from 'lucide-react'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import type { Category } from '../services/categoryService'

interface AddProductFormData {
  title: string
  description: string
  price: string
  category: string
  imageUrl?: string
}

interface AddProductFormProps {
  onProductAdded?: () => void
}

export default function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AddProductFormData>()

  const selectedCategory = watch('category')

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

  const onSubmit = async (data: AddProductFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      await productService.createProduct({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        imageUrl: data.imageUrl || '/placeholder.svg',
      })

      reset()
      setIsOpen(false)
      if (onProductAdded) {
        onProductAdded()
      }
    } catch (error: any) {
      setError(error?.message || error?.response?.data?.error || 'Failed to add product')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Product
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>Create a new product listing</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Product Title</Label>
            <Input
              id="title"
              placeholder="Product name"
              {...register('title', { required: 'Product title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="99.99"
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id || category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://..."
              {...register('imageUrl')}
            />
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setIsOpen(false)
              reset()
              setError(null)
            }}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
