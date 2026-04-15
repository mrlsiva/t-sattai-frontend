import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface WishlistButtonProps {
  productId: number;
  className?: string;
  showText?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  className = '',
  showText = true
}) => {
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user]);

  const checkWishlistStatus = async () => {
    try {
      const response = await api.get(`/wishlist/check/${productId}`);
      setIsInWishlist(response.data.in_wishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      alert('Please login to add items to wishlist');
      return;
    }

    try {
      setLoading(true);
      
      if (isInWishlist) {
        await api.delete(`/wishlist/${productId}`);
        setIsInWishlist(false);
      } else {
        await api.post(`/wishlist/${productId}`);
        setIsInWishlist(true);
      }
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
      alert(error.response?.data?.message || 'Error updating wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <button
      className={`btn ${isInWishlist ? 'btn-danger' : 'btn-outline-danger'} ${className}`}
      onClick={toggleWishlist}
      disabled={loading}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      ) : (
        <i className={isInWishlist ? 'fas fa-heart' : 'far fa-heart'}></i>
      )}
      {showText && (
        <span className="ms-2">
          {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;