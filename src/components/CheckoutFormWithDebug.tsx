import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import { paymentApi } from '../services/api';
import { stripeDebugger, debugStripeError, debugAPIError } from '../utils/stripeDebugger';

interface CheckoutFormProps {
  clientSecret: string;
  shippingAddress: any;
  onSuccess: (orderNumber: string) => void;
}

interface DebugInfo {
  environmentIssues?: string[];
  authStatus?: {
    hasToken: boolean;
    tokenLength: number;
    tokenPrefix: string;
  };
  stripeError?: any;
  backendError?: {
    message: string;
    status?: number;
    data?: any;
    guidance?: {
      type: string;
      missingColumn?: string;
      recommendations: string[];
      sqlHint?: string | null;
    };
  };
  backendTest?: any;
  unexpectedError?: string;
  paymentIntentId?: string;
  paymentStatus?: string;
  refreshResult?: {
    status: string;
    message: string;
  };
}

const CheckoutFormWithDebug: React.FC<CheckoutFormProps> = ({ 
  clientSecret, 
  shippingAddress, 
  onSuccess 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Validate environment on component mount
  React.useEffect(() => {
    const issues = stripeDebugger.validateEnvironment();
    const token = localStorage.getItem('auth_token');
    
    // Check authentication status
    const authStatus = {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'none'
    };

    if (issues.length > 0) {
      setDebugInfo({ environmentIssues: issues, authStatus });
    } else {
      setDebugInfo({ authStatus });
    }

    // Log component initialization with auth info
    stripeDebugger.info('CheckoutForm initialized', {
      clientSecret: clientSecret ? `${clientSecret.substring(0, 20)}...` : 'missing',
      stripeLoaded: !!stripe,
      elementsLoaded: !!elements,
      shippingAddress,
      authentication: authStatus
    });

    // Warn if no authentication token
    if (!token) {
      stripeDebugger.warn('No authentication token found', {
        recommendation: 'User should be logged in before checkout',
        currentToken: 'missing'
      });
    }
  }, [clientSecret, stripe, elements, shippingAddress]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    stripeDebugger.info('Payment submission started');

    if (!stripe || !elements) {
      const errorMsg = 'Stripe or Elements not loaded';
      stripeDebugger.error(errorMsg, { stripe: !!stripe, elements: !!elements });
      setError(errorMsg);
      return;
    }

    if (!clientSecret) {
      const errorMsg = 'Client secret is missing';
      stripeDebugger.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Extract payment intent ID from client secret for debugging
      const paymentIntentId = clientSecret.split('_secret_')[0];
      stripeDebugger.logPaymentConfirmation(paymentIntentId, clientSecret, shippingAddress);

      // Test 1: Check if payment intent exists and is in correct state
      stripeDebugger.info('Attempting to retrieve payment intent status');
      
      const retrieveResult = await stripe.retrievePaymentIntent(clientSecret);
      if (retrieveResult.error) {
        debugStripeError(retrieveResult.error, 'retrievePaymentIntent');
        throw new Error(`Payment Intent retrieval failed: ${retrieveResult.error.message}`);
      }

      stripeDebugger.info('Payment Intent retrieved successfully', {
        id: retrieveResult.paymentIntent?.id,
        status: retrieveResult.paymentIntent?.status,
        amount: retrieveResult.paymentIntent?.amount,
        currency: retrieveResult.paymentIntent?.currency,
        confirmation_method: retrieveResult.paymentIntent?.confirmation_method,
        payment_method: retrieveResult.paymentIntent?.payment_method,
        client_secret: retrieveResult.paymentIntent?.client_secret ? 'present' : 'missing',
        last_payment_error: retrieveResult.paymentIntent?.last_payment_error
      });

      // Check if PaymentIntent is in a valid state for confirmation
      const validStates = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
      const currentStatus = retrieveResult.paymentIntent?.status;
      
      if (currentStatus && !validStates.includes(currentStatus)) {
        const errorMsg = `PaymentIntent is in unexpected state: ${currentStatus}. Expected one of: ${validStates.join(', ')}`;
        stripeDebugger.error('PaymentIntent state validation failed', {
          currentStatus,
          validStates,
          recommendation: currentStatus === 'succeeded' ? 'Payment already completed' : 
                         currentStatus === 'canceled' ? 'Payment was canceled, create new PaymentIntent' :
                         currentStatus === 'processing' ? 'Payment is still processing, wait or check status' :
                         'Create a new PaymentIntent'
        });
        
        setError(`Payment Error: ${errorMsg}`);
        setDebugInfo(prev => ({
          ...prev,
          stripeError: {
            type: 'payment_intent_unexpected_state',
            currentStatus,
            validStates,
            recommendation: 'PaymentIntent needs to be recreated'
          }
        }));
        setLoading(false);
        return;
      }

      // Test 2: Confirm payment with Stripe
      stripeDebugger.info('Attempting payment confirmation with Stripe');
      
      const confirmResult = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-success',
          // Remove shipping from confirmParams since it was set server-side
          // shipping: {
          //   name: shippingAddress.name,
          //   address: {
          //     line1: shippingAddress.line1,
          //     line2: shippingAddress.line2 || undefined,
          //     city: shippingAddress.city,
          //     state: shippingAddress.state,
          //     postal_code: shippingAddress.postal_code,
          //     country: shippingAddress.country,
          //   },
          // },
        },
        redirect: 'if_required',
      });

      stripeDebugger.logStripeConfirmationResult(confirmResult);

      if (confirmResult.error) {
        debugStripeError(confirmResult.error, 'confirmPayment');
        
        // Provide specific error guidance based on error type
        let userErrorMessage = confirmResult.error.message || 'Payment failed';
        
        if (confirmResult.error.type === 'card_error') {
          userErrorMessage = `Card Error: ${confirmResult.error.message}`;
        } else if (confirmResult.error.type === 'validation_error') {
          userErrorMessage = `Validation Error: ${confirmResult.error.message}`;
        } else if (confirmResult.error.code === 'payment_intent_unexpected_state') {
          userErrorMessage = 'Payment is in an unexpected state. Please refresh and try again.';
          
          stripeDebugger.error('Payment Intent unexpected state error', {
            errorCode: confirmResult.error.code,
            message: confirmResult.error.message,
            possibleCauses: [
              'PaymentIntent already succeeded',
              'PaymentIntent was canceled',
              'PaymentIntent is still processing',
              'PaymentIntent requires different action'
            ],
            recommendations: [
              'Check PaymentIntent status in Stripe Dashboard',
              'Create a new PaymentIntent',
              'Wait if payment is processing',
              'Refresh the page and start checkout again'
            ]
          });
          
          setDebugInfo(prev => ({
            ...prev,
            stripeError: {
              type: confirmResult.error.type,
              code: confirmResult.error.code,
              message: confirmResult.error.message,
              troubleshooting: {
                step1: 'Check Stripe Dashboard for PaymentIntent status',
                step2: 'Try refreshing the page and starting checkout again',
                step3: 'Clear browser cache and localStorage',
                step4: 'Create a new PaymentIntent if issue persists'
              }
            }
          }));
        } else if (confirmResult.error.code === 'payment_intent_invalid_parameter') {
          userErrorMessage = 'Payment configuration error. The shipping information was set server-side and cannot be modified from the frontend.';
          stripeDebugger.error('Shipping parameter conflict', {
            message: 'This error occurs when shipping info is set server-side with secret key',
            solution: 'Remove shipping from confirmParams or ensure backend doesn\'t set shipping'
          });
        }

        setError(userErrorMessage);
        setDebugInfo({
          stripeError: {
            type: confirmResult.error.type,
            code: confirmResult.error.code,
            message: confirmResult.error.message,
            decline_code: confirmResult.error.decline_code
          }
        });
        setLoading(false);
        return;
      }

      if (confirmResult.paymentIntent && confirmResult.paymentIntent.status === 'succeeded') {
        stripeDebugger.info('Payment succeeded with Stripe, confirming with backend');
        
        // Test 3: Confirm with backend
        try {
          const backendResult = await paymentApi.confirmPayment(
            confirmResult.paymentIntent.id, 
            shippingAddress
          );
          
          stripeDebugger.logBackendConfirmation(
            confirmResult.paymentIntent.id, 
            shippingAddress, 
            backendResult
          );
          
          if (backendResult.success) {
            stripeDebugger.info('Payment flow completed successfully', {
              orderNumber: backendResult.data.order_number
            });
            onSuccess(backendResult.data.order_number);
          } else {
            throw new Error(backendResult.message || 'Failed to create order');
          }
        } catch (backendError: any) {
          stripeDebugger.logBackendConfirmationError(backendError, confirmResult.paymentIntent.id);
          debugAPIError(backendError, '/api/payments/confirm');
          
          // Enhanced backend error handling
          let backendErrorMessage = `Payment succeeded but order creation failed: ${backendError.message}`;
          let errorGuidance = null;
          
          if (backendError.response?.status === 500) {
            const errorData = backendError.response?.data;
            
            // Check for specific database errors
            if (errorData?.message?.includes('Unknown column')) {
              const columnMatch = errorData.message.match(/Unknown column '([^']+)'/);
              const missingColumn = columnMatch ? columnMatch[1] : 'unknown';
              
              errorGuidance = {
                type: 'database_schema',
                missingColumn,
                recommendations: [
                  `Add '${missingColumn}' column to orders table`,
                  'Run database migrations',
                  'Check Laravel migration files',
                  'Verify database schema is up to date'
                ],
                sqlHint: missingColumn === 'payment_reference' ? 
                  'ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);' : null
              };
              
              backendErrorMessage = `Payment succeeded but database error occurred: Missing column '${missingColumn}' in orders table`;
            } else if (errorData?.message?.includes('SQLSTATE')) {
              errorGuidance = {
                type: 'database_error',
                recommendations: [
                  'Check database connection',
                  'Verify table structure',
                  'Run database migrations',
                  'Check Laravel logs for details'
                ]
              };
            }
          }
          
          setError(backendErrorMessage);
          setDebugInfo({
            backendError: {
              message: backendError.message,
              status: backendError.response?.status,
              data: backendError.response?.data,
              ...(errorGuidance && { guidance: errorGuidance })
            },
            paymentIntentId: confirmResult.paymentIntent.id,
            paymentStatus: 'succeeded_but_order_failed'
          });
        }
      } else {
        const unexpectedStatus = confirmResult.paymentIntent?.status || 'unknown';
        stripeDebugger.error('Payment Intent in unexpected status', {
          status: unexpectedStatus,
          paymentIntentId: confirmResult.paymentIntent?.id
        });
        setError(`Payment in unexpected state: ${unexpectedStatus}`);
      }
    } catch (err: any) {
      stripeDebugger.error('Unexpected error in payment flow', err);
      setError(err.message || 'An unexpected error occurred');
      setDebugInfo({ unexpectedError: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPaymentIntent = async () => {
    stripeDebugger.info('Attempting to refresh PaymentIntent');
    setError(null);
    setDebugInfo(null);
    
    try {
      const testData = {
        amount: 100, // Small test amount
        currency: 'usd',
        shipping_address: shippingAddress
      };
      
      const result = await paymentApi.createPaymentIntent(testData);
      
      if (result.success) {
        stripeDebugger.info('New PaymentIntent created successfully', {
          newClientSecret: result.data.client_secret ? 'received' : 'missing'
        });
        
        setDebugInfo(prev => ({
          ...prev,
          refreshResult: {
            status: 'success',
            message: 'New PaymentIntent created. You may need to refresh the page to use it.'
          }
        }));
      } else {
        setDebugInfo(prev => ({
          ...prev,
          refreshResult: {
            status: 'failed',
            message: result.message
          }
        }));
      }
    } catch (error: any) {
      stripeDebugger.error('Failed to refresh PaymentIntent', error);
      setDebugInfo(prev => ({
        ...prev,
        refreshResult: {
          status: 'error',
          message: error.message
        }
      }));
    }
  };

  const handleTestBackendConnection = async () => {
    stripeDebugger.info('Testing backend connection');
    const token = localStorage.getItem('auth_token');
    
    try {
      const testData = {
        amount: 100, // $1.00 test
        currency: 'usd',
        shipping_address: shippingAddress
      };
      
      // Log authentication status
      stripeDebugger.info('Backend test - Auth check', {
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
      });
      
      const result = await paymentApi.createPaymentIntent(testData);
      stripeDebugger.info('Backend connection test result', result);
      
      if (result.success) {
        setDebugInfo((prev: DebugInfo | null) => ({
          ...prev,
          backendTest: { 
            status: 'success', 
            clientSecret: result.data.client_secret ? 'present' : 'missing',
            authenticated: true
          }
        }));
      } else {
        setDebugInfo((prev: DebugInfo | null) => ({
          ...prev,
          backendTest: { 
            status: 'failed', 
            message: result.message,
            authenticated: !result.message?.includes('Authentication')
          }
        }));
      }
    } catch (error: any) {
      debugAPIError(error, '/api/payments/create-intent');
      setDebugInfo((prev: DebugInfo | null) => ({
        ...prev,
        backendTest: { 
          status: 'error', 
          error: error.message,
          authenticated: error.response?.status !== 401
        }
      }));
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <PaymentElement />
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            <strong>Payment Error:</strong> {error}
            {debugInfo && (
              <div className="mt-2">
                <small>
                  Debug info available below. 
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => console.log('Debug Info:', debugInfo)}
                  >
                    Log to Console
                  </Button>
                </small>
              </div>
            )}
          </Alert>
        )}

        {/* Debug Information Panel */}
        {(debugInfo || process.env.NODE_ENV === 'development') && (
          <Card className="mb-3 border-warning">
            <Card.Header className="bg-warning bg-opacity-10">
              <h6 className="mb-0">
                <i className="bi bi-bug"></i> Debug Information
                <Badge bg="warning" className="ms-2">DEV MODE</Badge>
              </h6>
            </Card.Header>
            <Card.Body>
              {debugInfo?.environmentIssues && (
                <Alert variant="warning" className="mb-2">
                  <strong>Environment Issues:</strong>
                  <ul className="mb-0 mt-1">
                    {debugInfo.environmentIssues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              <div className="d-flex gap-2 mb-2">
                <Button 
                  variant="outline-info" 
                  size="sm" 
                  onClick={handleTestBackendConnection}
                >
                  Test Backend Connection
                </Button>
                <Button 
                  variant="outline-warning" 
                  size="sm" 
                  onClick={handleRefreshPaymentIntent}
                >
                  Refresh PaymentIntent
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => console.log('Stripe Debug Logs:', stripeDebugger.getLogs())}
                >
                  Export Debug Logs
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => stripeDebugger.clearLogs()}
                >
                  Clear Logs
                </Button>
              </div>

              {debugInfo && (
                <pre className="bg-light p-2 small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
            </Card.Body>
          </Card>
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
    </div>
  );
};

export default CheckoutFormWithDebug;