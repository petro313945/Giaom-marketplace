import api from './api';

export interface SellerProfile {
  id: string;
  userId: string | User;
  businessName: string;
  businessDescription?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
}

// Apply to become seller
export const applyToBecomeSeller = async (data: {
  businessName: string;
  businessDescription?: string;
}): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.post<{ message: string; sellerProfile: SellerProfile }>('/sellers/apply', data);
  return response.data;
};

// Get current seller profile
export const getCurrentSellerProfile = async (): Promise<{ sellerProfile: SellerProfile }> => {
  const response = await api.get<{ sellerProfile: SellerProfile }>('/sellers/profile');
  return response.data;
};

// Update seller profile
export const updateSellerProfile = async (data: {
  businessName?: string;
  businessDescription?: string;
}): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.put<{ message: string; sellerProfile: SellerProfile }>('/sellers/profile', data);
  return response.data;
};

// Get all sellers (admin only)
export const getAllSellers = async (): Promise<SellerProfile[]> => {
  const response = await api.get<{ sellers: SellerProfile[] }>('/sellers');
  return response.data.sellers;
};

// Get pending sellers (admin only)
export const getPendingSellers = async (): Promise<SellerProfile[]> => {
  const response = await api.get<{ sellers: SellerProfile[] }>('/sellers/pending');
  return response.data.sellers;
};

// Approve seller (admin only)
export const approveSeller = async (sellerId: string): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.put<{ message: string; sellerProfile: SellerProfile }>(`/sellers/${sellerId}/approve`);
  return response.data;
};

// Reject seller (admin only)
export const rejectSeller = async (sellerId: string): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.put<{ message: string; sellerProfile: SellerProfile }>(`/sellers/${sellerId}/reject`);
  return response.data;
};
