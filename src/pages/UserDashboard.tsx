import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Table, Badge, Alert, Modal, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi, authApi, handleApiError } from '../services/api';

interface ApiOrder {
  id: string | number;
  order_number?: string;
  created_at?: string;
  createdAt?: string;
  status?: string;
  order_status?: string;
  orderStatus?: string;
  total?: number | string;
  items?: any[];
  order_items?: any[];
}

const UserDashboard: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zip_code || user?.postal_code || '',
    country: user?.country || 'India'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Sync profileData when user object updates
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zip_code || user.postal_code || '',
        country: user.country || 'India'
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await ordersApi.getAll();
      if (response.success && response.data) {
        setOrders(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zip_code: profileData.zipCode,
        country: profileData.country,
      });
      showTempAlert('success', 'Profile updated successfully!');
    } catch (error) {
      showTempAlert('danger', handleApiError(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showTempAlert('danger', 'Passwords do not match!');
      return;
    }
    try {
      setPasswordLoading(true);
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showTempAlert('success', 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showTempAlert('danger', handleApiError(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Delete account error:', error);
      await logout();
    }
    setShowDeleteModal(false);
  };

  const showTempAlert = (type: 'success' | 'danger', message: string) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), 4000);
  };

  const getOrderStatus = (order: ApiOrder): string => {
    return (order.orderStatus || order.order_status || order.status || 'pending').toLowerCase();
  };

  const getOrderDate = (order: ApiOrder): string => {
    const dateStr = order.createdAt || order.created_at || '';
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getOrderTotal = (order: ApiOrder): number => {
    return parseFloat(String(order.total || 0));
  };

  const getOrderItems = (order: ApiOrder): any[] => {
    return order.items || order.order_items || [];
  };

  const getOrderId = (order: ApiOrder): string => {
    return order.order_number || String(order.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing':
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const totalSpent = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const inTransitCount = orders.filter(order => getOrderStatus(order) === 'shipped').length;

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="fw-bold mb-1">Welcome back, {user?.name || 'User'}!</h2>
                <p className="text-muted mb-0">Manage your account and view your orders</p>
              </div>
              <Button variant="outline-danger" onClick={() => logout()}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </div>
          </Col>
        </Row>

        {showAlert && (
          <Row className="mb-4">
            <Col>
              <Alert variant={showAlert.type} dismissible onClose={() => setShowAlert(null)}>
                {showAlert.message}
              </Alert>
            </Col>
          </Row>
        )}

        <Row>
          {/* Sidebar Navigation */}
          <Col lg={3} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column p-3">
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'overview'}
                      onClick={() => setActiveTab('overview')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-speedometer2 me-2"></i>
                      Dashboard Overview
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'profile'}
                      onClick={() => setActiveTab('profile')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-person me-2"></i>
                      Profile Settings
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'orders'}
                      onClick={() => setActiveTab('orders')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-bag me-2"></i>
                      Order History
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'security'}
                      onClick={() => setActiveTab('security')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-shield-lock me-2"></i>
                      Security
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={9}>
            <Tab.Content>
              {/* Dashboard Overview */}
              {activeTab === 'overview' && (
                <div>
                  <Row className="mb-4">
                    <Col md={4}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                            <i className="bi bi-bag text-primary fs-4"></i>
                          </div>
                          <h4 className="fw-bold">{ordersLoading ? <Spinner size="sm" /> : orders.length}</h4>
                          <p className="text-muted mb-0">Total Orders</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                          <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                            <i className="bi bi-cash text-success fs-4"></i>
                          </div>
                          <h4 className="fw-bold">{ordersLoading ? <Spinner size="sm" /> : `₹${totalSpent.toFixed(2)}`}</h4>
                          <p className="text-muted mb-0">Total Spent</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                          <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                            <i className="bi bi-truck text-info fs-4"></i>
                          </div>
                          <h4 className="fw-bold">{ordersLoading ? <Spinner size="sm" /> : inTransitCount}</h4>
                          <p className="text-muted mb-0">In Transit</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 pb-0">
                      <h5 className="fw-bold mb-0">Recent Orders</h5>
                    </Card.Header>
                    <Card.Body>
                      {ordersLoading ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" />
                        </div>
                      ) : orders.length === 0 ? (
                        <p className="text-muted text-center py-3">No orders yet.</p>
                      ) : (
                        orders.slice(0, 3).map(order => (
                          <div key={order.id} className="d-flex align-items-center justify-content-between py-3 border-bottom">
                            <div>
                              <h6 className="fw-bold mb-1">{getOrderId(order)}</h6>
                              <p className="text-muted mb-0 small">{getOrderDate(order)}</p>
                            </div>
                            <div className="text-center">
                              <Badge bg={getStatusColor(getOrderStatus(order))}>
                                {getStatusText(getOrderStatus(order))}
                              </Badge>
                            </div>
                            <div className="text-end">
                              <h6 className="fw-bold mb-0">₹{getOrderTotal(order).toFixed(2)}</h6>
                            </div>
                          </div>
                        ))
                      )}
                      <div className="text-center pt-3">
                        <Button variant="outline-primary" onClick={() => setActiveTab('orders')}>
                          View All Orders
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="fw-bold mb-0">Profile Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleProfileSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.name}
                              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                              type="email"
                              value={profileData.email}
                              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.address}
                              onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.city}
                              onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.state}
                              onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>PIN Code</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.zipCode}
                              onChange={(e) => setProfileData({...profileData, zipCode: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.country}
                              onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="d-grid d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit" disabled={profileLoading}>
                          {profileLoading ? (
                            <><Spinner size="sm" className="me-2" />Saving...</>
                          ) : (
                            <><i className="bi bi-check-lg me-2"></i>Save Changes</>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {/* Order History */}
              {activeTab === 'orders' && (
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="fw-bold mb-0">Order History</h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {ordersLoading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className="bi bi-bag display-4 d-block mb-3"></i>
                        No orders found.
                      </div>
                    ) : (
                      <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id}>
                              <td className="fw-bold">{getOrderId(order)}</td>
                              <td>{getOrderDate(order)}</td>
                              <td>
                                <div>
                                  {getOrderItems(order).slice(0, 2).map((item: any, index: number) => (
                                    <div key={index} className="small">
                                      {item.product?.name || item.name || 'Product'} x{item.quantity}
                                    </div>
                                  ))}
                                  {getOrderItems(order).length > 2 && (
                                    <div className="small text-muted">+{getOrderItems(order).length - 2} more</div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <Badge bg={getStatusColor(getOrderStatus(order))}>
                                  {getStatusText(getOrderStatus(order))}
                                </Badge>
                              </td>
                              <td className="fw-bold">₹{getOrderTotal(order).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-white border-0">
                      <h5 className="fw-bold mb-0">Change Password</h5>
                    </Card.Header>
                    <Card.Body>
                      <Form onSubmit={handlePasswordSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label>Current Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required
                            minLength={8}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            required
                          />
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={passwordLoading}>
                          {passwordLoading ? (
                            <><Spinner size="sm" className="me-2" />Changing...</>
                          ) : (
                            <><i className="bi bi-shield-check me-2"></i>Change Password</>
                          )}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>

                  <Card className="border-0 shadow-sm border-danger">
                    <Card.Header className="bg-danger bg-opacity-10 border-0">
                      <h5 className="fw-bold mb-0 text-danger">Danger Zone</h5>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted mb-3">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button
                        variant="danger"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Delete Account
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Tab.Content>
          </Col>
        </Row>

        {/* Delete Account Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete Account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <Alert variant="danger">
              <strong>Warning:</strong> All your data, orders, and preferences will be permanently deleted.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Yes, Delete Account
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default UserDashboard;
