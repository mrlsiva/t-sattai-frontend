import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalValue: number;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalValue: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ordersApi.getAllOrders({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      if (result.success) {
        setOrders(result.data || []);
        
        // Show appropriate message based on fallback status
        if (result.message?.includes('No order endpoints available')) {
          setShowAlert({
            type: 'danger',
            message: 'Backend API endpoints not implemented yet. Please set up the Laravel backend with order management routes.'
          });
        } else if (result.message?.includes('fallback')) {
          setShowAlert({
            type: 'success',
            message: 'Orders loaded using fallback endpoint. Admin endpoints are being developed.'
          });
        }
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching orders');
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const result = await ordersApi.getOrderStats();
      if (result.success) {
        setStats(result.data || stats);
        
        // Show message if stats were calculated from fallback
        if (result.message?.includes('calculated from available data')) {
          console.info('Order statistics calculated from fallback data');
        }
      }
    } catch (err) {
      console.error('Failed to fetch order stats:', err);
      // If stats API fails, calculate from current orders
      calculateStatsFromOrders();
    }
  };

  // Calculate stats from current orders if API fails
  const calculateStatsFromOrders = () => {
    const calculatedStats = (orders as any[]).reduce(
      (acc, order) => {
        acc.total += 1;
        acc.totalValue += parseFloat(String(order.total || 0));
        const status = (order.orderStatus || order.order_status || '').toLowerCase();
        switch (status) {
          case 'pending':    acc.pending += 1; break;
          case 'processing': acc.processing += 1; break;
          case 'shipped':    acc.shipped += 1; break;
          case 'delivered':  acc.delivered += 1; break;
          case 'cancelled':  acc.cancelled += 1; break;
        }
        return acc;
      },
      { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, totalValue: 0 }
    );
    setStats(calculatedStats);
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrderStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  // Recalculate stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      calculateStatsFromOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Helper: get field supporting both camelCase and snake_case API responses
  const getField = (order: any, camel: string, snake: string, fallback: any = '') => {
    return order[camel] ?? order[snake] ?? fallback;
  };

  const getOrderStatus = (order: any): string =>
    (getField(order, 'orderStatus', 'order_status', 'pending') as string).toLowerCase();

  const getPaymentStatus = (order: any): string =>
    (getField(order, 'paymentStatus', 'payment_status', 'pending') as string).toLowerCase();

  const getCreatedAt = (order: any): string =>
    getField(order, 'createdAt', 'created_at', '');

  const getShippingAddress = (order: any): any =>
    getField(order, 'shippingAddress', 'shipping_address', null);

  const getBillingAddress = (order: any): any =>
    getField(order, 'billingAddress', 'billing_address', null);

  const getShippingCost = (order: any): number =>
    parseFloat(getField(order, 'shippingCost', 'shipping_cost', 0));

  const getOrderItems = (order: any): any[] =>
    getField(order, 'items', 'order_items', []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = orders.filter((order: any) => {
    const orderId = String(order.id || order.order_number || '').toLowerCase();
    const matchesSearch =
      orderId.includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getOrderStatus(order);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: Order['orderStatus']) => {
    try {
      setUpdatingOrderId(orderId);
      
      const result = await ordersApi.updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, orderStatus: newStatus } : order
        ));
        setShowAlert({
          type: 'success',
          message: `Order ${orderId} status updated to ${getStatusText(newStatus)}`
        });
        setTimeout(() => setShowAlert(null), 3000);
      } else {
        // Check if this is a fallback error indicating admin endpoints aren't available
        if (result.message?.includes('admin endpoints pending')) {
          setShowAlert({
            type: 'danger',
            message: 'Order status updates not available yet. Admin endpoints are being developed.'
          });
        } else {
          setShowAlert({
            type: 'danger',
            message: result.message || 'Failed to update order status'
          });
        }
        setTimeout(() => setShowAlert(null), 5000);
      }
    } catch (err: any) {
      setShowAlert({
        type: 'danger',
        message: err.message || 'An error occurred while updating order status'
      });
      setTimeout(() => setShowAlert(null), 5000);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleRefresh = () => {
    fetchOrders();
    fetchOrderStats();
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (!address) return 'N/A';
    
    return `${address.line1 || ''}${address.line2 ? ', ' + address.line2 : ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}, ${address.country || ''}`.trim();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Orders Management</h2>
          <p className="text-muted mb-0">View and manage all customer orders</p>
        </div>
        <div>
          <Button variant="outline-primary" onClick={handleRefresh} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <strong>Error loading orders:</strong> {error}
              <div className="mt-2">
                <Button variant="outline-danger" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {showAlert && (
        <Row className="mb-4">
          <Col>
            <Alert variant={showAlert.type} dismissible onClose={() => setShowAlert(null)}>
              {showAlert.message}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-bag text-primary"></i>
              </div>
              <h4 className="fw-bold">{stats.total}</h4>
              <p className="text-muted small mb-0">Total Orders</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-clock text-warning"></i>
              </div>
              <h4 className="fw-bold">{stats.pending}</h4>
              <p className="text-muted small mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-gear text-info"></i>
              </div>
              <h4 className="fw-bold">{stats.processing}</h4>
              <p className="text-muted small mb-0">Processing</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-truck text-primary"></i>
              </div>
              <h4 className="fw-bold">{stats.shipped}</h4>
              <p className="text-muted small mb-0">Shipped</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-check-circle text-success"></i>
              </div>
              <h4 className="fw-bold">{stats.delivered}</h4>
              <p className="text-muted small mb-0">Delivered</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-cash text-success"></i>
              </div>
              <h4 className="fw-bold">₹{stats.totalValue.toFixed(0)}</h4>
              <p className="text-muted small mb-0">Total Value</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search orders by ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3} className="text-end">
          <p className="text-muted mb-0">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <Spinner animation="border" role="status" className="me-2" />
                    <span>Loading orders...</span>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="fw-bold">{order.order_number || order.id}</td>
                    <td>
                      <div>
                        <div className="fw-semibold">{order.user?.name || 'Unknown'}</div>
                        <small className="text-muted">{order.user?.email || 'N/A'}</small>
                      </div>
                    </td>
                    <td>{getCreatedAt(order) ? formatDate(getCreatedAt(order)) : 'N/A'}</td>
                    <td>
                      <span className="text-muted small">
                        {getOrderItems(order).length} item{getOrderItems(order).length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={getOrderStatus(order)}
                        onChange={(e) => handleStatusUpdate(String(order.id), e.target.value as Order['orderStatus'])}
                        className={`border-0 bg-${getStatusColor(getOrderStatus(order))} text-white fw-bold`}
                        disabled={updatingOrderId === String(order.id)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Form.Select>
                      {updatingOrderId === String(order.id) && (
                        <Spinner animation="border" size="sm" className="ms-2" />
                      )}
                    </td>
                    <td className="fw-bold">₹{parseFloat(String(order.total || 0)).toFixed(2)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-inbox display-4 d-block mb-2"></i>
                      {error ? 'Failed to load orders' : 'No orders found matching your criteria'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Order Details Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Order Details — {(selectedOrder as any)?.order_number || selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (() => {
            const o: any = selectedOrder;
            const orderStatus   = getOrderStatus(o);
            const payStatus     = getPaymentStatus(o);
            const createdAt     = getCreatedAt(o);
            const shippingAddr  = getShippingAddress(o);
            const billingAddr   = getBillingAddress(o);
            const shippingCost  = getShippingCost(o);
            const subtotal      = parseFloat(String(o.subtotal ?? 0));
            const tax           = parseFloat(String(o.tax ?? 0));
            const discount      = parseFloat(String(o.discount ?? 0));
            const total         = parseFloat(String(o.total ?? 0));
            const trackingNo    = o.trackingNumber || o.tracking_number;
            const paymentMethod = o.paymentMethod || o.payment_method || 'N/A';
            const items         = getOrderItems(o);

            return (
              <div>
                <Row className="mb-4">
                  <Col md={6}>
                    <h6 className="fw-bold">Customer Information</h6>
                    <p className="mb-1"><strong>Name:</strong> {o.user?.name || 'N/A'}</p>
                    <p className="mb-1"><strong>Email:</strong> {o.user?.email || 'N/A'}</p>
                    <p className="mb-1"><strong>Payment:</strong> {paymentMethod}</p>
                    <p className="mb-1"><strong>Payment Status:</strong>{' '}
                      <Badge bg={payStatus === 'completed' || payStatus === 'paid' ? 'success' :
                                 payStatus === 'pending' ? 'warning' :
                                 payStatus === 'failed' ? 'danger' : 'info'}>
                        {getStatusText(payStatus)}
                      </Badge>
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6 className="fw-bold">Order Information</h6>
                    <p className="mb-1"><strong>Date:</strong> {createdAt ? formatDate(createdAt) : 'N/A'}</p>
                    <p className="mb-1">
                      <strong>Status:</strong>{' '}
                      <Badge bg={getStatusColor(orderStatus)}>
                        {getStatusText(orderStatus)}
                      </Badge>
                    </p>
                    <p className="mb-1"><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
                    <p className="mb-1"><strong>Shipping:</strong> ₹{shippingCost.toFixed(2)}</p>
                    <p className="mb-1"><strong>Tax:</strong> ₹{tax.toFixed(2)}</p>
                    {discount > 0 && (
                      <p className="mb-1"><strong>Discount:</strong> -₹{discount.toFixed(2)}</p>
                    )}
                    <p className="mb-1"><strong>Total:</strong> <strong>₹{total.toFixed(2)}</strong></p>
                    {trackingNo && (
                      <p className="mb-1"><strong>Tracking:</strong> {trackingNo}</p>
                    )}
                  </Col>
                </Row>

                <h6 className="fw-bold">Shipping Address</h6>
                <p className="mb-4">{formatAddress(shippingAddr)}</p>

                {billingAddr && (
                  <>
                    <h6 className="fw-bold">Billing Address</h6>
                    <p className="mb-4">{formatAddress(billingAddr)}</p>
                  </>
                )}

                <h6 className="fw-bold">Order Items</h6>
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">No items found</td>
                      </tr>
                    ) : items.map((item: any, idx: number) => {
                      const itemPrice = parseFloat(String(item.price ?? 0));
                      const productName = item.product?.name || item.name || 'Unknown Product';
                      return (
                        <tr key={item.id ?? idx}>
                          <td>
                            <div className="fw-semibold">{productName}</div>
                            {(item.variant || item.product_variant) && (
                              <small className="text-muted">
                                Variant: {(item.variant || item.product_variant)?.name || 'N/A'}
                              </small>
                            )}
                          </td>
                          <td>₹{itemPrice.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td className="fw-bold">₹{(itemPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-light">
                    <tr><th colSpan={3}>Subtotal</th><th>₹{subtotal.toFixed(2)}</th></tr>
                    <tr><th colSpan={3}>Shipping</th><th>₹{shippingCost.toFixed(2)}</th></tr>
                    <tr><th colSpan={3}>Tax</th><th>₹{tax.toFixed(2)}</th></tr>
                    {discount > 0 && (
                      <tr><th colSpan={3}>Discount</th><th>-₹{discount.toFixed(2)}</th></tr>
                    )}
                    <tr className="table-dark">
                      <th colSpan={3}>Total</th>
                      <th>₹{total.toFixed(2)}</th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Close
          </Button>
          <Button variant="primary">
            <i className="bi bi-printer me-2"></i>
            Print Invoice
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrders;