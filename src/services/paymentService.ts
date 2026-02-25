import api from './api';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  paymentStatus: string;
  paymentIntentId: string;
  paymentMethod?: string;
  error?: string;
}

// Create payment intent
export const createPaymentIntent = async (): Promise<PaymentIntentResponse> => {
  const response = await api.post<PaymentIntentResponse>('/payment/create-intent');
  return response.data;
};

// Confirm payment
export const confirmPayment = async (paymentIntentId: string): Promise<ConfirmPaymentResponse> => {
  const response = await api.post<ConfirmPaymentResponse>('/payment/confirm', {
    paymentIntentId,
  });
  return response.data;
};
