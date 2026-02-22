/**
 * Get the full URL for an image
 * Handles both local uploads and external URLs
 */
export const getImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) {
    return '/placeholder.svg';
  }

  // If it's already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a local upload path (starts with /uploads), construct full URL
  if (imageUrl.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${imageUrl}`;
  }

  // If it's a relative path, assume it's a placeholder
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // Default to placeholder
  return '/placeholder.svg';
};
