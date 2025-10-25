import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Table, Badge, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'India'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);

  // Mock orders data
  const orders: Order[] = [
    {
      id: 'ORD-2024-001',
      date: '2024-01-15',
      status: 'delivered',
      total: 149.99,
      items: [
        { name: 'Wireless Headphones', quantity: 1, price: 99.99 },
        { name: 'USB Cable', quantity: 2, price: 25.00 }
      ]
    },
    {
      id: 'ORD-2024-002',
      date: '2024-01-20',
      status: 'shipped',
      total: 89.99,
      items: [
        { name: 'Smartphone Case', quantity: 1, price: 29.99 },
        { name: 'Screen Protector', quantity: 3, price: 60.00 }
      ]
    },
    {
      id: 'ORD-2024-003',
      date: '2024-01-25',
      status: 'processing',
      total: 199.99,
      items: [
        { name: 'Bluetooth Speaker', quantity: 1, price: 199.99 }
      ]
    }
  ];

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setShowAlert({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setShowAlert(null), 3000);
    }, 500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setShowAlert({ type: 'danger', message: 'Passwords do not match!' });
      setTimeout(() => setShowAlert(null), 3000);
      return;
    }
    // Simulate API call
    setTimeout(() => {
      setShowAlert({ type: 'success', message: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowAlert(null), 3000);
    }, 500);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: Order['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="fw-bold mb-1">Welcome back, {profileData.name}!</h2>
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
                          <h4 className="fw-bold">{orders.length}</h4>
                          <p className="text-muted mb-0">Total Orders</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                          <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                            <i className="bi bi-currency-dollar text-success fs-4"></i>
                          </div>
                          <h4 className="fw-bold">${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}</h4>
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
                          <h4 className="fw-bold">{orders.filter(order => order.status === 'shipped').length}</h4>
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
                      {orders.slice(0, 3).map(order => (
                        <div key={order.id} className="d-flex align-items-center justify-content-between py-3 border-bottom">
                          <div>
                            <h6 className="fw-bold mb-1">{order.id}</h6>
                            <p className="text-muted mb-0 small">{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-center">
                            <Badge bg={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                          <div className="text-end">
                            <h6 className="fw-bold mb-0">${order.total.toFixed(2)}</h6>
                          </div>
                        </div>
                      ))}
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
                            <Form.Label>Zip Code</Form.Label>
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
                        <Button variant="primary" type="submit">
                          <i className="bi bi-check-lg me-2"></i>
                          Save Changes
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
                    <Table responsive hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td className="fw-bold">{order.id}</td>
                            <td>{new Date(order.date).toLocaleDateString()}</td>
                            <td>
                              <div>
                                {order.items.map((item, index) => (
                                  <div key={index} className="small">
                                    {item.name} x{item.quantity}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <Badge bg={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </td>
                            <td className="fw-bold">${order.total.toFixed(2)}</td>
                            <td>
                              <Button variant="outline-primary" size="sm">
                                <i className="bi bi-eye me-1"></i>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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
                        <Button variant="primary" type="submit">
                          <i className="bi bi-shield-check me-2"></i>
                          Change Password
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
            <Button variant="danger">
              Yes, Delete Account
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default UserDashboard;