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
  imageUrl: string
}

export default function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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
      setSelectedFile(file)
      setError(null)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      // Clear imageUrl when file is selected
      setValue('imageUrl', '')
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
      let finalImageUrl = data.imageUrl || '/placeholder.svg'

      // Upload image if file is selected
      if (selectedFile) {
        setIsUploading(true)
        try {
          const uploadResponse = await uploadImage(selectedFile)
          finalImageUrl = uploadResponse.imageUrl
        } catch (uploadErr: any) {
          setError(uploadErr.response?.data?.error || uploadErr.message || 'Failed to upload image')
          setIsLoading(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      await productService.createProduct({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        imageUrl: finalImageUrl,
      })

      reset()
      setSelectedFile(null)
      setImagePreview(null)
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
        <CardDescription>Create a new product listing</CardDescription>
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

          <div className="space-y-2">
            <Label htmlFor="image">Product Image</Label>
            <div className="space-y-2">
              {/* File Upload */}
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
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
                  {selectedFile ? 'Change Image' : 'Upload Image'}
                </Button>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative w-full max-w-xs">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md border"
                  />
                </div>
              )}

              {/* Or use URL */}
              <div className="text-sm text-muted-foreground">OR</div>
              <Input
                id="imageUrl"
                type="url"
                {...register('imageUrl')}
                placeholder="https://example.com/image.jpg"
                disabled={!!selectedFile}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Remove uploaded image to use URL instead
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || isUploading}>
              {isUploading ? 'Uploading...' : isLoading ? 'Adding...' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setIsOpen(false)
              reset()
              setSelectedFile(null)
              setImagePreview(null)
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
