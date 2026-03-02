import api from './api';
import type { Category } from './categoryService';
import type { Product } from './productService';

export interface HomeSettingsResponse {
  featuredCategories: Category[];
  featuredProducts: Product[];
}

export interface HomeSettingsAdminResponse {
  featuredCategoryIds: string[];
  featuredProductIds: string[];
  allCategories: Category[];
  allProducts: Product[];
}

// Get home settings (public - returns featured items)
export const getHomeSettings = async (): Promise<HomeSettingsResponse> => {
  const response = await api.get<HomeSettingsResponse>('/home-settings');
  return response.data;
};

// Get home settings for admin (includes all data for selection)
export const getHomeSettingsAdmin = async (): Promise<HomeSettingsAdminResponse> => {
  const response = await api.get<HomeSettingsAdminResponse>('/home-settings/admin');
  return response.data;
};

// Update home settings (admin only)
export const updateHomeSettings = async (data: {
  featuredCategoryIds: string[];
  featuredProductIds: string[];
}): Promise<{
  message: string;
  featuredCategoryIds: string[];
  featuredProductIds: string[];
}> => {
  const response = await api.put('/home-settings/admin', data);
  return response.data;
};
