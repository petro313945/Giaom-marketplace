import type { BulkDiscountTier } from '../services/productService'

/**
 * Calculate the price per unit after applying bulk discount
 * @param basePrice - The base price of the product
 * @param quantity - The quantity being purchased
 * @param bulkDiscountTiers - Array of bulk discount tiers
 * @returns The price per unit after discount
 */
export function calculateBulkDiscountPrice(
  basePrice: number,
  quantity: number,
  bulkDiscountTiers?: BulkDiscountTier[]
): number {
  if (!bulkDiscountTiers || bulkDiscountTiers.length === 0) {
    return basePrice
  }

  // Sort tiers by minQuantity descending to find the highest applicable tier
  const sortedTiers = [...bulkDiscountTiers].sort((a, b) => b.minQuantity - a.minQuantity)

  // Find the highest tier that applies to this quantity
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      const discountAmount = basePrice * (tier.discountPercent / 100)
      return basePrice - discountAmount
    }
  }

  // No tier applies, return base price
  return basePrice
}

/**
 * Calculate the total price for a quantity of items with bulk discount
 * @param basePrice - The base price of the product
 * @param quantity - The quantity being purchased
 * @param bulkDiscountTiers - Array of bulk discount tiers
 * @returns The total price for all items
 */
export function calculateBulkDiscountTotal(
  basePrice: number,
  quantity: number,
  bulkDiscountTiers?: BulkDiscountTier[]
): number {
  const pricePerUnit = calculateBulkDiscountPrice(basePrice, quantity, bulkDiscountTiers)
  return pricePerUnit * quantity
}

/**
 * Get the applicable discount tier for a given quantity
 * @param quantity - The quantity being purchased
 * @param bulkDiscountTiers - Array of bulk discount tiers
 * @returns The applicable tier or null if no tier applies
 */
export function getApplicableDiscountTier(
  quantity: number,
  bulkDiscountTiers?: BulkDiscountTier[]
): BulkDiscountTier | null {
  if (!bulkDiscountTiers || bulkDiscountTiers.length === 0) {
    return null
  }

  // Sort tiers by minQuantity descending to find the highest applicable tier
  const sortedTiers = [...bulkDiscountTiers].sort((a, b) => b.minQuantity - a.minQuantity)

  // Find the highest tier that applies to this quantity
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      return tier
    }
  }

  return null
}
