import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RatingDisplay from './RatingDisplay';
import ReportDialog from './ReportDialog';
import * as reviewService from '../services/reviewService';
import type { Review } from '../services/reviewService';

interface ReviewListProps {
  productId: string;
  showForm?: boolean;
  onReviewSubmit?: () => void;
}

export default function ReviewList({
  productId
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getProductReviews(productId, {
        page,
        limit: 10
      });
      if (page === 1) {
        setReviews(response.reviews);
      } else {
        setReviews(prev => [...prev, ...response.reviews]);
      }
      setHasMore(response.pagination.page < response.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const getUserName = (userId: string | { _id: string; email: string; fullName?: string }) => {
    if (typeof userId === 'object' && userId !== null) {
      return userId.fullName || userId.email || 'Anonymous';
    }
    return 'Anonymous';
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Reviews</h3>
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Reviews</h3>
        <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Customer Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => {
          const userName = getUserName(review.userId);
          const isPending = review.status === 'pending';
          
          return (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{userName}</p>
                        {isPending && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <RatingDisplay rating={review.rating} size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                      <ReportDialog
                        reportedType="review"
                        reportedId={review.id || review._id || ''}
                        reportedTitle={`Review by ${userName}`}
                      />
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {hasMore && (
        <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More Reviews'}
        </Button>
      )}
    </div>
  );
}
