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
import { Plus, Upload, X, Sparkles, Percent } from 'lucide-react'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import { uploadImage } from '../services/uploadService'
import type { ProductVariant, BulkDiscountTier } from '../services/productService'

interface AddProductFormProps {
  onProductAdded?: () => void
}

interface ProductFormData {
  title: string
  description: string
  price: string
  category: string
  stockQuantity: string
}

interface ImageItem {
  id: string
  type: 'file' | 'url'
  file?: File
  url?: string
  preview?: string
}

type ProductType = 'simple' | 'variants'

export default function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [urlInputs, setUrlInputs] = useState<string[]>([''])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [productType, setProductType] = useState<ProductType>('simple')
  
  // Bulk variant generation state
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [bulkStock, setBulkStock] = useState<string>('')
  const [bulkPrice, setBulkPrice] = useState<string>('')
  const [priceAdjustment, setPriceAdjustment] = useState<string>('')
  
  // Bulk discount tiers state
  const [discountTiers, setDiscountTiers] = useState<BulkDiscountTier[]>([])
  
  // Color images state - maps color name to array of ImageItem (new: images per color, not per variant)
  const [colorImages, setColorImages] = useState<Map<string, ImageItem[]>>(new Map())
  // Color URL input refs - maps color name to URL input element
  const colorUrlInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorFileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProductFormData>()
  const selectedCategory = watch('category')
  
  // Common size and color options
  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const commonColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Gray', 'Brown', 'Navy']

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

  // Handle color image file selection
  const handleColorFileSelect = (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
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
          setColorImages((prev) => {
            const newMap = new Map(prev)
            const existing = newMap.get(color) || []
            newMap.set(color, [...existing, imageItem])
            return newMap
          })
        }
        reader.readAsDataURL(file)
      })
      setError(null)
      const input = colorFileInputRefs.current.get(color)
      if (input) {
        input.value = ''
      }
    }
  }

  // Handle color image URL input
  const handleColorImageUrlAdd = (color: string, url: string) => {
    if (!url.trim()) return
    
    let validUrl = url.trim()
    
    // If URL doesn't start with http:// or https://, add https://
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`
    }
    
    try {
      new URL(validUrl) // Validate URL
      const imageItem: ImageItem = {
        id: Date.now().toString() + Math.random(),
        type: 'url',
        url: validUrl
      }
      setColorImages((prev) => {
        const newMap = new Map(prev)
        const existing = newMap.get(color) || []
        newMap.set(color, [...existing, imageItem])
        return newMap
      })
      setError(null)
    } catch {
      setError('Please enter a valid URL')
    }
  }

  // Remove color image
  const handleRemoveColorImage = (color: string, imageId: string) => {
    setColorImages((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(color) || []
      newMap.set(color, existing.filter((img) => img.id !== imageId))
      return newMap
    })
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

  // Toggle size selection
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }


  // Add a new color to color images
  const addColorForImages = (colorName: string) => {
    if (!colorName.trim()) return
    const color = colorName.trim()
    if (!colorImages || !colorImages.has(color)) {
      setColorImages(prev => {
        const newMap = new Map(prev)
        newMap.set(color, [])
        return newMap
      })
      // Also add to selected colors if not already there
      if (!selectedColors.includes(color)) {
        setSelectedColors(prev => [...prev, color])
      }
    }
  }

  // Remove a color from color images
  const removeColorFromImages = (color: string) => {
    setColorImages(prev => {
      const newMap = new Map(prev)
      newMap.delete(color)
      return newMap
    })
  }

  // Get all colors that have images or are in selected colors
  const getAllAvailableColors = () => {
    if (!colorImages) return selectedColors
    const colorImageColors = Array.from(colorImages.keys())
    const allColors = Array.from(new Set([...selectedColors, ...colorImageColors]))
    return allColors.sort()
  }

  // Generate variants from size/color combinations
  const generateVariantsFromBulk = () => {
    // Always use all colors that have images
    if (!colorImages) {
      setError('Color images state is not initialized')
      return
    }
    const colorsToUse = Array.from(colorImages.keys())
    
    if (selectedSizes.length === 0 && colorsToUse.length === 0) {
      setError('Please add at least one color above, or select sizes to generate size-only variants')
      return
    }

    const stockValue = parseInt(bulkStock) || 0
    const basePrice = parseFloat(bulkPrice) || undefined
    const priceAdj = parseFloat(priceAdjustment) || 0

    const newVariants: ProductVariant[] = []

    if (selectedSizes.length > 0 && colorsToUse.length > 0) {
      // Generate all size x color combinations
      selectedSizes.forEach(size => {
        colorsToUse.forEach(color => {
          newVariants.push({
            size,
            color,
            stock: stockValue,
            price: basePrice !== undefined ? basePrice + priceAdj : undefined
          })
        })
      })
    } else if (selectedSizes.length > 0) {
      // Only sizes (no colors)
      selectedSizes.forEach(size => {
        newVariants.push({
          size,
          stock: stockValue,
          price: basePrice !== undefined ? basePrice + priceAdj : undefined
        })
      })
    } else if (colorsToUse.length > 0) {
      // Only colors (no sizes)
      colorsToUse.forEach(color => {
        newVariants.push({
          color,
          stock: stockValue,
          price: basePrice !== undefined ? basePrice + priceAdj : undefined
        })
      })
    }

    setVariants(prev => [...prev, ...newVariants])
    // Reset bulk inputs
    setSelectedSizes([])
    setBulkStock('')
    setBulkPrice('')
    setPriceAdjustment('')
  }

  // Handle product type change
  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type)
    if (type === 'simple') {
      setVariants([])
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

      // Check if there are any color images (for variant products)
      // colorImages is a Map<string, ImageItem[]> state variable
      const hasColorImages = colorImages && colorImages.size > 0 && Array.from(colorImages.values()).some(imgs => imgs.length > 0)

      // Validate images: need either regular images or color images
      if (imageUrls.length === 0 && !hasColorImages) {
        setError('Please add at least one image (upload or URL)')
        setIsLoading(false)
        return
      }

      // Validate based on product type
      if (productType === 'variants') {
        if (variants.length === 0) {
          setError('Please add at least one variant for products with variants')
          setIsLoading(false)
          return
        }
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i]
          if (!variant.size && !variant.color) {
            setError(`Variant ${i + 1}: Please provide at least a size or color`)
            setIsLoading(false)
            return
          }
          if (variant.stock === undefined || isNaN(variant.stock) || variant.stock < 0) {
            setError(`Variant ${i + 1}: Stock quantity is required and must be a non-negative number`)
            setIsLoading(false)
            return
          }
          if (variant.price !== undefined && (isNaN(variant.price) || variant.price < 0)) {
            setError(`Variant ${i + 1}: Price must be a positive number if provided`)
            setIsLoading(false)
            return
          }
        }
      } else {
        // Simple product: require base price and stock
        const priceValue = parseFloat(data.price)
        if (!data.price || isNaN(priceValue) || priceValue <= 0) {
          setError('Price is required and must be a positive number for simple products')
          setIsLoading(false)
          return
        }
        const stockValue = parseInt(data.stockQuantity)
        if (!data.stockQuantity || isNaN(stockValue) || stockValue < 0) {
          setError('Stock quantity is required and must be a non-negative number for simple products')
          setIsLoading(false)
          return
        }
      }

      // Upload color images (images per color, not per variant)
      const colorImageUrls: { [color: string]: string[] } = {}
      if (colorImages && colorImages.size > 0) {
        setIsUploading(true)
        try {
          for (const [color, images] of colorImages.entries()) {
            const urls: string[] = []
            
            // Upload file images
            const fileImages = images.filter((img) => img.type === 'file' && img.file)
            for (const imageItem of fileImages) {
              if (imageItem.file) {
                const uploadResponse = await uploadImage(imageItem.file)
                urls.push(uploadResponse.imageUrl)
              }
            }
            
            // Add URL images
            const urlImages = images.filter((img) => img.type === 'url' && img.url)
            urlImages.forEach((img) => {
              if (img.url) urls.push(img.url)
            })
            
            if (urls.length > 0) {
              colorImageUrls[color] = urls
            }
          }
        } catch (uploadErr: any) {
          setError(uploadErr.response?.data?.error || uploadErr.message || 'Failed to upload color images')
          setIsLoading(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      // Format variants for submission (remove undefined values and empty strings)
      const formattedVariants = variants.length > 0 
        ? variants
            .map((v) => ({
              size: v.size && v.size.trim() ? v.size.trim() : undefined,
              color: v.color && v.color.trim() ? v.color.trim() : undefined,
              price: v.price !== undefined && v.price > 0 ? v.price : undefined,
              stock: v.stock
            }))
            .filter(v => v.size || v.color) // Remove variants with no size or color
        : []

      // Validate price before submission
      const priceValue = parseFloat(data.price)
      if (isNaN(priceValue) || priceValue <= 0) {
        setError('Price must be a valid positive number')
        setIsLoading(false)
        return
      }

      // Prepare product data
      const productData: any = {
        title: data.title.trim(),
        description: data.description.trim(),
        price: priceValue,
        category: data.category,
        imageUrls: imageUrls, // Always send as array (can be empty)
        stockQuantity: productType === 'simple' ? parseInt(data.stockQuantity) || 0 : 0,
        variants: productType === 'variants' ? formattedVariants : [],
      }

      // Add optional fields only if they have values
      if (Object.keys(colorImageUrls).length > 0) {
        productData.colorImages = colorImageUrls
      }
      if (discountTiers.length > 0) {
        productData.bulkDiscountTiers = discountTiers
      }

      await productService.createProduct(productData)

      reset()
      setImages([])
      setUrlInputs([''])
      setVariants([])
      setColorImages(new Map())
      setDiscountTiers([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsOpen(false)
      onProductAdded?.()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Product
      </Button>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            reset()
            setImages([])
            setUrlInputs([''])
            setVariants([])
            setColorImages(new Map())
            setProductType('simple')
            setSelectedSizes([])
            setSelectedColors([])
            setBulkStock('')
            setBulkPrice('')
            setPriceAdjustment('')
            setDiscountTiers([])
            setError(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Product</SheetTitle>
            <SheetDescription>Create a new product listing with multiple images</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
              {...register('description', { 
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' },
                maxLength: { value: 2000, message: 'Description must be less than 2000 characters' }
              })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Base Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { required: 'Price is required', min: { value: 0.01, message: 'Price must be greater than 0' } })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
              {productType === 'variants' && (
                <p className="text-xs text-muted-foreground">Base price used if variant price is not set</p>
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

          {/* Product Type Selection */}
          <div className="space-y-3">
            <Label>Product Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={productType === 'simple' ? 'default' : 'outline'}
                onClick={() => handleProductTypeChange('simple')}
                className="flex-1"
              >
                Simple Product
              </Button>
              <Button
                type="button"
                variant={productType === 'variants' ? 'default' : 'outline'}
                onClick={() => handleProductTypeChange('variants')}
                className="flex-1"
              >
                Product with Variants
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {productType === 'simple' 
                ? 'Single product with one price and stock level'
                : 'Product with multiple variants (sizes, colors, etc.)'}
            </p>
          </div>

          {/* Simple Product: Stock Quantity */}
          {productType === 'simple' && (
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                step="1"
                {...register('stockQuantity', { 
                  required: 'Stock quantity is required', 
                  min: { value: 0, message: 'Stock quantity cannot be negative' },
                  valueAsNumber: true
                })}
              />
              {errors.stockQuantity && (
                <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
              )}
            </div>
          )}

          {/* Product Variants Section */}
          {productType === 'variants' && (
            <div className="space-y-4">
              {/* Colors & Images Section - Unified */}
              <div className="border rounded-lg p-4 space-y-4 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <Label className="font-semibold">Colors & Images</Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add colors and their images. All colors you add here will be used for variants.
                </p>
                
                {/* Add New Color Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter color name (e.g., Red, Blue, Black)"
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const colorName = e.currentTarget.value.trim()
                        if (colorName) {
                          addColorForImages(colorName)
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      if (input && input.value.trim()) {
                        addColorForImages(input.value.trim())
                        input.value = ''
                      }
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Color
                  </Button>
                </div>

                {/* Quick Color Buttons */}
                <div className="space-y-2">
                  <Label className="text-xs">Quick Add Colors</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonColors.map(color => (
                      <Button
                        key={color}
                        type="button"
                        variant={colorImages?.has(color) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (!colorImages?.has(color)) {
                            addColorForImages(color)
                          }
                        }}
                        className="text-xs"
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Images List */}
                {colorImages && Array.from(colorImages.keys()).length > 0 && (
                  <div className="space-y-3 border-t pt-3">
                    {Array.from(colorImages.keys()).map(color => {
                      const colorImgs = colorImages.get(color) || []
                      return (
                        <div key={color} className="border rounded-lg p-3 space-y-2 bg-background">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">{color}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColorFromImages(color)}
                              className="text-destructive text-xs h-6"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {colorImgs.map((img) => (
                              <div key={img.id} className="relative w-20 h-20 border rounded overflow-hidden bg-muted">
                                <img
                                  src={img.preview || img.url}
                                  alt={`${color} preview`}
                                  className="w-full h-full object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-0 right-0 h-6 w-6 p-0 bg-destructive/80 hover:bg-destructive text-white"
                                  onClick={() => handleRemoveColorImage(color, img.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              ref={(el) => {
                                if (el) {
                                  colorFileInputRefs.current.set(color, el)
                                } else {
                                  colorFileInputRefs.current.delete(color)
                                }
                              }}
                              onChange={(e) => handleColorFileSelect(color, e)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => colorFileInputRefs.current.get(color)?.click()}
                              className="text-xs"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Upload Images
                            </Button>
                            <Input
                              type="url"
                              placeholder="Or paste image URL"
                              className="text-xs flex-1"
                              ref={(el) => {
                                if (el) {
                                  colorUrlInputRefs.current.set(color, el)
                                } else {
                                  colorUrlInputRefs.current.delete(color)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const url = e.currentTarget.value.trim()
                                  if (url) {
                                    handleColorImageUrlAdd(color, url)
                                    e.currentTarget.value = ''
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = colorUrlInputRefs.current.get(color)
                                if (input && input.value.trim()) {
                                  handleColorImageUrlAdd(color, input.value.trim())
                                  input.value = ''
                                }
                              }}
                              className="text-xs"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>Product Variants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVariants([...variants, { stock: 0 }])}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Single Variant
                </Button>
              </div>

              {/* Simplified Variant Generation */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">Generate Variants</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select sizes to generate variants. All colors you added above will be used automatically.
                </p>

                {/* Size Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Sizes (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonSizes.map(size => (
                      <Button
                        key={size}
                        type="button"
                        variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleSize(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="text"
                    placeholder="Or enter custom sizes (comma-separated)"
                    onBlur={(e) => {
                      const customSizes = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      if (customSizes.length > 0) {
                        setSelectedSizes(prev => [...prev, ...customSizes.filter(s => !prev.includes(s))])
                        e.target.value = ''
                      }
                    }}
                    className="text-sm"
                  />
                </div>

                {/* Show which colors will be used */}
                {colorImages && Array.from(colorImages.keys()).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Colors to use (from above)</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(colorImages.keys()).map(color => (
                        <div
                          key={color}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium"
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bulk Stock and Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Stock per Variant *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={bulkStock}
                      onChange={(e) => setBulkStock(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Base Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="From product"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price Adjustment ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="±0.00"
                      value={priceAdjustment}
                      onChange={(e) => setPriceAdjustment(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={generateVariantsFromBulk}
                  disabled={selectedSizes.length === 0 && (!colorImages || colorImages.size === 0)}
                  className="w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate {(() => {
                    const colorsToUse = colorImages ? Array.from(colorImages.keys()) : []
                    if (selectedSizes.length > 0 && colorsToUse.length > 0) {
                      return `${selectedSizes.length * colorsToUse.length} variants`
                    } else if (selectedSizes.length > 0) {
                      return `${selectedSizes.length} size variants`
                    } else if (colorsToUse.length > 0) {
                      return `${colorsToUse.length} color variants`
                    }
                    return 'variants'
                  })()}
                </Button>
              </div>

              {/* Generated Variants List */}
              {variants.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Variants ({variants.length})</Label>
                    {variants.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVariants([])}
                        className="text-destructive text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {variants.map((variant, index) => {
                      return (
                        <div key={index} className="border rounded-lg p-3 bg-background space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                            <div className="space-y-1">
                              <Label className="text-xs">Size</Label>
                              <Input
                                placeholder="e.g., S, M, L"
                                value={variant.size || ''}
                                onChange={(e) => {
                                  const newVariants = [...variants]
                                  newVariants[index] = { ...variant, size: e.target.value || undefined }
                                  setVariants(newVariants)
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Color</Label>
                              <div className="flex gap-1">
                                {getAllAvailableColors().length > 0 ? (
                                  <Select
                                    value={variant.color || undefined}
                                    onValueChange={(value) => {
                                      const newVariants = [...variants]
                                      newVariants[index] = { ...variant, color: value || undefined }
                                      setVariants(newVariants)
                                    }}
                                  >
                                    <SelectTrigger className="text-xs h-9 flex-1">
                                      <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAllAvailableColors().map(color => (
                                        <SelectItem key={color} value={color}>
                                          {color} {colorImages?.has(color) && '📷'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : null}
                                <Input
                                  placeholder={getAllAvailableColors().length > 0 ? "Or type custom" : "Enter color"}
                                  value={variant.color || ''}
                                  onChange={(e) => {
                                    const newVariants = [...variants]
                                    newVariants[index] = { ...variant, color: e.target.value || undefined }
                                    setVariants(newVariants)
                                  }}
                                  className="text-xs flex-1"
                                  onBlur={(e) => {
                                    const color = e.target.value.trim()
                                    if (color && !colorImages?.has(color)) {
                                      addColorForImages(color)
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Price ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Base price"
                                value={variant.price || ''}
                                onChange={(e) => {
                                  const newVariants = [...variants]
                                  newVariants[index] = { 
                                    ...variant, 
                                    price: e.target.value ? parseFloat(e.target.value) : undefined 
                                  }
                                  setVariants(newVariants)
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Stock *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={variant.stock}
                                onChange={(e) => {
                                  const newVariants = [...variants]
                                  newVariants[index] = { ...variant, stock: parseInt(e.target.value) || 0 }
                                  setVariants(newVariants)
                                }}
                                className="text-sm"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setVariants(variants.filter((_, i) => i !== index))
                              }}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Each variant must have at least a size or color, and stock is required. Price is optional and will use base price if not set.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bulk Discount Tiers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                <Label>Bulk Discount Tiers</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDiscountTiers([...discountTiers, { minQuantity: 1, discountPercent: 0 }])}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Discount Tier
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Set quantity-based discounts. Customers get the best applicable discount based on quantity purchased.
            </p>
            
            {discountTiers.length > 0 && (
              <div className="space-y-2 border rounded-lg p-4">
                <div className="space-y-3">
                  {discountTiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-2 border rounded bg-background">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="e.g., 5"
                          value={tier.minQuantity}
                          onChange={(e) => {
                            const newTiers = [...discountTiers]
                            newTiers[index] = { ...tier, minQuantity: parseInt(e.target.value) || 1 }
                            setDiscountTiers(newTiers)
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Discount % *</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="e.g., 10"
                          value={tier.discountPercent}
                          onChange={(e) => {
                            const newTiers = [...discountTiers]
                            newTiers[index] = { ...tier, discountPercent: parseFloat(e.target.value) || 0 }
                            setDiscountTiers(newTiers)
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDiscountTiers(discountTiers.filter((_, i) => i !== index))}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  * Minimum quantity must be at least 1. Discount percentage must be between 0 and 100.
                </p>
              </div>
            )}
          </div>

          {/* Product Images - Only show if product has no colors */}
          {!(productType === 'variants' && ((colorImages && colorImages.size > 0) || variants.some(v => v.color))) && (
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
                          className="w-full h-32 object-contain rounded-md border bg-muted"
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
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || isUploading}>
              {isUploading ? 'Uploading...' : isLoading ? 'Adding...' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setIsOpen(false)
              reset()
              setImages([])
              setUrlInputs([''])
              setVariants([])
              setColorImages(new Map())
              setProductType('simple')
              setSelectedSizes([])
              setSelectedColors([])
              setBulkStock('')
              setBulkPrice('')
              setPriceAdjustment('')
              setDiscountTiers([])
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}>
              Cancel
            </Button>
          </div>
        </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
