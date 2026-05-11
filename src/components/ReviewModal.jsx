import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-[#18181b] border border-white/10 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Review {revieweeName}</h3>
          <button className="text-zinc-400 hover:text-white transition-colors" onClick={handleClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <span className="block text-sm font-medium text-zinc-400 mb-3">Your Rating</span>
          <div className="flex gap-2 justify-center mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110"
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
          <p className="text-center text-sm font-medium text-amber-400 mb-6">
            {RATING_LABELS[hover || rating] || 'Click to rate'}
          </p>

          <span className="block text-sm font-medium text-zinc-400 mb-3">Comment (optional)</span>
          <textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none mb-6"
            rows={4}
          />

          <div className="flex gap-3">
            <button 
              type="button" 
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors disabled:opacity-50" 
              onClick={handleClose} 
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50" 
              disabled={loading || rating === 0}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
