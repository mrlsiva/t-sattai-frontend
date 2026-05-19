import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface OrderDetails {
  orderNumber: string;
  total: number;
  items: any[];
  shippingAddress: any;
  estimatedDelivery: string;
}

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Get order details from navigation state
    const orderData = location.state;
    if (orderData && orderData.orderNumber) {
      setOrderDetails({
        orderNumber: orderData.orderNumber,
        total: orderData.total || 0,
        items: orderData.items || [],
        shippingAddress: orderData.shippingAddress || {},
        estimatedDelivery: orderData.estimatedDelivery || '5-7 business days'
      });
    } else {
      // If no order data, redirect to home after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [isAuthenticated, location.state, navigate]);

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/dashboard');
  };

  return (
    <Container fluid className="py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Row className="justify-content-center">
        <Col xl={8} lg={10}>
          <div className="text-center mb-5">
            {/* Success Icon */}
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
              style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#28a745',
                color: 'white',
                fontSize: '40px'
              }}
            >
              ✓
            </div>
            
            <h1 className="h2 mb-3" style={{ color: '#582c00', fontWeight: '700' }}>
              Order Confirmed!
            </h1>
            
            <p className="text-muted mb-4" style={{ fontSize: '18px' }}>
              Thank you for your purchase. Your order has been successfully placed and confirmed.
            </p>
          </div>

          {orderDetails ? (
            <>
              {/* Order Number Card */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <h5 className="mb-3" style={{ color: '#582c00', fontWeight: '600' }}>
                    Order Number
                  </h5>
                  <div 
                    className="h4 mb-3 px-4 py-2 rounded d-inline-block"
                    style={{ 
                      backgroundColor: '#fff3d0', 
                      color: '#582c00',
                      fontWeight: '700',
                      letterSpacing: '1px'
                    }}
                  >
                    #{orderDetails.orderNumber}
                  </div>
                  <p className="text-muted mb-0">
                    Please save this number for your records. You can use it to track your order.
                  </p>
                </Card.Body>
              </Card>

              {/* Order Summary */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="mb-4" style={{ color: '#582c00', fontWeight: '600' }}>
                    Order Summary
                  </h5>
                  
                  <Row>
                    <Col md={8}>
                      <div className="mb-3">
                        <h6 className="text-muted mb-2">Items Ordered:</h6>
                        {orderDetails.items.length > 0 ? (
                          orderDetails.items.map((item, index) => (
                            <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                              <span>{item.product?.name || 'Product'} (Qty: {item.quantity || 1})</span>
                              <span style={{ color: '#582c00', fontWeight: '500' }}>
                                ₹{((item.product?.sale_price || item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">Order details will be sent to your email</p>
                        )}
                      </div>
                      
                      {orderDetails.total > 0 && (
                        <div className="border-top pt-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0" style={{ color: '#582c00', fontWeight: '600' }}>
                              Total Amount:
                            </h6>
                            <h6 className="mb-0" style={{ color: '#582c00', fontWeight: '700' }}>
                              ₹{orderDetails.total.toFixed(2)}
                            </h6>
                          </div>
                        </div>
                      )}
                    </Col>
                    
                    <Col md={4}>
                      <div className="text-center">
                        <div 
                          className="rounded p-3 mb-3"
                          style={{ backgroundColor: '#fff3d0', border: '1px solid #ffcd77' }}
                        >
                          <h6 className="mb-2" style={{ color: '#582c00', fontWeight: '600' }}>
                            🚚 Estimated Delivery
                          </h6>
                          <p className="mb-0" style={{ color: '#582c00', fontWeight: '500' }}>
                            {orderDetails.estimatedDelivery}
                          </p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Shipping Information */}
              {orderDetails.shippingAddress && Object.keys(orderDetails.shippingAddress).length > 0 && (
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="mb-3" style={{ color: '#582c00', fontWeight: '600' }}>
                      Shipping Information
                    </h5>
                    <div className="text-muted">
                      <p className="mb-1">{orderDetails.shippingAddress.name}</p>
                      <p className="mb-1">{orderDetails.shippingAddress.line1}</p>
                      {orderDetails.shippingAddress.line2 && (
                        <p className="mb-1">{orderDetails.shippingAddress.line2}</p>
                      )}
                      <p className="mb-0">
                        {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.postal_code}
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* What's Next */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="mb-3" style={{ color: '#582c00', fontWeight: '600' }}>
                    What's Next?
                  </h5>
                  <Row>
                    <Col md={4} className="text-center mb-3">
                      <div className="mb-2" style={{ fontSize: '24px' }}>📧</div>
                      <h6 style={{ color: '#582c00' }}>Email Confirmation</h6>
                      <p className="text-muted small">
                        You'll receive an email confirmation shortly with your order details.
                      </p>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="mb-2" style={{ fontSize: '24px' }}>📦</div>
                      <h6 style={{ color: '#582c00' }}>Order Processing</h6>
                      <p className="text-muted small">
                        We'll prepare your order and send you tracking information.
                      </p>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="mb-2" style={{ fontSize: '24px' }}>🚚</div>
                      <h6 style={{ color: '#582c00' }}>Delivery</h6>
                      <p className="text-muted small">
                        Your order will be delivered to your specified address.
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5 text-center">
                <Alert variant="info" className="mb-4">
                  <h5 className="mb-2" style={{ color: '#582c00', fontWeight: '600' }}>
                    Order Processed Successfully!
                  </h5>
                  <p className="mb-0">
                    Your order has been confirmed. You will receive an email confirmation shortly.
                  </p>
                </Alert>
                <p className="text-muted">
                  Redirecting you to the homepage...
                </p>
              </Card.Body>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="text-center mt-5">
            <Row className="justify-content-center">
              <Col md={6}>
                <Button
                  size="lg"
                  onClick={handleContinueShopping}
                  style={{ 
                    backgroundColor: '#582c00',
                    borderColor: '#582c00',
                    borderRadius: '8px',
                    fontWeight: '600',
                    padding: '12px 30px',
                    marginRight: '15px'
                  }}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="outline-primary"
                  size="lg"
                  onClick={handleViewOrders}
                  style={{ 
                    borderColor: '#582c00',
                    color: '#582c00',
                    borderRadius: '8px',
                    fontWeight: '600',
                    padding: '12px 30px'
                  }}
                >
                  View All Orders
                </Button>
              </Col>
            </Row>
          </div>

          {/* Contact Support */}
          <div className="text-center mt-5">
            <p className="text-muted">
              Need help with your order? <Link to="/contact" style={{ color: '#582c00' }}>Contact Support</Link>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderConfirmationPage;