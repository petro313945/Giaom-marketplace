import api from './api';

export interface OrderItem {
  productId: string | Product;
  quantity: number;
  price: number;
  title: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
}

// Create order
export const createOrder = async (shippingAddress: ShippingAddress, paymentIntentId: string): Promise<{ message: string; order: Order }> => {
  const response = await api.post<{ message: string; order: Order }>('/orders', {
    shippingAddress,
    paymentIntentId,
  });
  return response.data;
};

// Get user orders
export const getUserOrders = async (): Promise<{ orders: Order[]; count: number }> => {
  const response = await api.get<{ orders: Order[]; count: number }>('/orders');
  return response.data;
};

// Get order by ID
export const getOrderById = async (id: string): Promise<{ order: Order }> => {
  const response = await api.get<{ order: Order }>(`/orders/${id}`);
  return response.data;
};

// Get seller orders
export const getSellerOrders = async (): Promise<{ orders: Order[] }> => {
  const response = await api.get<{ orders: Order[] }>('/orders/seller/my-orders');
  return response.data;
};

// Get all orders (admin only)
export const getAllOrders = async (): Promise<{ orders: Order[]; statistics: { totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number } }> => {
  const response = await api.get<{ orders: Order[]; statistics: { totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number } }>('/orders/admin/all');
  return response.data;
};

// Update order status (seller/admin)
export const updateOrderStatus = async (orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<{ message: string; order: Order }> => {
  const response = await api.put<{ message: string; order: Order }>(`/orders/${orderId}/status`, { status });
  return response.data;
};

// Update tracking number (seller/admin)
export const updateTrackingNumber = async (orderId: string, trackingNumber: string, carrier?: string): Promise<{ message: string; order: Order }> => {
  const response = await api.put<{ message: string; order: Order }>(`/orders/${orderId}/tracking`, { 
    trackingNumber,
    carrier 
  });
  return response.data;
};