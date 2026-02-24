import api from './api';
import type { Product } from './productService';

export interface WishlistItem {
  id: string;
  productId: Product | string;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

// Get user's wishlist
export const getWishlist = async (): Promise<{ wishlist: Wishlist }> => {
  const response = await api.get<{ wishlist: Wishlist }>('/wishlist');
  return response.data;
};

// Add item to wishlist
export const addToWishlist = async (productId: string): Promise<{ message: string; wishlist: Wishlist }> => {
  const response = await api.post<{ message: string; wishlist: Wishlist }>('/wishlist', { productId });
  return response.data;
};

// Remove item from wishlist
export const removeFromWishlist = async (productId: string): Promise<{ message: string; wishlist: Wishlist }> => {
  const response = await api.delete<{ message: string; wishlist: Wishlist }>(`/wishlist/${productId}`);
  return response.data;
};

// Check if product is in wishlist
export const checkWishlistStatus = async (productId: string): Promise<{ inWishlist: boolean }> => {
  const response = await api.get<{ inWishlist: boolean }>(`/wishlist/check/${productId}`);
  return response.data;
};
