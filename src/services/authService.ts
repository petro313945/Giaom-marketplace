import api from './api';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'customer' | 'seller' | 'admin';
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Register new user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

// Login user
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// Get current user
export const getCurrentUser = async (): Promise<{ user: User }> => {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data;
};

// Refresh token
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const response = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

// Logout (client-side only, clears tokens)
export const logout = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
