import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as reviewService from '../services/reviewService';
import type { Review } from '../services/reviewService';

interface ReviewFormProps {
  productId: string;
  existingReview?: Review;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  productId,
  existingReview,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const [ratingState, setRatingState] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setRatingState(existingReview?.rating || 0);
    setComment(existingReview?.comment || '');
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ratingState === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      if (existingReview) {
        await reviewService.updateReview(existingReview.id, {
          rating: ratingState,
          comment: comment.trim()
        });
        toast({
          title: 'Review Updated',
          description: 'Your review has been updated successfully.',
        });
      } else {
        await reviewService.submitReview(productId, {
          rating: ratingState,
          comment: comment.trim()
        });
        toast({
          title: 'Review Submitted',
          description: 'Your review has been submitted and is pending moderation.',
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Rating *</Label>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRatingState(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoveredRating || ratingState)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          {ratingState > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {ratingState} out of 5
            </span>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Review Comment</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="mt-2"
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/1000 characters
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || ratingState === 0}>
          {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
