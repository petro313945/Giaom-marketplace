import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getFirstImageUrl } from '../utils/imageUtils'
import { calculateBulkDiscountTotal, getApplicableDiscountTier } from '../utils/bulkDiscount'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from './ui/badge'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function CartDrawer() {
  const { cart, removeItem, updateItem, clearCart, itemCount, loading } = useCart()
  const { toast } = useToast()
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false)

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0
    return cart.items.reduce((sum, item) => {
      const product = item.productId as any
      const basePrice = typeof product === 'object' && product?.price ? product.price : 0
      const bulkDiscountTiers = typeof product === 'object' ? product.bulkDiscountTiers : undefined
      const itemTotal = calculateBulkDiscountTotal(basePrice, item.quantity, bulkDiscountTiers)
      return sum + itemTotal
    }, 0)
  }

  const calculateOriginalTotal = () => {
    if (!cart || !cart.items) return 0
    return cart.items.reduce((sum, item) => {
      const product = item.productId as any
      const price = typeof product === 'object' && product?.price ? product.price : 0
      return sum + price * item.quantity
    }, 0)
  }

  const totalDiscount = calculateOriginalTotal() - calculateTotal()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-4 h-[calc(100vh-120px)]">
          {loading ? (
            <div className="text-center py-12">Loading cart...</div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add items to get started</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-4">
                {cart.items.map((item) => {
                  const product = item.productId as any
                  const productData = typeof product === 'object' ? product : null
                  const productName = productData?.title || 'Product'
                  const basePrice = productData?.price || 0
                  const bulkDiscountTiers = productData?.bulkDiscountTiers
                  const productImage = getFirstImageUrl(productData)
                  const productId = productData?.id || item.productId
                  const itemTotal = calculateBulkDiscountTotal(basePrice, item.quantity, bulkDiscountTiers)
                  const originalTotal = basePrice * item.quantity
                  const itemDiscount = originalTotal - itemTotal
                  const discountTier = getApplicableDiscountTier(item.quantity, bulkDiscountTiers)

                  return (
                    <div key={item.id || productId} className="flex gap-4 border-b pb-4">
                      <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" title={productName}>{productName}</h3>
                        {discountTier ? (
                          <div className="mt-1">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold">${itemTotal.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground line-through">${originalTotal.toFixed(2)}</p>
                              <Badge variant="destructive" className="text-xs">
                                {discountTier.discountPercent}% OFF
                              </Badge>
                            </div>
                            <p className="text-xs text-green-600">Save ${itemDiscount.toFixed(2)}</p>
                          </div>
                        ) : (
                          <p className="text-lg font-bold mt-1">${itemTotal.toFixed(2)}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              try {
                                await updateItem(item.id || '', item.quantity - 1)
                              } catch (error: any) {
                                toast({
                                  title: 'Error',
                                  description: error?.message || 'Failed to update cart',
                                  variant: 'destructive',
                                })
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              try {
                                await updateItem(item.id || '', item.quantity + 1)
                              } catch (error: any) {
                                toast({
                                  title: 'Error',
                                  description: error?.message || 'Failed to update cart',
                                  variant: 'destructive',
                                })
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-auto"
                            onClick={async () => {
                              try {
                                await removeItem(item.id || '')
                              } catch (error: any) {
                                toast({
                                  title: 'Error',
                                  description: error?.message || 'Failed to remove item',
                                  variant: 'destructive',
                                })
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t pt-4 space-y-4">
                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Subtotal:</span>
                    <span className="line-through text-muted-foreground">${calculateOriginalTotal().toFixed(2)}</span>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" asChild>
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setClearCartDialogOpen(true)}
                >
                  Clear Cart
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
      <AlertDialog open={clearCartDialogOpen} onOpenChange={setClearCartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await clearCart()
                  setClearCartDialogOpen(false)
                  toast({
                    title: 'Success',
                    description: 'Cart cleared successfully',
                    variant: 'default',
                  })
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error?.message || 'Failed to clear cart',
                    variant: 'destructive',
                  })
                }
              }}
            >
              Clear Cart
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
