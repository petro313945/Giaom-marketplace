import api from './api';

export interface SellerProfile {
  id: string;
  userId: string | User;
  businessName: string;
  businessDescription?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
}

export interface ApplySellerData {
  businessName: string;
  businessDescription?: string;
}

export interface UpdateSellerData {
  businessName?: string;
  businessDescription?: string;
}

// Apply to become seller
export const applyToBecomeSeller = async (data: ApplySellerData): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.post<{ message: string; sellerProfile: SellerProfile }>('/sellers/apply', data);
  return response.data;
};

// Get current seller profile
export const getCurrentSellerProfile = async (): Promise<{ sellerProfile: SellerProfile }> => {
  const response = await api.get<{ sellerProfile: SellerProfile }>('/sellers/profile');
  return response.data;
};

// Update seller profile
export const updateSellerProfile = async (data: UpdateSellerData): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.put<{ message: string; sellerProfile: SellerProfile }>('/sellers/profile', data);
  return response.data;
};

// Get pending sellers (admin only)
export const getPendingSellers = async (): Promise<{ sellers: SellerProfile[]; count: number }> => {
  const response = await api.get<{ sellers: SellerProfile[]; count: number }>('/sellers/pending');
  return response.data;
};

// Get all sellers (admin only)
export const getAllSellers = async (): Promise<{ sellers: SellerProfile[]; count: number }> => {
  const response = await api.get<{ sellers: SellerProfile[]; count: number }>('/sellers');
  return response.data;
};

// Approve seller (admin only)
export const approveSeller = async (id: string): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.put<{ message: string; sellerProfile: SellerProfile }>(`/sellers/${id}/approve`);
  return response.data;
};

// Reject seller (admin only)
export const rejectSeller = async (id: string): Promise<{ message: string; sellerProfile: SellerProfile }> => {
  const response = await api.put<{ message: string; sellerProfile: SellerProfile }>(`/sellers/${id}/reject`);
  return response.data;
};
