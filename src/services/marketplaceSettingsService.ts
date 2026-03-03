import api from './api';

export interface MarketplaceSettings {
  commissionRate: number;
  commissionRatePercent: number;
}

export interface MarketplaceSettingsAdmin extends MarketplaceSettings {
  createdAt: string;
  updatedAt: string;
}

// Get marketplace settings (public - sellers can see commission rate)
export const getMarketplaceSettings = async (): Promise<MarketplaceSettings> => {
  const response = await api.get<MarketplaceSettings>('/marketplace-settings');
  return response.data;
};

// Get marketplace settings for admin (includes all data)
export const getMarketplaceSettingsAdmin = async (): Promise<MarketplaceSettingsAdmin> => {
  const response = await api.get<MarketplaceSettingsAdmin>('/marketplace-settings/admin');
  return response.data;
};

// Update marketplace settings (admin only)
export const updateMarketplaceSettings = async (data: {
  commissionRate: number;
}): Promise<{
  message: string;
  commissionRate: number;
  commissionRatePercent: number;
  updatedAt: string;
}> => {
  const response = await api.put('/marketplace-settings/admin', data);
  return response.data;
};
