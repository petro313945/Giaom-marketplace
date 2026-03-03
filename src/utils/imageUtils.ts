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

/**
 * Get the first image URL from an array or single image
 * Useful for product listings that show one image
 * For variant products, checks variant images if product-level images don't exist
 * Handles both simple products (with imageUrl or imageUrls) and variant products
 */
export const getFirstImageUrl = (product: { 
  imageUrl?: string; 
  imageUrls?: string[]; 
  variants?: Array<{ imageUrls?: string[] }>;
  colorImages?: { [color: string]: string[] };
} | null | undefined): string => {
  if (!product) {
    return '/placeholder.svg';
  }
  
  // First, check product-level imageUrls array (for both simple and variant products)
  if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    const firstImage = product.imageUrls[0];
    if (firstImage && firstImage.trim() !== '') {
      return getImageUrl(firstImage);
    }
  }
  
  // Second, check product-level imageUrl (singular) - important for simple products
  // This handles backward compatibility and simple products that only have imageUrl set
  if (product.imageUrl && product.imageUrl.trim() !== '') {
    return getImageUrl(product.imageUrl);
  }
  
  // If no product-level images, check variants for images (variant products only)
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    // Find the first variant that has images
    for (const variant of product.variants) {
      if (variant && variant.imageUrls && Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0) {
        const firstVariantImage = variant.imageUrls[0];
        if (firstVariantImage && firstVariantImage.trim() !== '') {
          return getImageUrl(firstVariantImage);
        }
      }
    }
  }
  
  // Check colorImages as a fallback (use first color's first image)
  if (product.colorImages && typeof product.colorImages === 'object') {
    const colors = Object.keys(product.colorImages);
    if (colors.length > 0) {
      const firstColor = colors[0];
      const colorImages = product.colorImages[firstColor];
      if (Array.isArray(colorImages) && colorImages.length > 0 && colorImages[0] && colorImages[0].trim() !== '') {
        return getImageUrl(colorImages[0]);
      }
    }
  }
  
  // Fallback to placeholder
  return '/placeholder.svg';
};

/**
 * Get the first image URL from a variant, or fallback to product images
 * Useful for displaying variant-specific images
 */
export const getVariantImageUrl = (
  variant: { imageUrls?: string[] } | null | undefined,
  product: { imageUrl?: string; imageUrls?: string[] } | null | undefined
): string => {
  if (variant && variant.imageUrls && variant.imageUrls.length > 0) {
    return getImageUrl(variant.imageUrls[0]);
  }
  return getFirstImageUrl(product);
};