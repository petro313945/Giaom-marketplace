import api from './api';

export interface CartItem {
  id: string;
  productId: string | Product;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

export interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// Get cart
export const getCart = async (): Promise<{ cart: Cart }> => {
  const response = await api.get<{ cart: Cart }>('/cart');
  return response.data;
};

// Add to cart
export const addToCart = async (
  productId: string, 
  quantity: number = 1,
  variant?: { size?: string; color?: string }
): Promise<{ message: string; cart: Cart }> => {
  const response = await api.post<{ message: string; cart: Cart }>('/cart/add', {
    productId,
    quantity,
    variant: variant && (variant.size || variant.color) ? variant : undefined,
  });
  return response.data;
};

// Update cart item
export const updateCartItem = async (itemId: string, quantity: number): Promise<{ message: string; cart: Cart }> => {
  const response = await api.put<{ message: string; cart: Cart }>(`/cart/update/${itemId}`, {
    quantity,
  });
  return response.data;
};

// Remove from cart
export const removeFromCart = async (itemId: string): Promise<{ message: string; cart: Cart }> => {
  const response = await api.delete<{ message: string; cart: Cart }>(`/cart/remove/${itemId}`);
  return response.data;
};

// Clear cart
export const clearCart = async (): Promise<{ message: string; cart: Cart }> => {
  const response = await api.delete<{ message: string; cart: Cart }>('/cart/clear');
  return response.data;
};
