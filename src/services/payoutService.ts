import api from './api';

export interface EarningsSummary {
  totalEarnings: {
    amount: number;
    commission: number;
    netAmount: number;
    orderCount: number;
  };
  paidOut: {
    amount: number;
    payoutCount: number;
  };
  pending: {
    amount: number;
    payoutCount: number;
  };
  available: {
    amount: number;
    commission: number;
    netAmount: number;
    orderCount: number;
    orderIds: string[];
  };
}

export interface Payout {
  id: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payoutMethod?: string;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutHistoryResponse {
  payouts: Payout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RequestPayoutRequest {
  orderIds?: string[];
  payoutMethod?: string;
  payoutDetails?: {
    accountNumber?: string;
    bankName?: string;
    accountHolderName?: string;
  };
}

export interface RequestPayoutResponse {
  message: string;
  payout: {
    id: string;
    amount: number;
    commission: number;
    netAmount: number;
    status: string;
    orderCount: number;
    requestedAt: string;
  };
}

// Get earnings summary
export const getEarningsSummary = async (): Promise<EarningsSummary> => {
  const response = await api.get<EarningsSummary>('/payouts/earnings');
  return response.data;
};

// Get payout history
export const getPayoutHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<PayoutHistoryResponse> => {
  const response = await api.get<PayoutHistoryResponse>('/payouts/history', {
    params: { page, limit }
  });
  return response.data;
};

// Get payout by ID
export const getPayoutById = async (id: string): Promise<Payout> => {
  const response = await api.get<Payout>(`/payouts/${id}`);
  return response.data;
};

// Request payout
export const requestPayout = async (
  data: RequestPayoutRequest
): Promise<RequestPayoutResponse> => {
  const response = await api.post<RequestPayoutResponse>('/payouts/request', data);
  return response.data;
};

// Admin: Get all payouts
export interface GetAllPayoutsParams {
  page?: number;
  limit?: number;
  status?: string;
  sellerId?: string;
}

export interface GetAllPayoutsResponse {
  payouts: Payout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getAllPayouts = async (
  params?: GetAllPayoutsParams
): Promise<GetAllPayoutsResponse> => {
  const response = await api.get<GetAllPayoutsResponse>('/payouts/admin/all', { params });
  return response.data;
};

// Admin: Update payout status
export interface UpdatePayoutStatusRequest {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  failureReason?: string;
}

export interface UpdatePayoutStatusResponse {
  message: string;
  payout: {
    id: string;
    sellerId: any;
    amount: number;
    commission: number;
    netAmount: number;
    status: string;
    previousStatus: string;
    processedAt?: string;
    failureReason?: string;
    updatedAt: string;
  };
}

export const updatePayoutStatus = async (
  id: string,
  data: UpdatePayoutStatusRequest
): Promise<UpdatePayoutStatusResponse> => {
  const response = await api.put<UpdatePayoutStatusResponse>(`/payouts/admin/${id}/status`, data);
  return response.data;
};

// Admin: Get payout statistics
export interface PayoutStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  totalAmount: number;
  totalCommission: number;
  totalPaidOut: number;
  pendingAmount: number;
}

export const getPayoutStats = async (
  startDate?: string,
  endDate?: string
): Promise<PayoutStats> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get<PayoutStats>('/payouts/admin/stats', { params });
  return response.data;
};
