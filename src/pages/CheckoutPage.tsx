import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Elements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { paymentApi } from '../services/api';
import stripePromise from '../services/stripe';
import CheckoutForm from '../components/CheckoutForm';
import CheckoutFormWithDebug from '../components/CheckoutFormWithDebug';
import OrderSummary from '../components/OrderSummary';
import AuthStatusIndicator from '../components/AuthStatusIndicator';
import { stripeDebugger } from '../utils/stripeDebugger';

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const CheckoutPage: React.FC = () => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });

  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const tax = total * 0.08; // 8% tax
  const shipping = 10.00; // Fixed shipping
  const grandTotal = total + tax + shipping;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Check if auth token exists
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { from: '/checkout' } });
      }, 2000);
      return;
    }

    stripeDebugger.info('Checkout page initialized', {
      isAuthenticated,
      hasToken: !!token,
      itemCount: items.length,
      user: user?.email || 'unknown'
    });
  }, [isAuthenticated, items, navigate, user]);

  const handleCreatePaymentIntent = async () => {
    if (!validateShippingAddress()) {
      setError('Please fill in all required shipping information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      stripeDebugger.info('Creating payment intent', {
        amount: total,
        currency: 'usd',
        shipping_address: shippingAddress
      });

      const result = await paymentApi.createPaymentIntent({
        amount: total, // Send only cart subtotal, backend will add tax and shipping
        currency: 'usd',
        shipping_address: shippingAddress,
      });

      stripeDebugger.logPaymentIntentCreation(
        { amount: total, currency: 'usd', shipping_address: shippingAddress },
        result
      );

      if (result.success) {
        setClientSecret(result.data.client_secret);
        stripeDebugger.info('Payment intent created successfully', {
          client_secret: result.data.client_secret ? 'present' : 'missing'
        });
      } else {
        stripeDebugger.logPaymentIntentError(new Error(result.message || 'Failed to process payment'));
        throw new Error(result.message || 'Failed to process payment');
      }
    } catch (err: any) {
      stripeDebugger.logPaymentIntentError(err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateShippingAddress = (): boolean => {
    return !!(
      shippingAddress.name &&
      shippingAddress.line1 &&
      shippingAddress.city &&
      shippingAddress.state &&
      shippingAddress.postal_code &&
      shippingAddress.country
    );
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePaymentSuccess = (orderNumber: string) => {
    // Clear cart and redirect to success page
    clearCart();
    navigate(`/order-success/${orderNumber}`);
  };

  if (items.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2>Your cart is empty</h2>
          <Button variant="primary" onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1 className="mb-4">Checkout</h1>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {/* Authentication Status Indicator - Only in Development */}
      {process.env.NODE_ENV === 'development' && (
        <Row>
          <Col>
            <AuthStatusIndicator showDetails={true} />
          </Col>
        </Row>
      )}

      <Row>
        <Col lg={8}>
          {/* Shipping Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Shipping Information</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => handleAddressChange('name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country *</Form.Label>
                      <Form.Select
                        value={shippingAddress.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Address Line 1 *</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingAddress.line1}
                    onChange={(e) => handleAddressChange('line1', e.target.value)}
                    placeholder="Street address, P.O. box, company name, c/o"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address Line 2</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingAddress.line2}
                    onChange={(e) => handleAddressChange('line2', e.target.value)}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State *</Form.Label>
                      <Form.Control
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="State"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code *</Form.Label>
                      <Form.Control
                        type="text"
                        value={shippingAddress.postal_code}
                        onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                        placeholder="ZIP Code"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* Payment Information */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Payment Information</h5>
            </Card.Header>
            <Card.Body>
              {!clientSecret ? (
                <div className="text-center">
                  <p className="mb-3">Please review your order and shipping information above.</p>
                  <Button
                    variant="primary"
                    onClick={handleCreatePaymentIntent}
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    },
                  }}
                >
                  {process.env.NODE_ENV === 'development' ? (
                    <CheckoutFormWithDebug
                      clientSecret={clientSecret}
                      shippingAddress={shippingAddress}
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <CheckoutForm
                      clientSecret={clientSecret}
                      shippingAddress={shippingAddress}
                      onSuccess={handlePaymentSuccess}
                    />
                  )}
                </Elements>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <OrderSummary
            items={items}
            subtotal={total}
            tax={tax}
            shipping={shipping}
            total={grandTotal}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;