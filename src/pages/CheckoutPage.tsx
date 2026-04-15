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
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN', // India only
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
  const tax = checkoutTotals?.tax?.amount || (total * 0.18); // 18% GST for India
  const shipping = checkoutTotals?.shipping?.cost || 50.00; // ₹50 for India
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          country: 'IN', // India only
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
        // Sync selectedShippingMethod with backend's returned method if available
        if (response.data.shipping && response.data.shipping.id) {
          setSelectedShippingMethod(response.data.shipping.id);
        }
        console.log('Checkout totals received:', response.data);
      } else {
        console.error('API response indicates failure:', response);
      }
    } catch (error: any) {
      console.error('Error calculating totals:', error);
      
      // Check for timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('10000ms exceeded')) {
        console.warn('Request timed out - switching to fallback calculations');
        setApiCalculationFailed(true);
        setError('Connection timeout. We\'re using estimated calculations for now. You can retry to get exact totals.');
      } else if (error.response) {
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
      } else {
        // Network or other errors
        console.warn('Network error or other issue - switching to fallback calculations');
        setApiCalculationFailed(true);
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
        country: 'IN', // India only
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
          cost: 50.00, // ₹50 for India
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
        country: 'IN', // India only
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
          country: 'IN', // India only
        };
        setShippingAddress(newAddress);
        
        // Load shipping methods for the selected address
        setTimeout(() => {
          loadShippingMethods();
        }, 100);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    let processedValue = value;
    
    // Process specific fields
    if (field === 'state') {
      processedValue = value.substring(0, 30); // Indian state names can be longer
    } else if (field === 'postal_code') {
      processedValue = value.replace(/[^0-9]/g, '').substring(0, 6); // 6-digit PIN code for India
    } else if (field === 'country') {
      processedValue = 'IN'; // Always India
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
        currency: 'inr', // Indian Rupees
        // Add cart items for backend
        cart_items: items.map(item => ({
          product_id: parseInt(item.product.id.toString()),
          quantity: item.quantity,
          price: parseFloat(item.product.sale_price || item.product.price)
        })),
        // Add additional data that backend might need
        shipping_address: {
          name: shippingAddress.name,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: 'IN' // India only
        },
        metadata: {
          cart_items_count: items.length,
          user_id: user?.id || 'guest'
        }
      };

      console.log('Creating payment intent with data:', paymentData);
      console.log('Current cart items:', items);
      console.log('Cart items count:', items.length);
      console.log('Shipping address valid:', isFormValid());

      let result;
      try {
        // Try simple endpoint first (no amount verification)
        result = await paymentApi.createPaymentIntentSimple(paymentData);
      } catch (simpleError: any) {
        // If simple endpoint doesn't exist, fall back to regular endpoint
        if (simpleError.response?.status === 404) {
          console.log('Simple endpoint not available, using regular endpoint');
          
          // Try with minimal data for regular endpoint - include cart items
          const minimalPaymentData = {
            amount: Math.round(grandTotal * 100) / 100,
            currency: 'inr', // Indian Rupees
            cart_items: items.map(item => ({
              product_id: parseInt(item.product.id.toString()),
              quantity: item.quantity,
              price: parseFloat(item.product.sale_price || item.product.price)
            }))
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
    // Reset client secret to prevent re-use
    setClientSecret('');
    
    // Prepare order details for confirmation page
    const orderData = {
      orderNumber,
      total: grandTotal,
      items: items,
      shippingAddress: shippingAddress,
      estimatedDelivery: availableShippingMethods.length > 0 
        ? availableShippingMethods.find(method => method.id === selectedShippingMethod)?.estimated_days || '5-7 business days'
        : '5-7 business days',
      subtotal: subtotal,
      tax: tax,
      shipping: shipping
    };

    clearCart();
    navigate('/order-confirmation', { state: orderData });
  };

  const handleAddNewAddress = async (addressData: any) => {
    try {
      let response;
      if (editingAddress) {
        // Update existing address
        response = await addressApi.updateAddress(editingAddress.id, addressData);
      } else {
        // Add new address
        response = await addressApi.addUserAddress(addressData);
      }
      
      if (response.success) {
        await loadSavedAddresses();
        setShowAddAddressModal(false);
        setEditingAddress(null);
      } else {
        setError(response.message || 'Failed to save address');
      }
    } catch (error: any) {
      console.error('Failed to save address:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save address');
    }
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setShowAddAddressModal(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await addressApi.deleteAddress(addressId);
        if (response.success) {
          await loadSavedAddresses();
          // If deleted address was selected, reset to new
          if (selectedAddressId === addressId) {
            setSelectedAddressId('new');
          }
        } else {
          setError(response.message || 'Failed to delete address');
        }
      } catch (error: any) {
        console.error('Failed to delete address:', error);
        setError(error.response?.data?.message || error.message || 'Failed to delete address');
      }
    }
  };

  const isFormValid = () => {
    const isValid = shippingAddress.name && 
           shippingAddress.line1 && 
           shippingAddress.city && 
           shippingAddress.state && 
           shippingAddress.postal_code;
    
    // Additional validation for Indian addresses
    const isPinCodeValid = /^[0-9]{6}$/.test(shippingAddress.postal_code || '');
    const isStateValid = shippingAddress.state && shippingAddress.state.length >= 2;
    
    console.log('Form validation details:', {
      hasRequiredFields: !!isValid,
      pinCodeValid: isPinCodeValid,
      stateValid: isStateValid,
      shippingAddress
    });
    
    return isValid && isPinCodeValid;
  };

  return (
    <Container fluid className="checkout-page py-4" style={{ backgroundColor: '#f8f9fa' }}>
      <Row className="justify-content-center">
        <Col xl={10} lg={11}>
          {/* Main Checkout Title */}
          <h2 className="mb-4 text-start" style={{ color: '#582c00', fontWeight: '600' }}>Checkout</h2>
          
          <Row>
            {/* Left Column - Shipping & Payment */}
            <Col lg={7} className="pe-lg-4">
              <div className="checkout-sections">

                {error && (
                  <Alert variant="danger" className="mb-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-start flex-grow-1">
                        <i className="fas fa-exclamation-circle me-2 mt-1"></i>
                        <div className="text-start">
                          <strong>Oops! Something went wrong</strong>
                          <div className="mt-1 text-start">{error}</div>
                        </div>
                      </div>
                      {error.includes('timeout') && (
                        <div className="ms-3 flex-shrink-0 d-flex align-items-center">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setError(null);
                              setApiCalculationFailed(false);
                              setLastCalculationTime(0);
                              calculateCheckoutTotals();
                            }}
                            style={{ fontSize: '12px' }}
                          >
                            <i className="fas fa-redo me-1"></i>Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  </Alert>
                )}

                {/* Shipping Address Section */}
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3 p-3 rounded" style={{ backgroundColor: '#f8f5f0' }}>
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
                        <i className="fas fa-shipping-fast"></i>
                      </div>
                      <h5 className="mb-0 text-start" style={{ color: '#582c00', fontWeight: '600' }}>
                        Shipping Address
                        <small className="text-muted d-block text-start" style={{ fontSize: '14px', fontWeight: '400' }}>
                          Where should we deliver your order?
                        </small>
                      </h5>
                    </div>

                    {/* Saved Addresses Selection */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <div style={{ backgroundColor: '#fefefe' }}>
                          <Row>
                            {savedAddresses.map((address) => (
                              <Col md={6} key={address.id} className="mb-3">
                                <div 
                                  className={`address-option p-3 border rounded position-relative ${selectedAddressId === address.id ? 'selected' : ''}`}
                                  onClick={() => handleAddressSelect(address.id)}
                                  style={{ 
                                    cursor: 'pointer',
                                    borderColor: selectedAddressId === address.id ? '#582c00' : '#e6e6e6',
                                    backgroundColor: selectedAddressId === address.id ? 'rgba(255, 205, 119, 0.1)' : 'white',
                                    height: '180px',
                                    display: 'flex',
                                    flexDirection: 'column'
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
                                      <div className="ps-2 text-start flex-grow-1">
                                        {address.is_default && (
                                          <span 
                                            className="badge position-absolute"
                                            style={{ 
                                              backgroundColor: '#ffcd77', 
                                              color: '#582c00',
                                              top: '10px',
                                              right: '10px',
                                              fontSize: '10px',
                                              padding: '4px 8px'
                                            }}
                                          >
                                            Default
                                          </span>
                                        )}
                                        <div className="fw-semibold" style={{ color: '#582c00' }}>
                                          {address.full_name}
                                          {address.company && <div className="text-muted small">{address.company}</div>}
                                        </div>
                                        <div className="text-muted small text-start mt-1">
                                          {address.formatted_address}
                                        </div>
                                        <div className="mt-auto pt-2">
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditAddress(address);
                                            }}
                                            style={{ 
                                              borderColor: '#582c00',
                                              color: '#582c00',
                                              fontSize: '12px',
                                              transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = '#582c00';
                                              e.currentTarget.style.color = 'white';
                                              e.currentTarget.style.borderColor = '#582c00';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                              e.currentTarget.style.color = '#582c00';
                                              e.currentTarget.style.borderColor = '#582c00';
                                            }}
                                          >
                                            <i className="fas fa-edit me-1"></i>Edit
                                          </Button>
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteAddress(address.id);
                                            }}
                                            style={{ fontSize: '12px' }}
                                          >
                                            <i className="fas fa-trash me-1"></i>Delete
                                          </Button>
                                        </div>
                                      </div>
                                    }
                                  />
                                </div>
                              </Col>
                            ))}
                            <Col md={6} className="mb-3">
                              <div 
                                className="address-option p-3 border rounded position-relative"
                                onClick={() => setShowAddAddressModal(true)}
                                style={{ 
                                  cursor: 'pointer',
                                  borderColor: '#e6e6e6',
                                  backgroundColor: 'white',
                                  height: '180px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#582c00';
                                  e.currentTarget.style.backgroundColor = 'rgba(255, 205, 119, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#e6e6e6';
                                  e.currentTarget.style.backgroundColor = 'white';
                                }}
                              >
                                <div className="text-center d-flex flex-column justify-content-center align-items-center h-100 w-100">
                                  <div className="mb-3">
                                    <i className="fas fa-plus-circle" style={{ 
                                      fontSize: '2rem', 
                                      color: '#582c00',
                                      opacity: 0.7
                                    }}></i>
                                  </div>
                                  <div className="fw-semibold" style={{ color: '#582c00' }}>
                                    Add New Address
                                  </div>
                                  <div className="text-muted small mt-1">
                                    Click to add a new shipping address
                                  </div>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    )}

                    {/* Shipping Method Selection - Always show */}
                    {availableShippingMethods.length > 0 && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-3 p-3 rounded" style={{ backgroundColor: '#f8f5f0' }}>
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
                            <i className="fas fa-truck"></i>
                          </div>
                          <h5 className="mb-0 text-start" style={{ color: '#582c00', fontWeight: '600' }}>
                            Shipping Method
                            <small className="text-muted d-block text-start" style={{ fontSize: '14px', fontWeight: '400' }}>
                              Choose how you'd like to receive your order
                            </small>
                          </h5>
                        </div>
                        <div className="border rounded p-3" style={{ backgroundColor: '#fefefe' }}>
                          {availableShippingMethods.map((method) => {
                            // If checkoutTotals.shipping exists, always highlight and show its info
                            const isSelected = (checkoutTotals?.shipping?.id
                              ? checkoutTotals.shipping.id === method.id
                              : selectedShippingMethod === method.id);
                            return (
                              <div key={method.id} className="mb-2 d-flex align-items-start" style={{ width: '100%' }}>
                                <Form.Check
                                  type="radio"
                                  id={`shipping-${method.id}`}
                                  name="shippingMethod"
                                  value={method.id}
                                  checked={isSelected}
                                  onChange={(e) => setSelectedShippingMethod(e.target.value)}
                                  className="me-3"
                                  style={{ marginTop: '2px' }}
                                />
                                <label 
                                  htmlFor={`shipping-${method.id}`} 
                                  className="form-check-label flex-grow-1"
                                  style={{ width: '100%', display: 'block', cursor: 'pointer' }}
                                >
                                  <div className="d-flex justify-content-between align-items-center" style={{ width: '100%' }}>
                                    <div className="text-start">
                                      <div className="fw-semibold text-start" style={{ color: '#582c00' }}>
                                        {/* Always show backend's shipping name if this is the selected one */}
                                        {isSelected && checkoutTotals?.shipping?.name
                                          ? checkoutTotals.shipping.name
                                          : method.name}
                                      </div>
                                      <small className="text-muted text-start">
                                        {isSelected && checkoutTotals?.shipping?.description
                                          ? `${checkoutTotals.shipping.description} • ${checkoutTotals.shipping.estimated_days} days`
                                          : `${method.description} • ${method.estimated_days} days`}
                                      </small>
                                    </div>
                                    <div className="fw-semibold d-flex align-items-center" style={{ color: '#582c00' }}>
                                      ₹{(isSelected && checkoutTotals?.shipping?.cost !== undefined
                                        ? checkoutTotals.shipping.cost
                                        : method.cost).toFixed(2)}
                                    </div>
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Payment Method Section */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3 p-3 rounded" style={{ backgroundColor: '#f8f5f0' }}>
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
                        <i className="fas fa-credit-card"></i>
                      </div>
                      <h5 className="mb-0 text-start" style={{ color: '#582c00', fontWeight: '600' }}>
                        Payment Method
                        <small className="text-muted d-block text-start" style={{ fontSize: '14px', fontWeight: '400' }}>
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
                          cartItems={items.map(item => ({
                            product_id: parseInt(item.product.id.toString()),
                            quantity: item.quantity,
                            price: parseFloat(item.product.sale_price || item.product.price),
                          }))}
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
                    <div className="d-flex align-items-center mb-4 p-3 rounded" style={{ backgroundColor: '#f8f5f0' }}>
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
                        <i className="fas fa-receipt"></i>
                      </div>
                      <h5 className="mb-0 text-start" style={{ color: '#582c00', fontWeight: '600' }}>
                        Order Summary
                        <small className="text-muted d-block text-start" style={{ fontSize: '14px', fontWeight: '400' }}>
                          Review your items and total
                        </small>
                      </h5>
                    </div>

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
                              ₹{(parseFloat(item.product.sale_price || item.product.price) * item.quantity).toFixed(2)}
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
                          ₹{subtotal.toFixed(2)}
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
                            `₹${shipping.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted text-start">
                          GST (18%):
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
                            `₹${tax.toFixed(2)}`
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
                            `₹${grandTotal.toFixed(2)}`
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
                            <>
                              <i className="fas fa-truck me-1"></i>
                              Estimated delivery: {checkoutTotals.shipping.estimated_days} days
                            </>
                          ) : (
                            <>
                              <i className="fas fa-gift me-1"></i>
                              Free shipping on orders over ₹2000
                            </>
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
                        <div className="text-center mt-3">
                          <div 
                            className="alert alert-warning py-2 px-3 mb-2"
                            style={{ 
                              backgroundColor: '#fff3cd', 
                              borderColor: '#ffeaa7',
                              color: '#856404',
                              fontSize: '14px'
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-center mb-2">
                              <i className="fas fa-exclamation-triangle me-2"></i>
                              <strong>Connection Issue</strong>
                            </div>
                            <div className="text-center mb-2">
                              We're having trouble connecting to our servers. Don't worry - we're showing estimated totals so you can continue with your order.
                            </div>
                            <Button
                              variant="warning"
                              size="sm"
                              className="mt-2"
                              style={{ 
                                backgroundColor: '#ffc107',
                                borderColor: '#ffc107',
                                color: '#000',
                                fontWeight: '600',
                                fontSize: '12px',
                                padding: '6px 16px'
                              }}
                              onClick={() => {
                                setApiCalculationFailed(false);
                                setLastCalculationTime(0);
                                setError(null);
                                calculateCheckoutTotals();
                              }}
                            >
                              <i className="fas fa-redo me-1"></i>Try Again
                            </Button>
                          </div>
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
        onHide={() => {
          setShowAddAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={handleAddNewAddress}
        user={user}
        editingAddress={editingAddress}
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
  editingAddress: SavedAddress | null;
}> = ({ show, onHide, onSave, user, editingAddress }) => {
  const [formData, setFormData] = useState({
    type: 'shipping' as 'shipping' | 'billing' | 'both',
    first_name: user?.name?.split(' ')[0] || '',
    last_name: user?.name?.split(' ').slice(1).join(' ') || '',
    company: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN', // India only
    phone: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with editing address data
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        type: editingAddress.type,
        first_name: editingAddress.first_name,
        last_name: editingAddress.last_name,
        company: editingAddress.company || '',
        address_line_1: editingAddress.address_line_1,
        address_line_2: editingAddress.address_line_2 || '',
        city: editingAddress.city,
        state: editingAddress.state,
        postal_code: editingAddress.postal_code,
        country: 'IN', // India only
        phone: editingAddress.phone || '',
        is_default: editingAddress.is_default,
      });
    } else {
      setFormData({
        type: 'shipping' as 'shipping' | 'billing' | 'both',
        first_name: user?.name?.split(' ')[0] || '',
        last_name: user?.name?.split(' ').slice(1).join(' ') || '',
        company: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'IN', // India only
        phone: '',
        is_default: false,
      });
    }
  }, [editingAddress, user]);

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
        type: 'shipping' as 'shipping' | 'billing' | 'both',
        first_name: user?.name?.split(' ')[0] || '',
        last_name: user?.name?.split(' ').slice(1).join(' ') || '',
        company: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'IN', // India only
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
          {editingAddress ? (
            <>
              <i className="fas fa-edit me-2"></i>Edit Address
            </>
          ) : (
            <>
              <i className="fas fa-plus me-2"></i>Add New Address
            </>
          )}
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
            <Col md={4}>
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
            <Col md={4}>
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
            <Col md={4}>
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
            <Col md={4}>
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
            <Col md={4}>
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
            <Col md={4}>
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
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>State</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="form-control-custom"
                  placeholder="Maharashtra"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>PIN Code</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                  className="form-control-custom"
                  placeholder="400001"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                  maxLength={6}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ color: '#582c00' }}>Phone (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="form-control-custom"
                  placeholder="+91 9876543210"
                  style={{ borderColor: '#e6e6e6', borderRadius: '8px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
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
            <Col md={4}>
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
            <Col md={4}>
              {/* Empty column for alignment */}
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
                {editingAddress ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              editingAddress ? 'Update Address' : 'Save Address'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CheckoutPage;