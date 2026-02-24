import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import RatingDisplay from './RatingDisplay';
import * as reviewService from '../services/reviewService';
import { cn } from '@/lib/utils';

interface ProductRatingProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export default function ProductRating({ productId, size = 'sm', showCount = true }: ProductRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await reviewService.getReviewStats(productId);
        setRating(stats.averageRating);
        setTotalReviews(stats.totalReviews);
      } catch (error) {
        // If no reviews exist, that's fine - just show no rating
        setRating(null);
        setTotalReviews(0);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchStats();
    }
  }, [productId]);

  const starSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={`loading-${i}`}
              className={cn(starSizes[size], 'text-gray-300')}
            />
          ))}
        </div>
      </div>
    );
  }

  if (rating === null || totalReviews === 0) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={`empty-${i}`}
              className={cn(starSizes[size], 'text-gray-300')}
            />
          ))}
        </div>
        {showCount && (
          <span className="text-sm text-muted-foreground ml-1">(0)</span>
        )}
      </div>
    );
  }

  return (
    <RatingDisplay
      rating={rating}
      totalReviews={totalReviews}
      showCount={showCount}
      size={size}
    />
  );
}
