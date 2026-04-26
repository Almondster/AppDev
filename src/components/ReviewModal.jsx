import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import './ReviewModal.css';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

/**
 * ReviewModal – star rating + comment
 *
 * Props:
 *  - open (bool)
 *  - revieweeName (string)
 *  - loading (bool)
 *  - onSubmit({ rating, comment })
 *  - onClose()
 */
const ReviewModal = ({ open, revieweeName = 'this creator', loading = false, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, comment: comment.trim() });
  };

  const handleClose = () => {
    setRating(0);
    setHover(0);
    setComment('');
    onClose();
  };

  return (
    <div className="review-modal-overlay" onClick={handleClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <div className="review-modal__header">
          <h3 className="review-modal__title">Review {revieweeName}</h3>
          <button className="review-modal__close" onClick={handleClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <span className="review-modal__label">Your Rating</span>
          <div className="review-modal__stars">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className="review-modal__star"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star
                  size={32}
                  fill={(hover || rating) >= star ? '#f59e0b' : 'transparent'}
                  color={(hover || rating) >= star ? '#f59e0b' : '#52525b'}
                />
              </button>
            ))}
          </div>
          <p className="review-modal__rating-text">
            {RATING_LABELS[hover || rating] || 'Click to rate'}
          </p>

          <span className="review-modal__label">Comment (optional)</span>
          <textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />

          <div className="review-modal__actions">
            <button type="button" className="review-modal__btn review-modal__btn--cancel" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="review-modal__btn review-modal__btn--submit" disabled={loading || rating === 0}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
