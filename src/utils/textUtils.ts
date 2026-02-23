/**
 * Truncate text to a maximum length with ellipsis
 * Used for product titles in lists to prevent overflow
 */
export const truncateText = (text: string, maxLength: number = 80): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};
