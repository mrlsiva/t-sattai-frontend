import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';

const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="text-center border-0 shadow">
            <Card.Body className="py-5">
              <div className="mb-4">
                <div className="display-1 text-success mb-3">
                  <i className="bi bi-check-circle"></i>
                </div>
                <h1 className="h3 text-success mb-3">Payment Successful!</h1>
                <p className="text-muted mb-4">
                  Thank you for your order. Your payment has been processed successfully.
                </p>
              </div>

              {orderNumber && (
                <Card className="bg-light border-0 mb-4">
                  <Card.Body>
                    <h6 className="mb-2">Order Number:</h6>
                    <div className="h5 text-primary font-monospace">{orderNumber}</div>
                  </Card.Body>
                </Card>
              )}

              <div className="mb-4">
                <h6 className="mb-3">What's Next?</h6>
                <ul className="list-unstyled text-start">
                  <li className="mb-2">
                    <i className="bi bi-envelope text-primary me-2"></i>
                    You'll receive an order confirmation email shortly
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-truck text-primary me-2"></i>
                    We'll send you tracking information once your order ships
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-headset text-primary me-2"></i>
                    Contact support if you have any questions
                  </li>
                </ul>
              </div>

              <div className="d-grid gap-2">
                <Link to="/dashboard/orders">
                  <Button variant="primary" size="lg" className="w-100">
                    View Order Details
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline-primary" className="w-100">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderSuccessPage;