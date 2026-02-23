import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Product } from '../services/productService'

interface ProductsListProps {
  products: Product[]
  onProductUpdated?: () => void
}

export default function ProductsList({ products, onProductUpdated }: ProductsListProps) {
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
              <div key={productId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg relative overflow-hidden">
                    <img
                      src={product.imageUrl || '/placeholder.svg'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{product.title}</p>
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
