import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as cartService from '../services/cartService';
import * as productService from '../services/productService';
import type { Cart } from '../services/cartService';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, quantity?: number, variant?: { size?: string; color?: string }) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'guestCart';

// Helper functions for guest cart
const getGuestCart = (): Cart | null => {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const saveGuestCart = (cart: Cart | null) => {
  if (cart) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } else {
    localStorage.removeItem(GUEST_CART_KEY);
  }
};

// Inner component that uses AuthContext
function CartProviderInner({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication state from localStorage and token
  const checkAuth = () => {
    const token = localStorage.getItem('accessToken');
    return !!token;
  };

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Authenticated user - fetch from API
        const response = await cartService.getCart();
        setCart(response.cart);
        // Clear guest cart when user logs in
        localStorage.removeItem(GUEST_CART_KEY);
      } else {
        // Guest user - load from localStorage
        const guestCart = getGuestCart();
        setCart(guestCart);
      }
    } catch (error) {
      // User not authenticated or cart not found
      // Try to load guest cart as fallback
      const guestCart = getGuestCart();
      setCart(guestCart);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  // Listen to storage events for auth state changes (login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        if (e.newValue) {
          // User logged in, fetch cart from database (cart persists across sessions)
          fetchCart();
        } else {
          // User logged out, load guest cart from localStorage
          const guestCart = getGuestCart();
          setCart(guestCart);
          setLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen to custom event for same-tab auth changes
    const handleAuthChange = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // User logged in, restore cart from database
        fetchCart();
      } else {
        // User logged out, load guest cart from localStorage
        const guestCart = getGuestCart();
        setCart(guestCart);
        setLoading(false);
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const addItem = async (productId: string, quantity: number = 1, variant?: { size?: string; color?: string }) => {
    const isAuthenticated = checkAuth();
    
    if (isAuthenticated) {
      // Authenticated user - use API
      try {
        const response = await cartService.addToCart(productId, quantity, variant);
        setCart(response.cart);
      } catch (error) {
        console.error('Failed to add item to cart:', error);
        throw error;
      }
    } else {
      // Guest user - use localStorage
      try {
        // Fetch product details to get price and title
        const productResponse = await productService.getProductById(productId);
        const product = productResponse.product;
        
        // Get current guest cart or create new one
        let guestCart = getGuestCart();
        if (!guestCart) {
          guestCart = {
            id: 'guest-cart',
            userId: 'guest',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        
        // Check if item already exists in cart
        const existingItemIndex = guestCart.items.findIndex(item => {
          const productMatch = (typeof item.productId === 'string' ? item.productId : (item.productId as any).id) === productId;
          if (!variant || (!variant.size && !variant.color)) {
            return productMatch && !item.variant;
          }
          if (!productMatch) return false;
          if (!item.variant) return false;
          const sizeMatch = !variant.size || item.variant.size === variant.size;
          const colorMatch = !variant.color || item.variant.color === variant.color;
          return sizeMatch && colorMatch;
        });
        
        if (existingItemIndex > -1) {
          // Update quantity
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          guestCart.items.push({
            id: `guest-item-${Date.now()}-${Math.random()}`,
            productId: {
              id: product.id || product._id || '',
              title: product.title,
              price: product.price,
              imageUrl: product.imageUrl || product.imageUrls?.[0],
            },
            quantity,
            variant: variant && (variant.size || variant.color) ? variant : undefined,
          });
        }
        
        guestCart.updatedAt = new Date().toISOString();
        saveGuestCart(guestCart);
        setCart(guestCart);
      } catch (error) {
        console.error('Failed to add item to guest cart:', error);
        throw error;
      }
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item instead
      return removeItem(itemId);
    }
    
    const isAuthenticated = checkAuth();
    
    if (isAuthenticated) {
      // Authenticated user - use API
      try {
        const response = await cartService.updateCartItem(itemId, quantity);
        setCart(response.cart);
      } catch (error) {
        console.error('Failed to update cart item:', error);
        throw error;
      }
    } else {
      // Guest user - update in localStorage
      const guestCart = getGuestCart();
      if (!guestCart) return;
      
      const itemIndex = guestCart.items.findIndex(item => item.id === itemId);
      if (itemIndex > -1) {
        guestCart.items[itemIndex].quantity = quantity;
        guestCart.updatedAt = new Date().toISOString();
        saveGuestCart(guestCart);
        setCart(guestCart);
      }
    }
  };

  const removeItem = async (itemId: string) => {
    const isAuthenticated = checkAuth();
    
    if (isAuthenticated) {
      // Authenticated user - use API
      try {
        const response = await cartService.removeFromCart(itemId);
        setCart(response.cart);
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
        throw error;
      }
    } else {
      // Guest user - remove from localStorage
      const guestCart = getGuestCart();
      if (!guestCart) return;
      
      guestCart.items = guestCart.items.filter(item => item.id !== itemId);
      guestCart.updatedAt = new Date().toISOString();
      saveGuestCart(guestCart);
      setCart(guestCart);
    }
  };

  const clearCart = async () => {
    const isAuthenticated = checkAuth();
    
    if (isAuthenticated) {
      // Authenticated user - use API
      try {
        const response = await cartService.clearCart();
        setCart(response.cart);
      } catch (error) {
        console.error('Failed to clear cart:', error);
        // Even if API call fails, clear local state
        setCart(null);
      }
    } else {
      // Guest user - clear localStorage
      saveGuestCart(null);
      setCart(null);
    }
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const value: CartContextType = {
    cart,
    loading,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Outer provider component
export function CartProvider({ children }: { children: ReactNode }) {
  return <CartProviderInner>{children}</CartProviderInner>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
