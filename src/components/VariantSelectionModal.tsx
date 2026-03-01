import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getFirstImageUrl } from '../utils/imageUtils'
import type { Product, ProductVariant } from '../services/productService'

interface VariantSelectionModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: (variant?: { size?: string; color?: string }) => void
}

// Helper function to calculate delivery dates
const getDeliveryDates = () => {
  const today = new Date()
  const fastest = new Date(today)
  fastest.setDate(today.getDate() + 2) // Fastest delivery: 2 days
  
  const standard = new Date(today)
  standard.setDate(today.getDate() + 4) // Standard delivery: 4 days
  
  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
  }
  
  return {
    fastest: formatDate(fastest),
    standard: formatDate(standard)
  }
}

export default function VariantSelectionModal({
  product,
  open,
  onOpenChange,
  onAddToCart
}: VariantSelectionModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [deliveryDates, setDeliveryDates] = useState(getDeliveryDates())

  // Get unique sizes from variants
  const sizes = useMemo(() => Array.from(new Set(
    product?.variants
      ?.filter(v => v.size)
      .map(v => v.size)
      .filter((size): size is string => !!size) || []
  )), [product?.variants])

  // Get all colors (for initial display when no size is selected)
  const allColors = useMemo(() => Array.from(new Set(
    product?.variants
      ?.filter(v => v.color)
      .map(v => v.color)
      .filter((color): color is string => !!color) || []
  )), [product?.variants])

  // Get available colors - filter by selected size if size is selected
  const availableColors = useMemo(() => {
    if (!product?.variants) return []
    
    let filtered = product.variants
    
    // If size is selected, only show colors available for that size
    if (selectedSize) {
      filtered = filtered.filter(v => v.size === selectedSize && v.stock > 0)
    }
    
    return Array.from(new Set(
      filtered
        .filter(v => v.color)
        .map(v => v.color)
        .filter((color): color is string => !!color)
    ))
  }, [product?.variants, selectedSize])

  // When size changes, update available colors and reset color if not available
  useEffect(() => {
    if (selectedSize && selectedColor && !availableColors.includes(selectedColor)) {
      // Reset color if current selection is not available for selected size
      setSelectedColor('')
    }
  }, [selectedSize, selectedColor, availableColors])

  // Filter available variants based on selected size and color
  useEffect(() => {
    if (!product?.variants) {
      setAvailableVariants([])
      setSelectedVariant(null)
      return
    }

    let filtered = product.variants

    // Filter by color if selected
    if (selectedColor) {
      filtered = filtered.filter(v => v.color === selectedColor)
    }

    // Filter by size if selected
    if (selectedSize) {
      filtered = filtered.filter(v => v.size === selectedSize)
    }

    setAvailableVariants(filtered)

    // Auto-select first available variant
    // If sizes exist, wait for size selection
    // If only colors exist, select immediately when color is selected
    if (sizes.length > 0 && !selectedSize) {
      // Wait for size selection
      setSelectedVariant(null)
    } else if (filtered.length > 0) {
      // Select first available variant
      setSelectedVariant(filtered[0])
    } else {
      setSelectedVariant(null)
    }
  }, [product, selectedSize, selectedColor, sizes.length])

  // Reset when modal opens/closes or product changes
  useEffect(() => {
    if (open && product) {
      setDeliveryDates(getDeliveryDates())
      
      // Compute defaults from current product state
      const productSizes = Array.from(new Set(
        product.variants
          ?.filter(v => v.size)
          .map(v => v.size)
          .filter((size): size is string => !!size) || []
      ))
      
      // Reset selections when opening with a new product
      const defaultSize = productSizes.length > 0 ? productSizes[0] : ''
      setSelectedSize(defaultSize)
      
      // Compute available colors for the default size (if size exists)
      let availableColorsForSize: string[] = []
      if (defaultSize) {
        availableColorsForSize = Array.from(new Set(
          product.variants
            ?.filter(v => v.size === defaultSize && v.stock > 0 && v.color)
            .map(v => v.color)
            .filter((color): color is string => !!color) || []
        ))
      } else {
        // If no sizes, use all colors
        availableColorsForSize = Array.from(new Set(
          product.variants
            ?.filter(v => v.color)
            .map(v => v.color)
            .filter((color): color is string => !!color) || []
        ))
      }
      
      // Set default color to "Black" if available, otherwise first color
      const defaultColor = availableColorsForSize.find(c => c.toLowerCase() === 'black') || (availableColorsForSize.length > 0 ? availableColorsForSize[0] : '')
      setSelectedColor(defaultColor)
    } else if (!open) {
      // Reset when closing
      setSelectedSize('')
      setSelectedColor('')
      setSelectedVariant(null)
    }
  }, [open, product?._id || product?.id])

  if (!product) return null

  const productId = product._id || product.id
  const displayPrice = selectedVariant?.price ?? product.price
  const deliveryCost = 10.26 // Mock delivery cost
  const currency = '$' // USD

  // Check if variant selection is complete
  const isVariantComplete = () => {
    if (!product.variants || product.variants.length === 0) return true
    
    // If only colors exist, color selection is enough
    if (sizes.length === 0 && allColors.length > 0) {
      return !!selectedColor
    }
    
    // If only sizes exist, size selection is enough
    if (allColors.length === 0 && sizes.length > 0) {
      return !!selectedSize
    }
    
    // If both exist, both need to be selected
    if (sizes.length > 0 && allColors.length > 0) {
      return !!selectedSize && !!selectedColor
    }
    
    return true
  }

  const handleAddToCart = () => {
    const variant: { size?: string; color?: string } = {}
    if (selectedSize) variant.size = selectedSize
    if (selectedColor) variant.color = selectedColor
    
    onAddToCart(Object.keys(variant).length > 0 ? variant : undefined)
    onOpenChange(false)
  }

  const canAddToCart = isVariantComplete() && selectedVariant && selectedVariant.stock > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg invisible">Select Variant</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Image and Name */}
          <div className="flex gap-3">
            <img
              src={getFirstImageUrl(product)}
              alt={product.title}
              className="w-20 h-20 object-contain rounded flex-shrink-0 bg-muted"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.title}</h3>
              <Link
                to={`/product/${productId}`}
                className="text-xs text-blue-600 hover:underline"
                onClick={() => onOpenChange(false)}
              >
                See all item details
              </Link>
            </div>
          </div>

          {/* Color Selector - Show first */}
          {availableColors.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Color: {selectedColor || 'Select color'}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {availableColors.map(color => (
                  <Button
                    key={color}
                    type="button"
                    variant={selectedColor === color ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector - Show after color */}
          {sizes.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Size: {selectedSize || 'Select size'}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map(size => {
                  // Check if this size is available (considering color if selected)
                  const isAvailable = product.variants?.some(
                    v => v.size === size && 
                    (!selectedColor || v.color === selectedColor) && 
                    v.stock > 0
                  )
                  return (
                    <Button
                      key={size}
                      type="button"
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price and Delivery Info */}
          <div className="border-t pt-3 space-y-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{currency}{displayPrice.toFixed(2)}</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <div>
                {currency}{deliveryCost.toFixed(2)} delivery {deliveryDates.standard}
              </div>
              <div className="text-green-600">
                Or fastest delivery {deliveryDates.fastest}
              </div>
            </div>
          </div>

          {/* Stock Status */}
          {selectedVariant && (
            <div className="text-xs">
              {selectedVariant.stock > 0 ? (
                <span className="text-green-600">
                  In Stock ({selectedVariant.stock} available)
                </span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="flex-1"
            size="sm"
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
