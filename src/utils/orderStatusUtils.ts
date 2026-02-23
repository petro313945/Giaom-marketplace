/**
 * Get order status styling classes (admin style - colored background + text)
 */
export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const ORDER_STATUS_CLASS = 'inline-block px-2 py-1 rounded-full text-xs font-medium capitalize'
