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
    const calculatedStats = orders.reduce(
      (acc, order) => {
        acc.total += 1;
        acc.totalValue += order.total;
        
        switch (order.orderStatus) {
          case 'pending':
            acc.pending += 1;
            break;
          case 'processing':
            acc.processing += 1;
            break;
          case 'shipped':
            acc.shipped += 1;
            break;
          case 'delivered':
            acc.delivered += 1;
            break;
          case 'cancelled':
            acc.cancelled += 1;
            break;
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
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Recalculate stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      calculateStatsFromOrders();
    }
  }, [orders]);

  const getStatusColor = (status: Order['orderStatus']) => {
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

  const getStatusText = (status: Order['orderStatus']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    
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
                <i className="bi bi-currency-dollar text-success"></i>
              </div>
              <h4 className="fw-bold">${stats.totalValue.toFixed(0)}</h4>
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
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td className="fw-bold">{order.id}</td>
                    <td>
                      <div>
                        <div className="fw-semibold">{order.user?.name || 'Unknown'}</div>
                        <small className="text-muted">{order.user?.email || 'N/A'}</small>
                      </div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <span className="text-muted small">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={order.orderStatus}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['orderStatus'])}
                        className={`border-0 bg-${getStatusColor(order.orderStatus)} text-white fw-bold`}
                        disabled={updatingOrderId === order.id}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Form.Select>
                      {updatingOrderId === order.id && (
                        <Spinner animation="border" size="sm" className="ms-2" />
                      )}
                    </td>
                    <td className="fw-bold">${order.total.toFixed(2)}</td>
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
          <Modal.Title>Order Details - {selectedOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="fw-bold">Customer Information</h6>
                  <p className="mb-1"><strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                  <p className="mb-1"><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
                  <p className="mb-1"><strong>Payment Status:</strong>{' '}
                    <Badge bg={selectedOrder.paymentStatus === 'completed' ? 'success' : 
                               selectedOrder.paymentStatus === 'pending' ? 'warning' :
                               selectedOrder.paymentStatus === 'failed' ? 'danger' : 'info'}>
                      {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold">Order Information</h6>
                  <p className="mb-1"><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p className="mb-1">
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusColor(selectedOrder.orderStatus)}>
                      {getStatusText(selectedOrder.orderStatus)}
                    </Badge>
                  </p>
                  <p className="mb-1"><strong>Subtotal:</strong> ${selectedOrder.subtotal.toFixed(2)}</p>
                  <p className="mb-1"><strong>Shipping:</strong> ${selectedOrder.shippingCost.toFixed(2)}</p>
                  <p className="mb-1"><strong>Tax:</strong> ${selectedOrder.tax.toFixed(2)}</p>
                  {selectedOrder.discount > 0 && (
                    <p className="mb-1"><strong>Discount:</strong> -${selectedOrder.discount.toFixed(2)}</p>
                  )}
                  <p className="mb-1"><strong>Total:</strong> <strong>${selectedOrder.total.toFixed(2)}</strong></p>
                  {selectedOrder.trackingNumber && (
                    <p className="mb-1"><strong>Tracking:</strong> {selectedOrder.trackingNumber}</p>
                  )}
                </Col>
              </Row>

              <h6 className="fw-bold">Shipping Address</h6>
              <p className="mb-4">{formatAddress(selectedOrder.shippingAddress)}</p>

              {selectedOrder.billingAddress && (
                <>
                  <h6 className="fw-bold">Billing Address</h6>
                  <p className="mb-4">{formatAddress(selectedOrder.billingAddress)}</p>
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
                  {selectedOrder.items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <div className="fw-semibold">{item.product?.name || 'Unknown Product'}</div>
                          {item.variant && (
                            <small className="text-muted">
                              Variant: {item.variant.name || 'N/A'}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td className="fw-bold">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <th colSpan={3}>Subtotal</th>
                    <th>${selectedOrder.subtotal.toFixed(2)}</th>
                  </tr>
                  <tr>
                    <th colSpan={3}>Shipping</th>
                    <th>${selectedOrder.shippingCost.toFixed(2)}</th>
                  </tr>
                  <tr>
                    <th colSpan={3}>Tax</th>
                    <th>${selectedOrder.tax.toFixed(2)}</th>
                  </tr>
                  {selectedOrder.discount > 0 && (
                    <tr>
                      <th colSpan={3}>Discount</th>
                      <th>-${selectedOrder.discount.toFixed(2)}</th>
                    </tr>
                  )}
                  <tr className="table-dark">
                    <th colSpan={3}>Total</th>
                    <th>${selectedOrder.total.toFixed(2)}</th>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
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