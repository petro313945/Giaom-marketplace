import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RatingDisplay({
  rating,
  totalReviews,
  showCount = false,
  size = 'md',
  className
}: RatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(starSizes[size], 'fill-yellow-400 text-yellow-400')}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(starSizes[size], 'text-gray-300')}
            />
            <Star
              className={cn(starSizes[size], 'fill-yellow-400 text-yellow-400 absolute left-0 top-0 overflow-hidden')}
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(starSizes[size], 'text-gray-300')}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)} {totalReviews !== undefined && `(${totalReviews})`}
        </span>
      )}
    </div>
  );
}
