import api from './api';

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  address: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  fullName: string;
  address: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

// Get all addresses for current user
export const getUserAddresses = async (): Promise<{ addresses: Address[]; count: number }> => {
  const response = await api.get<{ addresses: Address[]; count: number }>('/addresses');
  return response.data;
};

// Get address by ID
export const getAddressById = async (id: string): Promise<{ address: Address }> => {
  const response = await api.get<{ address: Address }>(`/addresses/${id}`);
  return response.data;
};

// Create new address
export const createAddress = async (data: CreateAddressData): Promise<{ message: string; address: Address }> => {
  const response = await api.post<{ message: string; address: Address }>('/addresses', data);
  return response.data;
};

// Update address
export const updateAddress = async (id: string, data: UpdateAddressData): Promise<{ message: string; address: Address }> => {
  const response = await api.put<{ message: string; address: Address }>(`/addresses/${id}`, data);
  return response.data;
};

// Delete address
export const deleteAddress = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/addresses/${id}`);
  return response.data;
};

// Set default address
export const setDefaultAddress = async (id: string): Promise<{ message: string; address: Address }> => {
  const response = await api.patch<{ message: string; address: Address }>(`/addresses/${id}/default`);
  return response.data;
};
