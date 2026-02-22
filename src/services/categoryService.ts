import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
  isActive: boolean;
}

export interface CategoriesResponse {
  categories: Category[];
  count: number;
}

// Get all categories
export const getCategories = async (): Promise<CategoriesResponse> => {
  const response = await api.get<CategoriesResponse>('/categories');
  return response.data;
};

// Get products by category
export const getProductsByCategory = async (
  slug: string,
  params?: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) => {
  const response = await api.get(`/categories/${slug}/products`, { params });
  return response.data;
};
