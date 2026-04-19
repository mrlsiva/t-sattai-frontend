import React from 'react';
import { Nav, Navbar, Dropdown } from 'react-bootstrap';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkClass = (path: string) =>
    `d-flex align-items-center py-2 px-3 rounded mb-1 text-decoration-none fw-medium ${
      isActive(path)
        ? 'bg-primary text-white'
        : 'text-dark hover-admin-link'
    }`;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Top Navbar — brand + user only, no repeated menu */}
      <Navbar bg="dark" variant="dark" className="shadow-sm px-3" style={{ minHeight: '56px' }}>
        <Navbar.Brand as={Link} to="/admin" className="fw-bold">
          <i className="bi bi-speedometer2 me-2"></i>
          Admin Dashboard
        </Navbar.Brand>

        <div className="ms-auto">
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-light" id="admin-user-dropdown">
              <i className="bi bi-person-circle me-1"></i>
              {user?.name}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/admin/profile">
                <i className="bi bi-person me-2"></i>Profile
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/admin/settings">
                <i className="bi bi-gear me-2"></i>Settings
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as={Link} to="/">
                <i className="bi bi-shop me-2"></i>Back to Store
              </Dropdown.Item>
              <Dropdown.Item onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Navbar>

      {/* Body: sidebar + content */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <div
          className="bg-white shadow-sm border-end d-flex flex-column"
          style={{ width: '220px', minWidth: '220px', minHeight: 'calc(100vh - 56px)' }}
        >
          <Nav className="flex-column p-3 flex-grow-1">
            <Link to="/admin" className={navLinkClass('/admin') + (location.pathname === '/admin' ? '' : '')}>
              <i className="bi bi-speedometer2 me-2"></i>Dashboard
            </Link>
            <Link to="/admin/products" className={navLinkClass('/admin/products')}>
              <i className="bi bi-box me-2"></i>Products
            </Link>
            <Link to="/admin/categories" className={navLinkClass('/admin/categories')}>
              <i className="bi bi-tags me-2"></i>Categories
            </Link>
            <Link to="/admin/orders" className={navLinkClass('/admin/orders')}>
              <i className="bi bi-cart-check me-2"></i>Orders
            </Link>
            <Link to="/admin/users" className={navLinkClass('/admin/users')}>
              <i className="bi bi-people me-2"></i>Users
            </Link>
            <Link to="/admin/analytics" className={navLinkClass('/admin/analytics')}>
              <i className="bi bi-graph-up me-2"></i>Analytics
            </Link>
            <Link to="/admin/settings" className={navLinkClass('/admin/settings')}>
              <i className="bi bi-gear me-2"></i>Settings
            </Link>
          </Nav>
        </div>

        {/* Content Area */}
        <main className="flex-grow-1 p-4" style={{ overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .hover-admin-link:hover {
          background-color: #f0f4ff;
          color: #0d6efd !important;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
