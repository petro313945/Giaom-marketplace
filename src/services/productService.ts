import api from './api';

export interface Product {
  id: string;
  sellerId: string | { id: string; email: string; fullName?: string };
  title: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get all products
export const getProducts = async (params?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ProductsResponse> => {
  const response = await api.get<ProductsResponse>('/products', { params });
  return response.data;
};

// Get single product
export const getProductById = async (id: string): Promise<{ product: Product }> => {
  const response = await api.get<{ product: Product }>(`/products/${id}`);
  return response.data;
};
