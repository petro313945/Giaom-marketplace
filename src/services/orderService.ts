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
  userId?: string;
  guestEmail?: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'refunded';
  trackingNumber?: string;
  carrier?: string;
  refundRequest?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    refundAmount?: number;
    reason: string;
    createdAt: string;
    processedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
}

// Create order
export const createOrder = async (
  shippingAddress: ShippingAddress, 
  paymentIntentId: string,
  cartItems?: any[],
  email?: string
): Promise<{ message: string; order: Order }> => {
  const body: any = {
    shippingAddress,
    paymentIntentId,
  };
  
  if (cartItems) {
    body.cartItems = cartItems;
  }
  
  if (email) {
    body.email = email;
  }
  
  const response = await api.post<{ message: string; order: Order }>('/orders', body);
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

// Refund request interfaces
export interface RefundRequest {
  id: string;
  orderId: string | Order;
  userId?: string;
  guestEmail?: string;
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'damaged' | 'late_delivery' | 'other';
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  refundAmount?: number;
  adminNotes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Request refund (customer)
export const requestRefund = async (orderId: string, reason: string, description?: string): Promise<{ message: string; refundRequest: RefundRequest }> => {
  const response = await api.post<{ message: string; refundRequest: RefundRequest }>(`/orders/${orderId}/refund`, {
    reason,
    description
  });
  return response.data;
};

// Get refund requests
export const getRefundRequests = async (): Promise<{ refundRequests: RefundRequest[] }> => {
  const response = await api.get<{ refundRequests: RefundRequest[] }>('/orders/refunds');
  return response.data;
};

// Get refund request by ID
export const getRefundRequestById = async (id: string): Promise<{ refundRequest: RefundRequest }> => {
  const response = await api.get<{ refundRequest: RefundRequest }>(`/orders/refunds/${id}`);
  return response.data;
};

// Update refund request status (admin only)
export const updateRefundRequestStatus = async (
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  adminNotes?: string
): Promise<{ message: string; refundRequest: RefundRequest }> => {
  const response = await api.put<{ message: string; refundRequest: RefundRequest }>(`/orders/refunds/${id}/status`, {
    status,
    adminNotes
  });
  return response.data;
};

// Process refund (admin only - actually process Stripe refund)
export const processRefund = async (id: string): Promise<{ message: string; refundRequest: RefundRequest; refund: { id: string; amount: number; status: string } }> => {
  const response = await api.post<{ message: string; refundRequest: RefundRequest; refund: { id: string; amount: number; status: string } }>(`/orders/refunds/${id}/process`);
  return response.data;
};