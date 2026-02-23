import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Upload, X } from 'lucide-react'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import { uploadImage } from '../services/uploadService'

interface AddProductFormProps {
  onProductAdded?: () => void
}

interface ProductFormData {
  title: string
  description: string
  price: string
  category: string
}

interface ImageItem {
  id: string
  type: 'file' | 'url'
  file?: File
  url?: string
  preview?: string
}

export default function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [urlInputs, setUrlInputs] = useState<string[]>([''])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProductFormData>()
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages: ImageItem[] = []
      Array.from(files).forEach((file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select image files only')
          return
        }
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size must be less than 5MB')
          return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
          const imageItem: ImageItem = {
            id: Date.now().toString() + Math.random(),
            type: 'file',
            file,
            preview: reader.result as string
          }
          setImages((prev) => [...prev, imageItem])
        }
        reader.readAsDataURL(file)
      })
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleAddUrlInput = () => {
    setUrlInputs((prev) => [...prev, ''])
  }

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urlInputs]
    newUrls[index] = value
    setUrlInputs(newUrls)
  }

  const handleRemoveUrlInput = (index: number) => {
    if (urlInputs.length > 1) {
      setUrlInputs((prev) => prev.filter((_, i) => i !== index))
    } else {
      setUrlInputs([''])
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    if (!data.category) {
      setError('Please select a category')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const imageUrls: string[] = []

      // Upload files first
      if (images.filter((img) => img.type === 'file').length > 0) {
        setIsUploading(true)
        try {
          const fileImages = images.filter((img) => img.type === 'file' && img.file)
          for (const imageItem of fileImages) {
            if (imageItem.file) {
              const uploadResponse = await uploadImage(imageItem.file)
              imageUrls.push(uploadResponse.imageUrl)
            }
          }
        } catch (uploadErr: any) {
          setError(uploadErr.response?.data?.error || uploadErr.message || 'Failed to upload images')
          setIsLoading(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      // Add URL images
      const validUrls = urlInputs.filter((url) => url.trim() !== '')
      imageUrls.push(...validUrls)

      if (imageUrls.length === 0) {
        setError('Please add at least one image (upload or URL)')
        setIsLoading(false)
        return
      }

      await productService.createProduct({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        imageUrls: imageUrls,
      })

      reset()
      setImages([])
      setUrlInputs([''])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsOpen(false)
      if (onProductAdded) {
        onProductAdded()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add product')
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
        <CardDescription>Create a new product listing with multiple images</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Product Title</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { required: 'Price is required', min: { value: 0.01, message: 'Price must be greater than 0' } })}
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
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Product Images</Label>
            
            {/* File Upload Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </Button>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(image.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* URL Input Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Image URLs</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddUrlInput}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add URL
                </Button>
              </div>
              {urlInputs.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  {urlInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUrlInput(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || isUploading}>
              {isUploading ? 'Uploading...' : isLoading ? 'Adding...' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setIsOpen(false)
              reset()
              setImages([])
              setUrlInputs([''])
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
