import api from './api';

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  items: number;
}

export interface TopProduct {
  productId: string;
  title: string;
  revenue: number;
  quantity: number;
}

export interface OrdersByStatus {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface RecentOrder {
  id: string;
  date: string;
  status: string;
  revenue: number;
  itemsCount: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
}

export interface AnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  summary: AnalyticsSummary;
  salesByDate: SalesDataPoint[];
  topProducts: TopProduct[];
  ordersByStatus: OrdersByStatus;
  recentOrders: RecentOrder[];
}

// Get seller analytics
export const getSellerAnalytics = async (
  period?: number,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsResponse> => {
  const params: any = {};
  if (period) params.period = period.toString();
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get<AnalyticsResponse>('/analytics/seller', { params });
  return response.data;
};
