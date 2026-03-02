import api from './api';

export interface Category {
  _id: string;
  id?: string; // Alias for _id
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

// Admin CRUD operations

// Get all categories (admin - includes inactive)
export const getAllCategoriesAdmin = async (): Promise<CategoriesResponse> => {
  const response = await api.get<CategoriesResponse>('/categories/admin/all');
  return response.data;
};

// Create category (admin only)
export const createCategory = async (data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<{ message: string; category: Category }> => {
  const response = await api.post('/categories', data);
  return response.data;
};

// Update category (admin only)
export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<{ message: string; category: Category }> => {
  const response = await api.put(`/categories/${id}`, data);
  return response.data;
};

// Delete category (admin only)
export const deleteCategory = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};