import { useCart } from '../context/CartContext'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const { cart, removeItem, updateItem, clearCart, itemCount, loading } = useCart()

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0
    return cart.items.reduce((sum, item) => {
      const product = item.productId as any
      const price = typeof product === 'object' && product?.price ? product.price : 0
      return sum + price * item.quantity
    }, 0)
  }

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
                  const productPrice = productData?.price || 0
                  const productImage = productData?.imageUrl || '/placeholder.svg'
                  const productId = productData?.id || item.productId

                  return (
                    <div key={item.id || productId} className="flex gap-4 border-b pb-4">
                      <img
                        src={productImage}
                        alt={productName}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{productName}</h3>
                        <p className="text-lg font-bold mt-1">${productPrice.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              try {
                                await updateItem(item.id || '', item.quantity - 1)
                              } catch (error: any) {
                                alert(error?.message || 'Failed to update cart')
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
                                alert(error?.message || 'Failed to update cart')
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
                                alert(error?.message || 'Failed to remove item')
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
                  onClick={async () => {
                    if (confirm('Are you sure you want to clear your cart?')) {
                      try {
                        await clearCart()
                      } catch (error: any) {
                        alert(error?.message || 'Failed to clear cart')
                      }
                    }
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
