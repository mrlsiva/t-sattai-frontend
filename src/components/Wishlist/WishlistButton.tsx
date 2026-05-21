import React, { useState } from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import { Product } from '../../types';

interface WishlistButtonProps {
  product: Product;
  className?: string;
  showText?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  product,
  className = '',
  showText = true
}) => {
  const { isInWishlist, addItem, removeItem } = useWishlist();
  const [loading, setLoading] = useState(false);

  const inWishlist = isInWishlist(product.id);

  const toggleWishlist = async () => {
    try {
      setLoading(true);
      if (inWishlist) {
        await removeItem(product.id);
      } else {
        await addItem(product);
      }
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`btn ${inWishlist ? 'btn-danger' : 'btn-outline-danger'} ${className}`}
      onClick={toggleWishlist}
      disabled={loading}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      ) : (
        <i className={inWishlist ? 'fas fa-heart' : 'far fa-heart'}></i>
      )}
      {showText && (
        <span className="ms-2">
          {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;
