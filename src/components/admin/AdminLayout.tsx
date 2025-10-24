import React from 'react';
import { Container, Row, Col, Nav, Navbar, Dropdown } from 'react-bootstrap';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Admin Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/admin">
            <i className="bi bi-speedometer2 me-2"></i>
            Admin Dashboard
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/admin">
                <i className="bi bi-house me-1"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/products">
                <i className="bi bi-box me-1"></i>
                Products
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/categories">
                <i className="bi bi-tags me-1"></i>
                Categories
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/orders">
                <i className="bi bi-cart-check me-1"></i>
                Orders
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/users">
                <i className="bi bi-people me-1"></i>
                Users
              </Nav.Link>
            </Nav>
            
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="admin-dropdown">
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.name}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/admin/profile">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/admin/settings">
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/">
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Store
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="p-0">
        <Row className="g-0">
          {/* Sidebar */}
          <Col xs={12} lg={2} className="bg-white shadow-sm border-end">
            <div className="p-3">
              <Nav className="flex-column">
                <Nav.Link as={Link} to="/admin" className="text-dark py-2">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/products" className="text-dark py-2">
                  <i className="bi bi-box me-2"></i>
                  Products
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/categories" className="text-dark py-2">
                  <i className="bi bi-tags me-2"></i>
                  Categories
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/orders" className="text-dark py-2">
                  <i className="bi bi-cart-check me-2"></i>
                  Orders
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/users" className="text-dark py-2">
                  <i className="bi bi-people me-2"></i>
                  Users
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/analytics" className="text-dark py-2">
                  <i className="bi bi-graph-up me-2"></i>
                  Analytics
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/settings" className="text-dark py-2">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </Nav.Link>
              </Nav>
            </div>
          </Col>

          {/* Content Area */}
          <Col xs={12} lg={10}>
            <main className="p-4">
              <Outlet />
            </main>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLayout;