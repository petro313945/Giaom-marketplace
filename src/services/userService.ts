import api from './api';

export interface User {
  _id: string;
  id?: string; // Alias for _id
  email: string;
  name?: string;
  fullName?: string;
  role: 'customer' | 'seller' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileData {
  fullName?: string;
}

// Get current user profile
export const getCurrentUserProfile = async (): Promise<{ user: User }> => {
  const response = await api.get<{ user: User }>('/users/profile');
  return response.data;
};

// Update current user profile
export const updateCurrentUserProfile = async (data: UpdateProfileData): Promise<{ message: string; user: User }> => {
  const response = await api.put<{ message: string; user: User }>('/users/profile', data);
  return response.data;
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<{ users: User[]; count: number }>('/users');
  return response.data.users;
};

// Get user by ID (admin only)
export const getUserById = async (id: string): Promise<{ user: User }> => {
  const response = await api.get<{ user: User }>(`/users/${id}`);
  return response.data;
};

// Change user role (admin only)
export const changeUserRole = async (id: string, role: 'customer' | 'seller' | 'admin'): Promise<{ message: string; user: User }> => {
  const response = await api.put<{ message: string; user: User }>(`/users/${id}/role`, { role });
  return response.data;
};

// Delete user (admin only)
export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/users/${id}`);
  return response.data;
};
