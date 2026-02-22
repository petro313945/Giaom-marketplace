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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await cartService.getCart();
        setCart(response.cart);
      }
    } catch (error) {
      // User not authenticated or cart not found
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addItem = async (productId: string, quantity: number = 1) => {
    try {
      const response = await cartService.addToCart(productId, quantity);
      setCart(response.cart);
    } catch (error) {
      throw error;
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      setCart(response.cart);
    } catch (error) {
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await cartService.removeFromCart(itemId);
      setCart(response.cart);
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartService.clearCart();
      setCart(response.cart);
    } catch (error) {
      throw error;
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

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
