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
import { Plus, Upload, X, Sparkles } from 'lucide-react'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import { uploadImage } from '../services/uploadService'
import type { ProductVariant } from '../services/productService'

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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Toggle size selection
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }

  // Toggle color selection
  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  // Generate variants from size/color combinations
  const generateVariantsFromBulk = () => {
    if (selectedSizes.length === 0 && selectedColors.length === 0) {
      setError('Please select at least one size or color')
      return
    }

    const stockValue = parseInt(bulkStock) || 0
    const basePrice = parseFloat(bulkPrice) || undefined
    const priceAdj = parseFloat(priceAdjustment) || 0

    const newVariants: ProductVariant[] = []

    if (selectedSizes.length > 0 && selectedColors.length > 0) {
      // Generate all combinations
      selectedSizes.forEach(size => {
        selectedColors.forEach(color => {
          newVariants.push({
            size,
            color,
            stock: stockValue,
            price: basePrice !== undefined ? basePrice + priceAdj : undefined
          })
        })
      })
    } else if (selectedSizes.length > 0) {
      // Only sizes
      selectedSizes.forEach(size => {
        newVariants.push({
          size,
          stock: stockValue,
          price: basePrice !== undefined ? basePrice + priceAdj : undefined
        })
      })
    } else if (selectedColors.length > 0) {
      // Only colors
      selectedColors.forEach(color => {
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
    setSelectedColors([])
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

      if (imageUrls.length === 0) {
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
        if (!data.price || parseFloat(data.price) <= 0) {
          setError('Price is required for simple products')
          setIsLoading(false)
          return
        }
        if (!data.stockQuantity || parseInt(data.stockQuantity) < 0) {
          setError('Stock quantity is required for simple products')
          setIsLoading(false)
          return
        }
      }

      // Format variants for submission (remove undefined values and empty strings)
      const formattedVariants = variants.length > 0 
        ? variants
            .map(v => ({
              size: v.size && v.size.trim() ? v.size.trim() : undefined,
              color: v.color && v.color.trim() ? v.color.trim() : undefined,
              price: v.price !== undefined && v.price > 0 ? v.price : undefined,
              stock: v.stock
            }))
            .filter(v => v.size || v.color) // Remove variants with no size or color
        : []

      await productService.createProduct({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price), // Base price is always required
        category: data.category,
        imageUrls: imageUrls,
        stockQuantity: productType === 'simple' ? parseInt(data.stockQuantity) || 0 : 0,
        variants: productType === 'variants' ? formattedVariants : [],
      })

      reset()
      setImages([])
      setUrlInputs([''])
      setVariants([])
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
            setProductType('simple')
            setSelectedSizes([])
            setSelectedColors([])
            setBulkStock('')
            setBulkPrice('')
            setPriceAdjustment('')
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
              {...register('description', { required: 'Description is required' })}
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

              {/* Bulk Variant Generation */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">Bulk Generate Variants</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select sizes and/or colors to automatically generate all combinations
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

                {/* Color Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Colors (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonColors.map(color => (
                      <Button
                        key={color}
                        type="button"
                        variant={selectedColors.includes(color) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleColor(color)}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="text"
                    placeholder="Or enter custom colors (comma-separated)"
                    onBlur={(e) => {
                      const customColors = e.target.value.split(',').map(c => c.trim()).filter(c => c)
                      if (customColors.length > 0) {
                        setSelectedColors(prev => [...prev, ...customColors.filter(c => !prev.includes(c))])
                        e.target.value = ''
                      }
                    }}
                    className="text-sm"
                  />
                </div>

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
                  disabled={selectedSizes.length === 0 && selectedColors.length === 0}
                  className="w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate {selectedSizes.length > 0 && selectedColors.length > 0 
                    ? `${selectedSizes.length * selectedColors.length} variants`
                    : selectedSizes.length > 0 
                      ? `${selectedSizes.length} size variants`
                      : selectedColors.length > 0
                        ? `${selectedColors.length} color variants`
                        : 'variants'}
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {variants.map((variant, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-2 border rounded bg-background">
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
                          <Input
                            placeholder="e.g., Red, Blue"
                            value={variant.color || ''}
                            onChange={(e) => {
                              const newVariants = [...variants]
                              newVariants[index] = { ...variant, color: e.target.value || undefined }
                              setVariants(newVariants)
                            }}
                            className="text-sm"
                          />
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
                          onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Each variant must have at least a size or color, and stock is required. Price is optional and will use base price if not set.
                  </p>
                </div>
              )}
            </div>
          )}

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
              setVariants([])
              setProductType('simple')
              setSelectedSizes([])
              setSelectedColors([])
              setBulkStock('')
              setBulkPrice('')
              setPriceAdjustment('')
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
