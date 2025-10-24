import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  stock_quantity: number;
  category: {
    id: number;
    name: string;
  };
}

interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist');
      setWishlist(response.data.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist(wishlist.filter(item => item.product.id !== productId));
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      alert(error.response?.data?.message || 'Error removing from wishlist');
    }
  };

  const clearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }

    try {
      await api.delete('/wishlist');
      setWishlist([]);
    } catch (error: any) {
      console.error('Error clearing wishlist:', error);
      alert(error.response?.data?.message || 'Error clearing wishlist');
    }
  };

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <i className="fas fa-heart fa-3x text-muted mb-3"></i>
          <h3>Please Login</h3>
          <p className="text-muted">You need to be logged in to view your wishlist.</p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Wishlist ({wishlist.length})</h2>
        {wishlist.length > 0 && (
          <button
            className="btn btn-outline-danger"
            onClick={clearWishlist}
          >
            Clear All
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-heart fa-3x text-muted mb-3"></i>
          <h4>Your wishlist is empty</h4>
          <p className="text-muted">Save items you love for later!</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="row">
          {wishlist.map((item) => (
            <div key={item.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="position-relative">
                  <img
                    src={item.product.image || '/placeholder-image.svg'}
                    className="card-img-top"
                    alt={item.product.name}
                    style={{ height: '250px', objectFit: 'cover' }}
                  />
                  <button
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                    onClick={() => removeFromWishlist(item.product.id)}
                    title="Remove from wishlist"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.product.name}</h5>
                  <p className="card-text text-muted small mb-2">
                    {item.product.category.name}
                  </p>
                  <p className="card-text flex-grow-1">
                    {item.product.description}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="h5 mb-0 text-primary">
                        ${item.product.price}
                      </span>
                      <small className="text-muted">
                        {item.product.stock_quantity > 0 ? (
                          <span className="text-success">
                            <i className="fas fa-check me-1"></i>
                            In Stock
                          </span>
                        ) : (
                          <span className="text-danger">
                            <i className="fas fa-times me-1"></i>
                            Out of Stock
                          </span>
                        )}
                      </small>
                    </div>
                    
                    <div className="d-grid gap-2">
                      <Link
                        to={`/products/${item.product.id}`}
                        className="btn btn-primary"
                      >
                        View Details
                      </Link>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeFromWishlist(item.product.id)}
                      >
                        <i className="fas fa-heart me-1"></i>
                        Remove from Wishlist
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;