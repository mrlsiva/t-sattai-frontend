import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { paymentApi } from '../services/api';

interface CheckoutFormProps {
  clientSecret: string;
  shippingAddress: any;
  onSuccess: (orderNumber: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, shippingAddress, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

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
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment with our backend
        const result = await paymentApi.confirmPayment(paymentIntent.id, shippingAddress);
        
        if (result.success) {
          onSuccess(result.data.order_number);
        } else {
          throw new Error(result.message || 'Failed to create order');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
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
          disabled={!stripe || loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing Payment...
            </>
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