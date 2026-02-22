import api from './api';

export interface OrderItem {
  productId: string | Product;
  quantity: number;
  price: number;
  title: string;
}

export interface Product {
  id: string;
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
  _id: string;
  id?: string; // Alias for _id
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  shippingAddress: ShippingAddress;
}

// Create order from cart
export const createOrder = async (data: CreateOrderData): Promise<{ message: string; order: Order }> => {
  const response = await api.post<{ message: string; order: Order }>('/orders', data);
  return response.data;
};

// Get user's orders
export const getUserOrders = async (): Promise<Order[]> => {
  const response = await api.get<{ orders: Order[]; count: number }>('/orders');
  return response.data.orders;
};

// Get order details
export const getOrderById = async (id: string): Promise<{ order: Order }> => {
  const response = await api.get<{ order: Order }>(`/orders/${id}`);
  return response.data;
};

// Get seller's orders
export const getSellerOrders = async (): Promise<Order[]> => {
  const response = await api.get<{ orders: Order[]; count: number }>('/orders/seller/my-orders');
  return response.data.orders;
};

// Update order status
export const updateOrderStatus = async (id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<{ message: string; order: Order }> => {
  const response = await api.put<{ message: string; order: Order }>(`/orders/${id}/status`, { status });
  return response.data;
};
