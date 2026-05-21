import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveProductImage } from '../utils/imageHelpers';

const CartPage: React.FC = () => {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login page with state containing return URL
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      // Navigate to checkout page
      navigate('/checkout');
    }
  };

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1>Shopping Cart</h1>
          
          {items.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-cart3 display-1 text-muted"></i>
              <h3 className="mt-3">Your cart is empty</h3>
              <p className="text-muted">Add some products to get started!</p>
              <Button variant="primary" onClick={() => navigate('/products')}>
                <i className="bi bi-arrow-left me-2"></i>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <div className="row">
                <div className="col-lg-8">
                  {items.map((item) => (
                    <Card key={item.id} className="mb-3">
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col md={2}>
                            <img
                              src={resolveProductImage(item.product.images?.[0])}
                              alt={item.product.name}
                              className="img-fluid rounded"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/placeholder-image.svg';
                              }}
                            />
                          </Col>
                          <Col md={4}>
                            <h6>{item.product.name}</h6>
                            <p className="text-muted small">{item.product.brand}</p>
                          </Col>
                          <Col md={2}>
                            <div className="d-flex align-items-center">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </Col>
                          <Col md={2}>
                            <div>
                              {item.product.sale_price ? (
                                <>
                                  <div className="fw-bold text-danger">
                                    ₹{(parseFloat(item.product.sale_price) * item.quantity).toFixed(2)}
                                  </div>
                                  <small className="text-muted text-decoration-line-through">
                                    ₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                                  </small>
                                </>
                              ) : (
                                <span className="fw-bold">₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                              )}
                            </div>
                          </Col>
                          <Col md={2}>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
                
                <div className="col-lg-4">
                  <Card>
                    <Card.Header>
                      <h5>Order Summary</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Shipping:</span>
                        <span className="text-muted">Calculated at checkout</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between fw-bold">
                        <span>Total:</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                      <Button 
                        variant="primary" 
                        className="w-100 mt-3"
                        onClick={handleProceedToCheckout}
                        disabled={items.length === 0}
                      >
                        <i className="bi bi-bag-check me-2"></i>
                        {!isAuthenticated ? 'Login to Checkout' : 'Proceed to Checkout'}
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        className="w-100 mt-2"
                        onClick={() => navigate('/products')}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Continue Shopping
                      </Button>
                      {items.length === 0 && (
                        <small className="text-muted mt-2 d-block text-center">
                          Add items to your cart to checkout
                        </small>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;