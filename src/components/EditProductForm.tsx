import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import { uploadImage } from '../services/uploadService'
import { getImageUrl } from '../utils/imageUtils'
import type { Product } from '../services/productService'

interface EditProductFormProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated?: () => void
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

export default function EditProductForm({ product, open, onOpenChange, onProductUpdated }: EditProductFormProps) {
  const { toast } = useToast()
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [productData, setProductData] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [urlInputs, setUrlInputs] = useState<string[]>([''])
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

  // Fetch full product data when opening to ensure we have all imageUrls
  useEffect(() => {
    if (product && open) {
      const productId = product._id || product.id
      if (productId) {
        productService.getProductById(productId)
          .then(({ product: fullProduct }) => {
            setProductData(fullProduct)
            reset({
              title: fullProduct.title,
              description: fullProduct.description || '',
              price: fullProduct.price.toString(),
              category: fullProduct.category,
            })
            setValue('category', fullProduct.category)
            const urls = fullProduct.imageUrls && fullProduct.imageUrls.length > 0
              ? [...fullProduct.imageUrls]
              : fullProduct.imageUrl
                ? [fullProduct.imageUrl]
                : ['']
            setUrlInputs(urls)
            setImages([])
            setError(null)
          })
          .catch(() => {
            setProductData(product)
            reset({
              title: product.title,
              description: product.description || '',
              price: product.price.toString(),
              category: product.category,
            })
            setValue('category', product.category)
            const urls = product.imageUrls && product.imageUrls.length > 0
              ? [...product.imageUrls]
              : product.imageUrl
                ? [product.imageUrl]
                : ['']
            setUrlInputs(urls)
            setImages([])
            setError(null)
          })
      } else {
        setProductData(product)
        reset({
          title: product.title,
          description: product.description || '',
          price: product.price.toString(),
          category: product.category,
        })
        setValue('category', product.category)
        const urls = product.imageUrls && product.imageUrls.length > 0
          ? [...product.imageUrls]
          : product.imageUrl
            ? [product.imageUrl]
            : ['']
        setUrlInputs(urls)
        setImages([])
        setError(null)
      }
    } else {
      setProductData(null)
    }
  }, [product, open, reset, setValue])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
        const reader = new FileReader()
        reader.onloadend = () => {
          setImages((prev) => [...prev, {
            id: Date.now().toString() + Math.random(),
            type: 'file',
            file,
            preview: reader.result as string
          }])
        }
        reader.readAsDataURL(file)
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleAddUrlInput = () => setUrlInputs((prev) => [...prev, ''])
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
    const currentProduct = productData || product
    if (!currentProduct) return
    if (!data.category) {
      setError('Please select a category')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let imageUrls: string[] = []

      const fileImages = images.filter((img) => img.type === 'file' && img.file)
      if (fileImages.length > 0) {
        setIsUploading(true)
        try {
          for (const imageItem of fileImages) {
            if (imageItem.file) {
              const uploadResponse = await uploadImage(imageItem.file)
              imageUrls.push(uploadResponse.imageUrl)
            }
          }
        } catch (uploadErr: any) {
          setError(uploadErr.response?.data?.error || 'Failed to upload images')
          setIsLoading(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      const validUrls = urlInputs.filter((url) => url.trim() !== '')
      imageUrls = [...imageUrls, ...validUrls]
      // If no images from form, keep existing (user didn't change images)
      if (imageUrls.length === 0 && (currentProduct.imageUrls?.length || currentProduct.imageUrl)) {
        imageUrls = currentProduct.imageUrls?.length ? currentProduct.imageUrls : [currentProduct.imageUrl!]
      }

      await productService.updateProduct(currentProduct._id || currentProduct.id!, {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      })

      toast({
        title: 'Product Updated',
        description: 'Your product has been updated successfully.',
        variant: 'default',
      })
      onOpenChange(false)
      onProductUpdated?.()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>Update your product details</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-title">Product Title</Label>
            <Input
              id="edit-title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                {...register('price', { required: 'Price is required', min: { value: 0.01, message: 'Price must be greater than 0' } })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
            {(images.length > 0 || urlInputs.some(u => u.trim())) > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={img.preview} alt="" className="w-full h-20 object-cover rounded border" />
                    <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => handleRemoveImage(img.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {urlInputs.map((url, index) => url.trim() ? (
                  <div key={`url-${index}`} className="relative group">
                    <img src={getImageUrl(url)} alt="" className="w-full h-20 object-cover rounded border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => handleRemoveUrlInput(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null)}
              </div>
            )}
            <div className="space-y-2 mt-2">
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveUrlInput(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={handleAddUrlInput}>
                + Add URL
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading || isUploading} className="flex-1">
              {isUploading ? 'Uploading...' : isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
