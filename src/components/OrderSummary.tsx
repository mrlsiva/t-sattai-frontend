import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { CartItem } from '../types';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, subtotal, tax, shipping, total }) => {
  return (
    <Card className="sticky-top" style={{ top: '20px' }}>
      <Card.Header>
        <h5 className="mb-0">Order Summary</h5>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {items.map((item) => (
            <ListGroup.Item key={item.id} className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <img
                  src={Array.isArray(item.product.images) ? item.product.images[0] : ''}
                  alt={item.product.name}
                  className="rounded"
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                />
              </div>
              <div className="flex-grow-1 ms-3">
                <div className="fw-bold">{item.product.name}</div>
                <small className="text-muted">Qty: {item.quantity}</small>
              </div>
              <div className="text-end">
                <div className="fw-bold">
                  ${(parseFloat(item.product.sale_price || item.product.price) * item.quantity).toFixed(2)}
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
      <Card.Footer>
        <div className="d-flex justify-content-between mb-2">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span>Tax:</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span>Shipping:</span>
          <span>${shipping.toFixed(2)}</span>
        </div>
        <hr />
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default OrderSummary;