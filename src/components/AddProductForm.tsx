import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Upload, X } from 'lucide-react'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import * as uploadService from '../services/uploadService'
import { getImageUrl } from '../utils/imageUtils'
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
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      setSelectedImage(file)
      setError(null)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedImage) return

    try {
      setIsUploading(true)
      setError(null)
      const response = await uploadService.uploadImage(selectedImage)
      setUploadedImageUrl(response.imageUrl)
      setValue('imageUrl', response.imageUrl)
    } catch (error: any) {
      setError(error?.message || error?.response?.data?.error || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setUploadedImageUrl(null)
    setValue('imageUrl', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: AddProductFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // If image is selected but not uploaded, upload it first
      let imageUrl = data.imageUrl
      if (selectedImage && !uploadedImageUrl) {
        const uploadResponse = await uploadService.uploadImage(selectedImage)
        imageUrl = uploadResponse.imageUrl
      }

      await productService.createProduct({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        imageUrl: imageUrl || '/placeholder.svg',
      })

      reset()
      setSelectedImage(null)
      setImagePreview(null)
      setUploadedImageUrl(null)
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
            <Label htmlFor="image">Product Image</Label>
            <div className="space-y-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="cursor-pointer"
              />
              {selectedImage && !uploadedImageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImageUpload}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              )}
              {(imagePreview || uploadedImageUrl) && (
                <div className="relative">
                  <img
                    src={uploadedImageUrl ? getImageUrl(uploadedImageUrl) : imagePreview || ''}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Or enter image URL manually:
            </p>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://..."
              {...register('imageUrl')}
              disabled={!!uploadedImageUrl}
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
              setSelectedImage(null)
              setImagePreview(null)
              setUploadedImageUrl(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
