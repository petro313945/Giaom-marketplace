import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import * as productService from '../services/productService'
import EditProductForm from './EditProductForm'
import { getFirstImageUrl } from '../utils/imageUtils'
import type { Product } from '../services/productService'

interface ProductsListProps {
  products: Product[]
  pagination?: { page: number; pages: number; total: number; limit?: number }
  onProductUpdated?: () => void
  onPageChange?: (page: number) => void
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  headerAction?: React.ReactNode
}

export default function ProductsList({ products, pagination, onProductUpdated, onPageChange, onSortChange, sortBy = 'createdAt', sortOrder = 'desc', headerAction }: ProductsListProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: string; title: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setEditOpen(true)
  }

  const handleDeleteClick = (productId: string, productTitle: string) => {
    setProductToDelete({ id: productId, title: productTitle })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    setDeletingId(productToDelete.id)
    try {
      await productService.deleteProduct(productToDelete.id)
      toast({
        title: 'Product Deleted',
        description: 'The product has been deleted successfully.',
        variant: 'default',
      })
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      onProductUpdated?.()
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.response?.data?.error || error.message || 'Failed to delete product',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div>
            <CardTitle>My Products</CardTitle>
            <CardDescription>You haven't added any products yet</CardDescription>
          </div>
          {headerAction}
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div>
            <CardTitle>My Products</CardTitle>
            <CardDescription>Manage your product listings</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onSortChange && (
              <div className="flex items-center gap-2">
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc']
                    onSortChange(newSortBy, newSortOrder)
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                    <SelectItem value="stockQuantity-desc">Stock (High to Low)</SelectItem>
                    <SelectItem value="stockQuantity-asc">Stock (Low to High)</SelectItem>
                    <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                    <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {headerAction}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left font-medium w-14">No.</th>
                  <th className="h-12 px-4 text-left font-medium">Image</th>
                  <th className="h-12 px-4 text-left font-medium">Title</th>
                  <th className="h-12 px-4 text-left font-medium">Price</th>
                  <th className="h-12 px-4 text-left font-medium">Category</th>
                  <th className="h-12 px-4 text-left font-medium">Stock</th>
                  <th className="h-12 px-4 text-left font-medium">Status</th>
                  <th className="h-12 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const productId = product._id || product.id || ''
                  const limit = pagination?.limit ?? (pagination?.pages ? Math.ceil((pagination?.total ?? 0) / pagination.pages) : 10)
                  const rowNo = ((pagination?.page ?? 1) - 1) * limit + index + 1
                  // Calculate total stock: sum of variant stocks if variants exist, otherwise use stockQuantity
                  const totalStock = product.variants && product.variants.length > 0
                    ? product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
                    : (product.stockQuantity ?? 0)
                  return (
                    <tr key={productId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="h-16 px-4 align-middle font-medium">{rowNo}</td>
                      <td className="h-16 px-4 align-middle">
                        <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          <img
                            src={getFirstImageUrl(product)}
                            alt={product.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </td>
                      <td className="h-16 px-4 align-middle">
                        <p className="font-medium line-clamp-2 max-w-[200px]" title={product.title}>{product.title}</p>
                      </td>
                      <td className="h-16 px-4 align-middle">${product.price}</td>
                      <td className="h-16 px-4 align-middle">{product.category}</td>
                      <td className="h-16 px-4 align-middle">
                        {totalStock === 0 ? 'Out of Stock' : `${totalStock} in stock`}
                      </td>
                      <td className="h-16 px-4 align-middle">
                        {product.status}
                      </td>
                      <td className="h-16 px-4 align-middle text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(productId, product.title)}
                            disabled={deletingId === productId}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === productId ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {pagination && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                <span className="text-muted-foreground">
                  Showing {((pagination.page - 1) * (pagination.limit ?? 10)) + 1}–{Math.min(pagination.page * (pagination.limit ?? 10), pagination.total)} of {pagination.total} products
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange?.(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground min-w-[120px] text-center">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => onPageChange?.(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <EditProductForm
        product={editingProduct}
        open={editOpen}
        onOpenChange={setEditOpen}
        onProductUpdated={() => {
          onProductUpdated?.()
          setEditOpen(false)
          setEditingProduct(null)
        }}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.title ?? 'this product'}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!!deletingId}
              onClick={handleDeleteConfirm}
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
