import React from 'react';

interface Review {
  id: number;
  user: {
    id: number;
    name: string;
  };
  rating: number;
  comment: string;
  helpful_count: number;
  created_at: string;
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: number;
  onHelpful?: (reviewId: number) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: number) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  onHelpful,
  onEdit,
  onDelete
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`fas fa-star ${
          index < rating ? 'text-warning' : 'text-muted'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOwner = currentUserId === review.user.id;

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="card-title mb-1">{review.user.name}</h6>
            <div className="mb-2">
              {renderStars(review.rating)}
              <small className="text-muted ms-2">
                {formatDate(review.created_at)}
              </small>
            </div>
          </div>
          
          {isOwner && (
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onEdit?.(review)}
                  >
                    <i className="fas fa-edit me-2"></i>Edit
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => onDelete?.(review.id)}
                  >
                    <i className="fas fa-trash me-2"></i>Delete
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        <p className="card-text">{review.comment}</p>

        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onHelpful?.(review.id)}
            disabled={isOwner}
          >
            <i className="fas fa-thumbs-up me-1"></i>
            Helpful ({review.helpful_count})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;