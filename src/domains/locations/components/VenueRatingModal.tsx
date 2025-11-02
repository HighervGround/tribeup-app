import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star, MapPin, Clock, Car, Accessibility, Sparkles } from 'lucide-react';
import { VenueService, Venue } from '../lib/venueService';
import { toast } from 'sonner';

interface VenueRatingModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted?: () => void;
}

interface RatingCriteria {
  overall: number;
  facilities: number;
  cleanliness: number;
  accessibility: number;
  parking: number;
}

function VenueRatingModal({ venue, isOpen, onClose, onRatingSubmitted }: VenueRatingModalProps) {
  const [ratings, setRatings] = useState<RatingCriteria>({
    overall: 0,
    facilities: 0,
    cleanliness: 0,
    accessibility: 0,
    parking: 0
  });
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (criteria: keyof RatingCriteria, rating: number) => {
    setRatings(prev => ({ ...prev, [criteria]: rating }));
  };

  const handleSubmit = async () => {
    if (!venue) return;

    // Validate that at least overall rating is provided
    if (ratings.overall === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    // Set default values for unrated criteria
    const finalRatings = {
      overall: ratings.overall,
      facilities: ratings.facilities || ratings.overall,
      cleanliness: ratings.cleanliness || ratings.overall,
      accessibility: ratings.accessibility || ratings.overall,
      parking: ratings.parking || ratings.overall
    };

    setIsSubmitting(true);

    try {
      await VenueService.addVenueRating(
        venue.id,
        finalRatings.overall,
        finalRatings.facilities,
        finalRatings.cleanliness,
        finalRatings.accessibility,
        finalRatings.parking,
        review.trim() || undefined
      );

      toast.success('Rating submitted successfully!');
      
      // Reset form
      setRatings({
        overall: 0,
        facilities: 0,
        cleanliness: 0,
        accessibility: 0,
        parking: 0
      });
      setReview('');
      
      onRatingSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    label: string,
    icon: React.ReactNode,
    criteria: keyof RatingCriteria,
    description?: string
  ) => {
    const currentRating = ratings[criteria];
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="font-medium text-sm">{label}</div>
            {description && (
              <div className="text-xs text-muted-foreground">{description}</div>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(criteria, star)}
              className={`p-1 rounded transition-colors ${
                star <= currentRating
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              <Star
                className="w-6 h-6"
                fill={star <= currentRating ? 'currentColor' : 'none'}
              />
            </button>
          ))}
          {currentRating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {currentRating} star{currentRating !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (!venue) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Rate {venue.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Venue Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="font-medium">{venue.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {venue.address}
            </div>
            <div className="text-sm text-muted-foreground capitalize mt-1">
              {venue.venue_type} venue • {venue.supported_sports.slice(0, 3).join(', ')}
            </div>
          </div>

          {/* Overall Rating */}
          <div className="border-b pb-4">
            {renderStarRating(
              'Overall Rating',
              <Star className="w-4 h-4 text-yellow-500" />,
              'overall',
              'Your overall experience at this venue'
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Rate specific aspects (optional):
            </div>

            {renderStarRating(
              'Facilities',
              <Sparkles className="w-4 h-4 text-blue-500" />,
              'facilities',
              'Quality of courts, fields, equipment'
            )}

            {renderStarRating(
              'Cleanliness',
              <Sparkles className="w-4 h-4 text-green-500" />,
              'cleanliness',
              'Restrooms, locker rooms, general upkeep'
            )}

            {renderStarRating(
              'Accessibility',
              <Accessibility className="w-4 h-4 text-purple-500" />,
              'accessibility',
              'Ease of access for all users'
            )}

            {renderStarRating(
              'Parking',
              <Car className="w-4 h-4 text-orange-500" />,
              'parking',
              'Availability and convenience of parking'
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Review (Optional)
            </label>
            <Textarea
              placeholder="Share your experience at this venue..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {review.length}/500 characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={ratings.overall === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VenueRatingModal;
