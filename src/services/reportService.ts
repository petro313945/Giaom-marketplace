import api from './api';

export interface Report {
  id: string;
  _id?: string;
  reporterId: string | { _id: string; email: string; fullName?: string };
  reportedType: 'product' | 'user' | 'review';
  reportedId: string;
  reportedContent?: any; // The actual content being reported (product, user, or review)
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolvedBy?: string | { _id: string; email: string; fullName?: string };
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsResponse {
  reports: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SubmitReportData {
  reportedType: 'product' | 'user' | 'review';
  reportedId: string;
  reason: string;
  description?: string;
}

// Submit a report
export const submitReport = async (
  data: SubmitReportData
): Promise<{ message: string; report: Report }> => {
  const response = await api.post<{ message: string; report: Report }>('/reports', data);
  return response.data;
};

// Admin: Get all reports
export const getAllReports = async (
  params?: { page?: number; limit?: number; status?: 'pending' | 'resolved' | 'dismissed' }
): Promise<ReportsResponse> => {
  const response = await api.get<ReportsResponse>('/reports/admin', { params });
  return response.data;
};

// Admin: Get pending reports count
export const getPendingReportsCount = async (): Promise<{ count: number }> => {
  const response = await api.get<{ count: number }>('/reports/admin/count');
  return response.data;
};

// Admin: Get single report
export const getReport = async (reportId: string): Promise<{ report: Report }> => {
  const response = await api.get<{ report: Report }>(`/reports/admin/${reportId}`);
  return response.data;
};

// Admin: Resolve a report
export interface ResolveReportData {
  adminNotes?: string;
}

export const resolveReport = async (
  reportId: string,
  data?: ResolveReportData
): Promise<{ message: string; report: Report }> => {
  const response = await api.put<{ message: string; report: Report }>(
    `/reports/admin/${reportId}/resolve`,
    data || {}
  );
  return response.data;
};

// Admin: Dismiss a report
export interface DismissReportData {
  adminNotes?: string;
}

export const dismissReport = async (
  reportId: string,
  data?: DismissReportData
): Promise<{ message: string; report: Report }> => {
  const response = await api.put<{ message: string; report: Report }>(
    `/reports/admin/${reportId}/dismiss`,
    data || {}
  );
  return response.data;
};

// Admin: Update report status (allows changing to any status including pending)
export interface UpdateReportStatusData {
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string;
}

export const updateReportStatus = async (
  reportId: string,
  data: UpdateReportStatusData
): Promise<{ message: string; report: Report }> => {
  const response = await api.put<{ message: string; report: Report }>(
    `/reports/admin/${reportId}/status`,
    data
  );
  return response.data;
};