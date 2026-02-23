// Utility functions for user-friendly error messages

export const getErrorMessage = (error: any): string => {
  // Handle axios errors
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // Handle error message string
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error?.message) {
    return error.message;
  }

  // Handle validation errors
  if (error?.response?.data?.details && Array.isArray(error.response.data.details)) {
    return error.response.data.details.join(', ');
  }

  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

export const getErrorDetails = (error: any): string[] => {
  if (error?.response?.data?.details && Array.isArray(error.response.data.details)) {
    return error.response.data.details;
  }
  return [];
};

export const isNetworkError = (error: any): boolean => {
  return !error?.response && error?.message === 'Network Error';
};

export const getErrorStatus = (error: any): number | null => {
  return error?.response?.status || null;
};

// User-friendly error messages based on status codes
export const getUserFriendlyMessage = (error: any): string => {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);

  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  switch (status) {
    case 400:
      return message || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'You are not authorized to perform this action. Please log in.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return message || 'This resource already exists.';
    case 422:
      return message || 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
};
