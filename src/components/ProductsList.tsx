import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
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
  pagination?: { page: number; pages: number; total: number }
  onProductUpdated?: () => void
  onPageChange?: (page: number) => void
}

export default function ProductsList({ products, pagination, onProductUpdated, onPageChange }: ProductsListProps) {
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
        <CardHeader>
          <CardTitle>My Products</CardTitle>
          <CardDescription>You haven't added any products yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Products</CardTitle>
          <CardDescription>Manage your product listings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => {
              const productId = product._id || product.id || ''
              return (
                <div key={productId} className="flex items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-16 h-16 bg-muted rounded-lg relative overflow-hidden">
                      <img
                        src={getFirstImageUrl(product)}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium line-clamp-2" title={product.title}>{product.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ${product.price} • {product.category}
                      </p>
                      <Badge
                        variant={
                          product.status === 'approved'
                            ? 'default'
                            : product.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {product.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(productId, product.title)}
                      disabled={deletingId === productId}
                    >
                      {deletingId === productId ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange?.(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
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
          )}
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
