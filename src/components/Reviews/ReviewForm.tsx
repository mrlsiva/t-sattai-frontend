import React, { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string }) => void;
  onCancel: () => void;
  initialData?: {
    rating: number;
    comment: string;
  };
  isEditing?: boolean;
  isLoading?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  isLoading = false
}) => {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [comment, setComment] = useState(initialData?.comment || '');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (comment.trim().length < 10) {
      alert('Comment must be at least 10 characters long');
      return;
    }
    onSubmit({ rating, comment: comment.trim() });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={`btn btn-sm p-1 border-0 ${
            isActive ? 'text-warning' : 'text-muted'
          }`}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(starValue)}
          disabled={isLoading}
        >
          <i className="fas fa-star fa-lg"></i>
        </button>
      );
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          {isEditing ? 'Edit Review' : 'Write a Review'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Rating *</label>
            <div className="d-flex align-items-center">
              {renderStars()}
              <span className="ms-2 text-muted">
                {rating > 0 && `${rating} out of 5 stars`}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="comment" className="form-label">
              Comment *
            </label>
            <textarea
              id="comment"
              className="form-control"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              minLength={10}
              maxLength={1000}
              required
              disabled={isLoading}
            />
            <div className="form-text">
              {comment.length}/1000 characters (minimum 10)
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || rating === 0 || comment.trim().length < 10}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                isEditing ? 'Update Review' : 'Submit Review'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;