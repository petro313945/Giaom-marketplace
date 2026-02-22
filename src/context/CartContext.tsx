import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as cartService from '../services/cartService';
import type { Cart, CartItem } from '../services/cartService';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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
        const response = await cartService.getCart();
        setCart(response.cart);
      } else {
        setCart(null);
      }
    } catch (error) {
      // User not authenticated or cart not found
      setCart(null);
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
          // User logged in, fetch cart
          fetchCart();
        } else {
          // User logged out, clear cart
          setCart(null);
          setLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen to custom event for same-tab auth changes
    const handleAuthChange = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        fetchCart();
      } else {
        setCart(null);
        setLoading(false);
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const addItem = async (productId: string, quantity: number = 1) => {
    if (!checkAuth()) {
      throw new Error('Please log in to add items to cart');
    }
    try {
      const response = await cartService.addToCart(productId, quantity);
      setCart(response.cart);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    if (!checkAuth()) {
      throw new Error('Please log in to update cart');
    }
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item instead
      return removeItem(itemId);
    }
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      setCart(response.cart);
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    if (!checkAuth()) {
      throw new Error('Please log in to remove items from cart');
    }
    try {
      const response = await cartService.removeFromCart(itemId);
      setCart(response.cart);
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!checkAuth()) {
      setCart(null);
      return;
    }
    try {
      const response = await cartService.clearCart();
      setCart(response.cart);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      // Even if API call fails, clear local state
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
