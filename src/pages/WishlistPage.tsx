import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Product } from '../types';

const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { items: wishlist, removeItem, clearWishlist } = useWishlist();

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }
    try {
      await addItem(product, 1);
      alert('Product added to cart!');
    } catch (error: any) {
      alert(error.message || 'Error adding product to cart');
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
          {wishlist.map((product) => (
            <div key={product.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="position-relative">
                  <img
                    src={product.images?.[0] || '/placeholder-image.svg'}
                    className="card-img-top"
                    alt={product.name}
                    style={{ height: '250px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder-image.svg';
                    }}
                  />
                  <button
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                    onClick={() => removeItem(product.id)}
                    title="Remove from wishlist"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text text-muted small mb-2">
                    {product.category?.name}
                  </p>
                  <p className="card-text flex-grow-1">
                    {product.description && product.description.length > 100
                      ? `${product.description.substring(0, 100)}...`
                      : product.description}
                  </p>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        {product.sale_price ? (
                          <>
                            <span className="h5 mb-0 text-danger me-2">
                              ₹{product.sale_price}
                            </span>
                            <small className="text-muted text-decoration-line-through">
                              ₹{product.price}
                            </small>
                          </>
                        ) : (
                          <span className="h5 mb-0 text-primary">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                      <small className="text-muted">
                        {product.stock > 0 ? (
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
                        to={`/products/${product.id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        View Details
                      </Link>
                      {product.stock > 0 && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddToCart(product)}
                        >
                          <i className="fas fa-shopping-cart me-1"></i>
                          Add to Cart
                        </button>
                      )}
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeItem(product.id)}
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