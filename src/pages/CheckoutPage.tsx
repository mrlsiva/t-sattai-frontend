import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Elements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { paymentApi, addressApi, checkoutApi } from '../services/api';
import stripePromise from '../services/stripe';
import CheckoutForm from '../components/CheckoutForm';
import '../styles/checkout.css';

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface SavedAddress {
  id: string;
  type: 'shipping' | 'billing' | 'both';
  first_name: string;
  last_name: string;
  full_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  formatted_address: string;
}

const CheckoutPage: React.FC = () => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US', // Use 2-letter code by default
  });
  
  // Dynamic calculation states
  const [calculatingTotals, setCalculatingTotals] = useState(false);
  const [checkoutTotals, setCheckoutTotals] = useState<any>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('standard');
  const [availableShippingMethods, setAvailableShippingMethods] = useState<any[]>([]);
  const [apiCalculationFailed, setApiCalculationFailed] = useState(false);
  const [lastCalculationTime, setLastCalculationTime] = useState(0);

  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Use dynamic totals if available, fallback to hardcoded for initial load
  const subtotal = checkoutTotals?.subtotal || total;
  const tax = checkoutTotals?.tax?.amount || (total * 0.08);
  const shipping = checkoutTotals?.shipping?.cost || 10.00;
  const grandTotal = checkoutTotals?.total || (total + tax + shipping);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    loadSavedAddresses();
  }, [isAuthenticated, items.length, navigate]);

  // Calculate totals when address or shipping method changes
  useEffect(() => {
    if (shippingAddress.city && shippingAddress.state && shippingAddress.postal_code && !apiCalculationFailed) {
      calculateCheckoutTotals();
    }
  }, [shippingAddress, selectedShippingMethod, items, apiCalculationFailed]);

  const calculateCheckoutTotals = async () => {
    if (!shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
      return;
    }

    // Prevent too frequent API calls (minimum 1 second between calls)
    const now = Date.now();
    if (now - lastCalculationTime < 1000) {
      console.log('Skipping calculation - too soon after last call');
      return;
    }
    setLastCalculationTime(now);

    setCalculatingTotals(true);
    try {
      // Prepare cart items for API with validation
      const cartItems = items
        .filter(item => item.product && item.product.id && item.quantity > 0)
        .map(item => ({
          product_id: parseInt(item.product.id.toString()), // Ensure integer
          quantity: parseInt(item.quantity.toString()) // Ensure integer
        }));

      // Validate we have valid cart items
      if (cartItems.length === 0) {
        console.error('No valid cart items found');
        return;
      }

      // Validate shipping address data
      if (!shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
        console.error('Missing required shipping address fields');
        return;
      }

      const requestData = {
        shipping_address: {
          country: shippingAddress.country || 'US',
          state: shippingAddress.state.trim(),
          city: shippingAddress.city.trim(),
          postal_code: shippingAddress.postal_code.trim()
        },
        shipping_method: selectedShippingMethod || 'standard',
        cart_items: cartItems
      };

      // Additional validation
      console.log('Cart items being sent:', cartItems);
      console.log('Shipping address being sent:', requestData.shipping_address);
      console.log('Selected shipping method:', requestData.shipping_method);

      console.log('Sending checkout calculation request:', requestData);

      const response = await checkoutApi.calculateTotals(requestData);

      if (response.success && response.data) {
        setCheckoutTotals(response.data);
        console.log('Checkout totals received:', response.data);
      } else {
        console.error('API response indicates failure:', response);
      }
    } catch (error: any) {
      console.error('Error calculating totals:', error);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error response headers:', error.response.headers);
        
        // Log specific validation errors if available
        if (error.response.data?.errors) {
          console.error('Detailed validation errors:', error.response.data.errors);
          
          // Show specific field errors
          Object.keys(error.response.data.errors).forEach(field => {
            console.error(`Validation error for ${field}:`, error.response.data.errors[field]);
          });
        }
        
        // If we get repeated 422 errors, disable API calculations
        if (error.response.status === 422) {
          console.warn('Disabling API calculations due to validation errors');
          setApiCalculationFailed(true);
        }
      }
      
      // Show user-friendly error message if available
      if (error.response?.data?.message) {
        console.warn('Backend validation error:', error.response.data.message);
      }
      
      // Keep using fallback calculations if API fails
    } finally {
      setCalculatingTotals(false);
    }
  };

  const loadShippingMethods = async () => {
    if (!shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
      return;
    }

    try {
      const response = await checkoutApi.getShippingMethods({
        country: shippingAddress.country,
        state: shippingAddress.state,
        city: shippingAddress.city,
        postal_code: shippingAddress.postal_code
      });

      if (response.success && response.data) {
        setAvailableShippingMethods(response.data);
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      // Set default shipping methods as fallback
      setAvailableShippingMethods([
        {
          id: 'standard',
          name: 'Standard Shipping',
          cost: 10.00,
          estimated_days: '3-7',
          description: 'Standard ground shipping'
        }
      ]);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const response = await addressApi.getUserAddresses();
      if (response.success && response.data) {
        setSavedAddresses(response.data);
        
        // Auto-select default address if available
        const defaultAddress = response.data.find((addr: SavedAddress) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setShippingAddress({
            name: defaultAddress.full_name,
            line1: defaultAddress.address_line_1,
            line2: defaultAddress.address_line_2 || '',
            city: defaultAddress.city,
            state: defaultAddress.state,
            postal_code: defaultAddress.postal_code,
            country: defaultAddress.country,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    
    if (addressId === 'new') {
      setShippingAddress({
        name: user?.name || '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US', // Use 2-letter code
      });
    } else {
      const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        const newAddress = {
          name: selectedAddress.full_name,
          line1: selectedAddress.address_line_1,
          line2: selectedAddress.address_line_2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          postal_code: selectedAddress.postal_code,
          // Convert country name to 2-letter code if needed
          country: selectedAddress.country === 'United States' ? 'US' : 
                   selectedAddress.country === 'Canada' ? 'CA' : 
                   selectedAddress.country === 'India' ? 'IN' : 
                   selectedAddress.country.length === 2 ? selectedAddress.country : 'US',
        };
        setShippingAddress(newAddress);
        
        // Load shipping methods for the selected address
        setTimeout(() => {
          loadShippingMethods();
        }, 100);
      }
    }
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    let processedValue = value;
    
    // Process specific fields
    if (field === 'state') {
      processedValue = value.toUpperCase().substring(0, 2); // Ensure 2-letter state code
    } else if (field === 'postal_code') {
      processedValue = value.replace(/[^0-9-]/g, '').substring(0, 10); // Only numbers and hyphens
    } else if (field === 'country') {
      // Convert full country names to 2-letter codes
      if (value === 'United States') processedValue = 'US';
      else if (value === 'Canada') processedValue = 'CA';
      else if (value === 'India') processedValue = 'IN';
      else processedValue = value.toUpperCase().substring(0, 2); // Fallback to 2-letter code
    }
    
    setShippingAddress(prev => {
      const newAddress = {
        ...prev,
        [field]: processedValue
      };
      
      // Trigger shipping methods reload when complete address is available
      if (field === 'postal_code' && newAddress.city && newAddress.state && processedValue) {
        setTimeout(() => {
          loadShippingMethods();
        }, 500); // Debounce the API call
      }
      
      return newAddress;
    });
  };

  const handleCreatePaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate user authentication
      if (!isAuthenticated || !user) {
        setError('Please log in to continue with payment');
        return;
      }

      // Validate shipping address
      if (!isFormValid()) {
        setError('Please complete all required shipping information');
        return;
      }

      // Validate cart items
      if (!items || items.length === 0) {
        setError('Your cart is empty');
        return;
      }

      // Create payment intent using the simple endpoint (no verification)
      const paymentData = {
        amount: Math.round(grandTotal * 100) / 100, // Ensure 2 decimal places
        currency: 'usd',
        // Add additional data that backend might need
        shipping_address: {
          name: shippingAddress.name,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country === 'United States' ? 'US' : 
                   shippingAddress.country === 'Canada' ? 'CA' : 
                   shippingAddress.country === 'India' ? 'IN' : 
                   shippingAddress.country // fallback to original value
        },
        metadata: {
          cart_items: items.length,
          user_id: user?.id || 'guest'
        }
      };

      console.log('Creating payment intent with data:', paymentData);
      console.log('Current cart items:', items.length);
      console.log('Shipping address valid:', isFormValid());

      let result;
      try {
        // Try simple endpoint first (no amount verification)
        result = await paymentApi.createPaymentIntentSimple(paymentData);
      } catch (simpleError: any) {
        // If simple endpoint doesn't exist, fall back to regular endpoint
        if (simpleError.response?.status === 404) {
          console.log('Simple endpoint not available, using regular endpoint');
          
          // Try with minimal data for regular endpoint
          const minimalPaymentData = {
            amount: Math.round(grandTotal * 100) / 100,
            currency: 'usd'
          };
          
          result = await paymentApi.createPaymentIntent(minimalPaymentData);
        } else {
          throw simpleError;
        }
      }

      if (result.success && result.data?.client_secret) {
        setClientSecret(result.data.client_secret);
      } else {
        setError(result.message || 'Failed to create payment intent');
      }
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      
      // Enhanced error logging for debugging
      if (error.response) {
        console.error('Payment error status:', error.response.status);
        console.error('Payment error data:', error.response.data);
        console.error('Payment error headers:', error.response.headers);
      }
      
      if (error.response?.status === 401) {
        setError('Please log in again to continue');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid payment information';
        setError(errorMessage);
      } else if (error.response?.status === 422) {
        // Handle validation errors specifically
        const validationErrors = error.response?.data?.errors || {};
        const errorMessage = error.response?.data?.message || 'Validation failed';
        
        console.error('Validation errors:', validationErrors);
        setError(`Payment validation failed: ${errorMessage}`);
      } else {
        setError('Failed to process payment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (orderNumber: string) => {
    clearCart();
    navigate('/order-confirmation', { state: { orderNumber } });
  };

  const handleAddNewAddress = async (addressData: any) => {
    try {
      const response = await addressApi.addUserAddress(addressData);
      if (response.success) {
        await loadSavedAddresses();
        setShowAddAddressModal(false);
      } else {
        setError(response.message || 'Failed to save address');
      }
    } catch (error: any) {
      console.error('Failed to add address:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save address');
    }
  };

  const isFormValid = () => {
    const isValid = shippingAddress.name && 
           shippingAddress.line1 && 
           shippingAddress.city && 
           shippingAddress.state && 
           shippingAddress.postal_code;
    
    // Additional validation for specific fields
    const isPostalCodeValid = /^[0-9]{5}(-[0-9]{4})?$/.test(shippingAddress.postal_code || '');
    const isStateValid = /^[A-Z]{2}$/.test(shippingAddress.state?.toUpperCase() || '');
    
    console.log('Form validation details:', {
      hasRequiredFields: !!isValid,
      postalCodeValid: isPostalCodeValid,
      stateValid: isStateValid,
      shippingAddress
    });
    
    return isValid && isPostalCodeValid;
  };

  return (
    <Container fluid className="checkout-page py-4" style={{ backgroundColor: '#f8f9fa' }}>
      <Row className="justify-content-center">
        <Col xl={10} lg={11}>
          <Row>
            {/* Left Column - Shipping & Payment */}
            <Col lg={7} className="pe-lg-4">
              <div className="checkout-sections">
                <h2 className="mb-4" style={{ color: '#582c00', fontWeight: '600' }}>Checkout</h2>

                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                {/* Shipping Address Section */}
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: '#582c00',
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}
                      >
                        🚚
                      </div>
                      <h5 className="mb-0" style={{ color: '#582c00', fontWeight: '600' }}>
                        Shipping Address
                        <small className="text-muted d-block" style={{ fontSize: '14px', fontWeight: '400' }}>
                          Where should we deliver your order?
                        </small>
                      </h5>
                    </div>

                    {/* Saved Addresses Selection */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#fefefe' }}>
                          <Row>
                            {savedAddresses.map((address) => (
                              <Col md={6} key={address.id} className="mb-3">
                                <div 
                                  className={`address-option p-3 border rounded ${selectedAddressId === address.id ? 'selected' : ''}`}
                                  onClick={() => handleAddressSelect(address.id)}
                                  style={{ 
                                    cursor: 'pointer',
                                    borderColor: selectedAddressId === address.id ? '#582c00' : '#e6e6e6',
                                    backgroundColor: selectedAddressId === address.id ? 'rgba(255, 205, 119, 0.1)' : 'white'
                                  }}
                                >
                                  <Form.Check
                                    type="radio"
                                    id={`address-${address.id}`}
                                    name="addressSelection"
                                    checked={selectedAddressId === address.id}
                                    onChange={() => handleAddressSelect(address.id)}
                                    className="custom-radio"
                                    label={
                                      <div className="ps-2 text-start">
                                        <div className="fw-semibold" style={{ color: '#582c00' }}>
                                          {address.full_name}
                                          {address.company && <div className="text-muted small">{address.company}</div>}
                                          {address.is_default && (
                                            <span 
                                              className="badge ms-2"
                                              style={{ backgroundColor: '#ffcd77', color: '#582c00' }}
                                            >
                                              Default
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-muted small text-start mt-1">
                                          {address.formatted_address}
                                        </div>
                                      </div>
                                    }
                                  />
                                </div>
                              </Col>
                            ))}
                            <Col md={6} className="mb-3">
                              <div 
                                className={`address-option p-3 border rounded ${selectedAddressId === 'new' ? 'selected' : ''}`}
                                onClick={() => handleAddressSelect('new')}
                                style={{ 
                                  cursor: 'pointer',
                                  borderColor: selectedAddressId === 'new' ? '#582c00' : '#e6e6e6',
                                  backgroundColor: selectedAddressId === 'new' ? 'rgba(255, 205, 119, 0.1)' : 'white'
                                }}
                              >
                                <Form.Check
                                  type="radio"
                                  id="address-new"
                                  name="addressSelection"
                                  checked={selectedAddressId === 'new'}
                                  onChange={() => handleAddressSelect('new')}
                                  className="custom-radio"
                                  label={
                                    <div className="ps-2 text-start">
                                      <div className="fw-semibold" style={{ color: '#582c00' }}>
                                        + Use new address
                                      </div>
                                      <div className="text-muted small text-start mt-1">
                                        Enter a new shipping address
                                      </div>
                                    </div>
                                  }
                                />
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    )}

                    {/* Address Form */}
                    <Form>
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Full Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={shippingAddress.name}
                              onChange={(e) => handleAddressChange('name', e.target.value)}
                              placeholder="Enter your full name"
                              className="form-control-custom"
                              style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Address Line 1</Form.Label>
                            <Form.Control
                              type="text"
                              value={shippingAddress.line1}
                              onChange={(e) => handleAddressChange('line1', e.target.value)}
                              placeholder="Street address"
                              className="form-control-custom"
                              style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Address Line 2 (Optional)</Form.Label>
                            <Form.Control
                              type="text"
                              value={shippingAddress.line2 || ''}
                              onChange={(e) => handleAddressChange('line2', e.target.value)}
                              placeholder="Apartment, suite, etc."
                              className="form-control-custom"
                              style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>City</Form.Label>
                            <Form.Control
                              type="text"
                              value={shippingAddress.city}
                              onChange={(e) => handleAddressChange('city', e.target.value)}
                              placeholder="City"
                              className="form-control-custom"
                              style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>State</Form.Label>
                            <Form.Control
                              type="text"
                              value={shippingAddress.state}
                              onChange={(e) => handleAddressChange('state', e.target.value)}
                              placeholder="NY"
                              className="form-control-custom"
                              style={{ 
                                borderColor: shippingAddress.state && !/^[A-Z]{2}$/.test(shippingAddress.state) ? '#dc3545' : '#e6e6e6', 
                                borderRadius: '8px' 
                              }}
                              maxLength={2}
                              required
                            />
                            {shippingAddress.state && !/^[A-Z]{2}$/.test(shippingAddress.state) && (
                              <small className="text-danger">Use 2-letter state code (e.g., NY, CA)</small>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>ZIP Code</Form.Label>
                            <Form.Control
                              type="text"
                              value={shippingAddress.postal_code}
                              onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                              placeholder="12345"
                              className="form-control-custom"
                              style={{ 
                                borderColor: shippingAddress.postal_code && !/^[0-9]{5}(-[0-9]{4})?$/.test(shippingAddress.postal_code) ? '#dc3545' : '#e6e6e6', 
                                borderRadius: '8px' 
                              }}
                              maxLength={10}
                              required
                            />
                            {shippingAddress.postal_code && !/^[0-9]{5}(-[0-9]{4})?$/.test(shippingAddress.postal_code) && (
                              <small className="text-danger">Use 5-digit ZIP code (e.g., 12345)</small>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      {selectedAddressId === 'new' && (
                        <div className="mb-3">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => setShowAddAddressModal(true)}
                            style={{ 
                              borderColor: '#582c00',
                              color: '#582c00'
                            }}
                          >
                            💾 Save this address for future use
                          </Button>
                        </div>
                      )}

                      {/* Shipping Method Selection */}
                      {availableShippingMethods.length > 0 && (
                        <div className="mb-3">
                          <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Shipping Method</Form.Label>
                          <div className="border rounded p-3" style={{ backgroundColor: '#fefefe' }}>
                            {availableShippingMethods.map((method) => (
                              <Form.Check
                                key={method.id}
                                type="radio"
                                id={`shipping-${method.id}`}
                                name="shippingMethod"
                                value={method.id}
                                checked={selectedShippingMethod === method.id}
                                onChange={(e) => setSelectedShippingMethod(e.target.value)}
                                className="mb-2"
                                label={
                                  <div className="d-flex justify-content-between align-items-center w-100">
                                    <div>
                                      <div className="fw-semibold" style={{ color: '#582c00' }}>
                                        {method.name}
                                      </div>
                                      <small className="text-muted">
                                        {method.description} • {method.estimated_days} days
                                      </small>
                                    </div>
                                    <div className="fw-semibold" style={{ color: '#582c00' }}>
                                      ${method.cost.toFixed(2)}
                                    </div>
                                  </div>
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </Form>
                  </Card.Body>
                </Card>

                {/* Payment Method Section */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: '#582c00',
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}
                      >
                        💳
                      </div>
                      <h5 className="mb-0" style={{ color: '#582c00', fontWeight: '600' }}>
                        Payment Method
                        <small className="text-muted d-block" style={{ fontSize: '14px', fontWeight: '400' }}>
                          Please choose your payment method
                        </small>
                      </h5>
                    </div>

                    {!clientSecret ? (
                      <div className="text-center py-4">
                        <p className="mb-3 text-muted">Please review your order and shipping information above.</p>
                        <Button
                          onClick={handleCreatePaymentIntent}
                          disabled={loading || !isFormValid() || items.length === 0}
                          size="lg"
                          style={{ 
                            backgroundColor: '#582c00',
                            borderColor: '#582c00',
                            borderRadius: '8px',
                            fontWeight: '600',
                            padding: '12px 30px'
                          }}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Processing...
                            </>
                          ) : (
                            'Continue to Payment'
                          )}
                        </Button>
                        {!isFormValid() && (
                          <small className="text-muted d-block mt-2">
                            Please fill in all required shipping information
                          </small>
                        )}
                        {items.length === 0 && (
                          <small className="text-danger d-block mt-2">
                            Your cart is empty. Please add items before checkout.
                          </small>
                        )}
                      </div>
                    ) : (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#582c00',
                              colorBackground: '#ffffff',
                              colorText: '#30313d',
                              colorDanger: '#df1b41',
                              borderRadius: '8px',
                            },
                          },
                        }}
                      >
                        <CheckoutForm
                          clientSecret={clientSecret}
                          shippingAddress={shippingAddress}
                          onSuccess={handlePaymentSuccess}
                        />
                      </Elements>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </Col>

            {/* Right Column - Order Summary */}
            <Col lg={5}>
              <div className="order-summary-sticky" style={{ position: 'sticky', top: '20px' }}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="mb-4" style={{ color: '#582c00', fontWeight: '600' }}>
                      Order Summary
                    </h5>

                    {/* Cart Items */}
                    <div className="cart-items mb-4">
                      {items.map((item) => (
                        <div key={item.id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                          <div className="flex-grow-1 text-start">
                            <h6 className="mb-1 text-start" style={{ color: '#582c00', fontWeight: '500' }}>
                              {item.product.name}
                            </h6>
                            <small className="text-muted text-start">Qty: {item.quantity}</small>
                          </div>
                          <div className="text-end">
                            <span className="fw-semibold" style={{ color: '#582c00' }}>
                              ${(parseFloat(item.product.sale_price || item.product.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr className="my-4" />

                    {/* Order Totals */}
                    <div className="order-totals text-start">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted text-start">Subtotal:</span>
                        <span className="text-end" style={{ color: '#582c00' }}>
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted text-start">
                          Shipping:
                          {checkoutTotals?.shipping?.description && (
                            <small className="d-block" style={{ fontSize: '12px' }}>
                              {checkoutTotals.shipping.description}
                            </small>
                          )}
                        </span>
                        <span className="text-end" style={{ color: '#582c00' }}>
                          {calculatingTotals ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            `$${shipping.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted text-start">
                          Tax:
                          {checkoutTotals?.tax?.description && (
                            <small className="d-block" style={{ fontSize: '12px' }}>
                              {checkoutTotals.tax.description}
                              {checkoutTotals.tax.rate && ` (${(checkoutTotals.tax.rate * 100).toFixed(1)}%)`}
                            </small>
                          )}
                        </span>
                        <span className="text-end" style={{ color: '#582c00' }}>
                          {calculatingTotals ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            `$${tax.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      
                      <hr />
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 mb-0 text-start" style={{ color: '#582c00', fontWeight: '600' }}>Total:</span>
                        <span className="h5 mb-0 text-end" style={{ color: '#582c00', fontWeight: '700' }}>
                          {calculatingTotals ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            `$${grandTotal.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      
                      {/* Enhanced shipping and breakdown info */}
                      <div 
                        className="text-center mt-3 py-2 px-3 rounded"
                        style={{ backgroundColor: '#fff3d0', color: '#582c00' }}
                      >
                        <small className="fw-semibold">
                          {checkoutTotals?.shipping?.estimated_days ? (
                            `🚚 Estimated delivery: ${checkoutTotals.shipping.estimated_days} days`
                          ) : (
                            '🎉 Free shipping on orders over $50'
                          )}
                        </small>
                      </div>

                      {/* Items count and weight info */}
                      {checkoutTotals?.breakdown && (
                        <div className="text-center mt-2">
                          <small className="text-muted">
                            {checkoutTotals.breakdown.items_count} item{checkoutTotals.breakdown.items_count !== 1 ? 's' : ''}
                            {checkoutTotals.breakdown.total_weight && ` • ${checkoutTotals.breakdown.total_weight} oz`}
                          </small>
                        </div>
                      )}

                      {/* Calculation status */}
                      {calculatingTotals && (
                        <div className="text-center mt-2">
                          <small className="text-muted">Updating totals...</small>
                        </div>
                      )}

                      {/* API calculation status */}
                      {apiCalculationFailed && (
                        <div className="text-center mt-2">
                          <small className="text-warning d-block">
                            ⚠️ Using estimated calculations (API temporarily unavailable)
                          </small>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 mt-1"
                            style={{ fontSize: '12px', color: '#582c00' }}
                            onClick={() => {
                              setApiCalculationFailed(false);
                              setLastCalculationTime(0);
                              calculateCheckoutTotals();
                            }}
                          >
                            🔄 Retry calculation
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Add New Address Modal */}
      <AddAddressModal
        show={showAddAddressModal}
        onHide={() => setShowAddAddressModal(false)}
        onSave={handleAddNewAddress}
        user={user}
      />
    </Container>
  );
};

// Add Address Modal Component
const AddAddressModal: React.FC<{
  show: boolean;
  onHide: () => void;
  onSave: (address: any) => void;
  user: any;
}> = ({ show, onHide, onSave, user }) => {
  const [formData, setFormData] = useState({
    type: 'shipping' as const,
    first_name: user?.name?.split(' ')[0] || '',
    last_name: user?.name?.split(' ').slice(1).join(' ') || '',
    company: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US', // Use 2-letter code
    phone: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await onSave(formData);
      setFormData({
        type: 'shipping' as const,
        first_name: user?.name?.split(' ')[0] || '',
        last_name: user?.name?.split(' ').slice(1).join(' ') || '',
        company: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
        phone: '',
        is_default: false,
      });
    } catch (error: any) {
      console.error('Error saving address:', error);
      setError(error.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #e6e6e6' }}>
        <Modal.Title style={{ color: '#582c00', fontWeight: '600' }}>
          💾 Add New Address
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ padding: '2rem' }}>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Company (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Address Line 1</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.address_line_1}
                  onChange={(e) => handleChange('address_line_1', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Address Line 2 (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.address_line_2}
                  onChange={(e) => handleChange('address_line_2', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>City</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>State</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>ZIP Code</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Country</Form.Label>
                <Form.Select
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="IN">India</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Phone (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Address Type</Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="form-control-custom"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                  <option value="both">Both</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3 d-flex align-items-end">
                <Form.Check
                  type="checkbox"
                  label="Set as default address"
                  checked={formData.is_default}
                  onChange={(e) => handleChange('is_default', e.target.checked)}
                  className="custom-radio"
                  style={{ marginBottom: '8px' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e6e6e6', padding: '1.5rem 2rem' }}>
          <Button 
            variant="outline-secondary" 
            onClick={onHide}
            style={{ borderColor: '#e6e6e6', color: '#6c757d' }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
            style={{ 
              backgroundColor: '#582c00',
              borderColor: '#582c00',
              fontWeight: '600'
            }}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Address'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CheckoutPage;