import api from './api';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'customer' | 'seller' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// Get current user profile
export const getCurrentUserProfile = async (): Promise<{ user: User }> => {
  const response = await api.get<{ user: User }>('/users/profile');
  return response.data;
};

// Update user profile
export const updateUserProfile = async (data: { fullName?: string }): Promise<{ message: string; user: User }> => {
  const response = await api.put<{ message: string; user: User }>('/users/profile', data);
  return response.data;
};

// Create user (admin only)
export const createUser = async (data: {
  email: string;
  password: string;
  fullName?: string;
  role: 'customer' | 'seller' | 'admin';
  businessName?: string;
  businessDescription?: string;
}): Promise<{ message: string; user: User }> => {
  const response = await api.post<{ message: string; user: User; sellerProfile?: any }>('/users', data);
  return response.data;
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<{ users: User[] }>('/users');
  return response.data.users;
};

// Update user (admin only)
export const updateUser = async (userId: string, data: { fullName?: string; email?: string }): Promise<{ message: string; user: User }> => {
  const response = await api.put<{ message: string; user: User }>(`/users/${userId}`, data);
  return response.data;
};

// Change user role (admin only)
export const changeUserRole = async (userId: string, role: 'customer' | 'seller' | 'admin'): Promise<{ message: string; user: User }> => {
  const response = await api.put<{ message: string; user: User }>(`/users/${userId}/role`, { role });
  return response.data;
};

// Delete user (admin only)
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/users/${userId}`);
  return response.data;
};

// Reset user password (admin only)
export const resetUserPassword = async (userId: string, password: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/users/${userId}/reset-password`, { password });
  return response.data;
};