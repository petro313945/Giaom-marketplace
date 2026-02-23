import { AxiosError } from 'axios';

/**
 * Get user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Check if it's an Axios error
    if ('response' in error) {
      const axiosError = error as AxiosError<any>;
      if (axiosError.response?.data?.error) {
        return axiosError.response.data.error;
      }
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      if (axiosError.response?.status === 401) {
        return 'You are not authorized. Please log in.';
      }
      if (axiosError.response?.status === 403) {
        return 'You do not have permission to perform this action.';
      }
      if (axiosError.response?.status === 404) {
        return 'The requested resource was not found.';
      }
      if (axiosError.response?.status === 409) {
        return 'This resource already exists.';
      }
      if (axiosError.response?.status === 422) {
        return 'Invalid input. Please check your data.';
      }
      if (axiosError.response?.status === 500) {
        return 'Server error. Please try again later.';
      }
      if (axiosError.response?.status) {
        return `Request failed with status ${axiosError.response.status}`;
      }
    }
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    if ('response' in error) {
      const axiosError = error as AxiosError;
      return !axiosError.response;
    }
  }
  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 401 || axiosError.response?.status === 403;
  }
  return false;
};
