import React, { useState } from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Badge, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <BootstrapNavbar expand="lg" className="bg-white shadow-sm sticky-top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold text-primary fs-3">
          EcomStore
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {/* Search Bar */}
          <form className="d-flex mx-auto" style={{ maxWidth: '400px', width: '100%' }} onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-primary" type="submit">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/products" className="me-3">
              Products
            </Nav.Link>
            
            <Nav.Link as={Link} to="/about" className="me-3">
              About
            </Nav.Link>
            
            <Nav.Link as={Link} to="/contact" className="me-3">
              Contact
            </Nav.Link>

            {/* Wishlist */}
            {isAuthenticated && (
              <Nav.Link as={Link} to="/wishlist" className="me-3 position-relative">
                <i className="bi bi-heart fs-5"></i>
                {wishlistItems.length > 0 && (
                  <Badge 
                    bg="danger" 
                    className="position-absolute top-0 start-100 translate-middle rounded-pill"
                    style={{ fontSize: '0.6rem' }}
                  >
                    {wishlistItems.length}
                  </Badge>
                )}
              </Nav.Link>
            )}

            {/* Shopping Cart */}
            <Nav.Link as={Link} to="/cart" className="me-3 position-relative">
              <i className="bi bi-cart fs-5"></i>
              {itemCount > 0 && (
                <Badge 
                  bg="primary" 
                  className="position-absolute top-0 start-100 translate-middle rounded-pill"
                  style={{ fontSize: '0.6rem' }}
                >
                  {itemCount}
                </Badge>
              )}
            </Nav.Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-primary" className="border-0">
                  <i className="bi bi-person-circle fs-5"></i>
                  <span className="ms-2 d-none d-md-inline">{user?.name}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/dashboard">
                    <i className="bi bi-speedometer2 me-2"></i>
                    Dashboard
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/dashboard/profile">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/dashboard/orders">
                    <i className="bi bi-bag me-2"></i>
                    Orders
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className="btn btn-outline-primary px-3"
                >
                  Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register" 
                  className="btn btn-primary px-3 text-white"
                >
                  Sign Up
                </Nav.Link>
              </div>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;