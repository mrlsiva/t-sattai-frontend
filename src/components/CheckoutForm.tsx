import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { paymentApi } from '../services/api';

interface CheckoutFormProps {
  clientSecret: string;
  shippingAddress: any;
  cartItems: Array<{ product_id: number; quantity: number; price: number }>;
  onSuccess: (orderNumber: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, shippingAddress, cartItems, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);

  // Reset states when clientSecret changes (new payment intent)
  useEffect(() => {
    setPaymentProcessed(false);
    setIsProcessing(false);
    setError(null);
    setLoading(false);
  }, [clientSecret]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Prevent double submissions
    if (!stripe || !elements || isProcessing || paymentProcessed) {
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-success',
          // Don't set shipping here since it's already set server-side
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        // Check if error is due to payment already being confirmed
        if (stripeError.code === 'payment_intent_unexpected_state') {
          setError('This payment has already been processed. Please check your orders or contact support.');
          setPaymentProcessed(true);
        } else {
          setError(stripeError.message || 'Payment failed');
        }
        setLoading(false);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Mark as processed to prevent re-submission
        setPaymentProcessed(true);
        
        // Confirm payment with our backend
        const result = await paymentApi.confirmPayment(paymentIntent.id, shippingAddress, cartItems);
        
        if (result.success) {
          onSuccess(result.data.order_number);
        } else {
          throw new Error(result.message || 'Failed to create order');
        }
      }
    } catch (err: any) {
      // Check for duplicate payment error
      if (err.message?.includes('already succeeded') || err.message?.includes('already confirmed')) {
        setError('This payment has already been processed. Please check your orders.');
        setPaymentProcessed(true);
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
      setIsProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <PaymentElement />
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <div className="d-grid">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!stripe || loading || isProcessing || paymentProcessed}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing Payment...
            </>
          ) : paymentProcessed ? (
            'Payment Completed'
          ) : (
            'Complete Payment'
          )}
        </Button>
      </div>

      <div className="text-center mt-3">
        <small className="text-muted">
          <i className="bi bi-shield-check me-1"></i>
          Your payment information is secure and encrypted
        </small>
      </div>
    </form>
  );
};

export default CheckoutForm;