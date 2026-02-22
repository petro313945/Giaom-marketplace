import api from './api';

export interface Product {
  _id: string;
  id?: string; // Alias for _id
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

// Create product (seller only)
export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export const createProduct = async (data: CreateProductData): Promise<{ message: string; product: Product }> => {
  const response = await api.post<{ message: string; product: Product }>('/products', data);
  return response.data;
};

// Get seller's products
export const getSellerProducts = async (): Promise<Product[]> => {
  const response = await api.get<{ products: Product[] }>('/products/seller/my-products');
  return response.data.products;
};

// Get all products (admin only)
export const getAllProducts = async (): Promise<Product[]> => {
  const response = await api.get<{ products: Product[] }>('/products/admin/all');
  return response.data.products;
};

// Approve product (admin only)
export const approveProduct = async (id: string): Promise<{ message: string; product: Product }> => {
  const response = await api.put<{ message: string; product: Product }>(`/products/${id}/approve`);
  return response.data;
};

// Reject product (admin only)
export const rejectProduct = async (id: string): Promise<{ message: string; product: Product }> => {
  const response = await api.put<{ message: string; product: Product }>(`/products/${id}/reject`);
  return response.data;
};
