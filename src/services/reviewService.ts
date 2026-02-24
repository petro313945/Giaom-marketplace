import api from './api';

export interface Review {
  id: string;
  _id?: string;
  productId: string | { _id: string; title: string };
  userId: string | { _id: string; email: string; fullName?: string };
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  productId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get reviews for a product
export const getProductReviews = async (
  productId: string,
  params?: { page?: number; limit?: number }
): Promise<ReviewsResponse> => {
  const response = await api.get<ReviewsResponse>(`/reviews/product/${productId}`, { params });
  return response.data;
};

// Get review statistics for a product
export const getReviewStats = async (productId: string): Promise<ReviewStats> => {
  const response = await api.get<ReviewStats>(`/reviews/product/${productId}/stats`);
  return response.data;
};

// Get user's review for a product
export const getUserReview = async (productId: string): Promise<{ review: Review }> => {
  const response = await api.get<{ review: Review }>(`/reviews/product/${productId}/my-review`);
  return response.data;
};

// Submit a review
export interface SubmitReviewData {
  rating: number;
  comment?: string;
}

export const submitReview = async (
  productId: string,
  data: SubmitReviewData
): Promise<{ message: string; review: Review }> => {
  const response = await api.post<{ message: string; review: Review }>(
    `/reviews/product/${productId}`,
    data
  );
  return response.data;
};

// Update a review
export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

export const updateReview = async (
  reviewId: string,
  data: UpdateReviewData
): Promise<{ message: string; review: Review }> => {
  const response = await api.put<{ message: string; review: Review }>(
    `/reviews/${reviewId}`,
    data
  );
  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/reviews/${reviewId}`);
  return response.data;
};

// Admin: Get pending reviews
export const getPendingReviews = async (
  params?: { page?: number; limit?: number }
): Promise<ReviewsResponse> => {
  const response = await api.get<ReviewsResponse>('/reviews/admin/pending', { params });
  return response.data;
};

// Admin: Approve review
export const approveReview = async (reviewId: string): Promise<{ message: string; review: Review }> => {
  const response = await api.put<{ message: string; review: Review }>(
    `/reviews/${reviewId}/approve`
  );
  return response.data;
};

// Admin: Reject review
export const rejectReview = async (reviewId: string): Promise<{ message: string; review: Review }> => {
  const response = await api.put<{ message: string; review: Review }>(
    `/reviews/${reviewId}/reject`
  );
  return response.data;
};
