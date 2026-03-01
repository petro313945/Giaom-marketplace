import api from './api';

export interface ProductVariant {
  size?: string;
  color?: string;
  price?: number;
  stock: number;
}

export interface Product {
  _id: string;
  id?: string; // Alias for _id
  sellerId: string | { id: string; email: string; fullName?: string };
  title: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  imageUrls?: string[]; // Array of image URLs
  stockQuantity: number;
  variants?: ProductVariant[];
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

// Get product purchase statistics
export const getProductPurchaseStats = async (id: string): Promise<{ productId: string; purchaseCount: number; period: string }> => {
  const response = await api.get<{ productId: string; purchaseCount: number; period: string }>(`/products/${id}/purchase-stats`);
  return response.data;
};

// Create product (seller only)
export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  imageUrls?: string[]; // Array of image URLs
  stockQuantity?: number;
  variants?: ProductVariant[];
}

export const createProduct = async (data: CreateProductData): Promise<{ message: string; product: Product }> => {
  const response = await api.post<{ message: string; product: Product }>('/products', data);
  return response.data;
};

// Get seller's products (with pagination)
export const getSellerProducts = async (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<ProductsResponse> => {
  const response = await api.get<{ products: Product[]; pagination: ProductsResponse['pagination'] }>('/products/seller/my-products', { params });
  return {
    products: response.data.products,
    pagination: response.data.pagination
  };
};

// Get admin product stats (total and pending counts)
export const getAdminProductStats = async (): Promise<{ total: number; pending: number }> => {
  const response = await api.get<{ total: number; pending: number }>('/products/admin/stats');
  return response.data;
};

// Get all products (admin only, with pagination)
export const getAllProducts = async (params?: { page?: number; limit?: number; status?: string }): Promise<ProductsResponse> => {
  const response = await api.get<{ products: Product[]; pagination: ProductsResponse['pagination'] }>('/products/admin/all', { params });
  return {
    products: response.data.products,
    pagination: response.data.pagination
  };
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

// Update product (seller/owner only)
export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  imageUrls?: string[];
  stockQuantity?: number;
  variants?: ProductVariant[];
}

export const updateProduct = async (id: string, data: UpdateProductData): Promise<{ message: string; product: Product }> => {
  const response = await api.put<{ message: string; product: Product }>(`/products/${id}`, data);
  return response.data;
};

// Delete product (seller/owner only)
export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/products/${id}`);
  return response.data;
};
