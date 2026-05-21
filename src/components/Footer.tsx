import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import config from '../config';
import { useSiteSettings, formatBusinessHours } from '../contexts/SettingsContext';

const Footer: React.FC = () => {
  const { settings } = useSiteSettings();
  const bhLines = formatBusinessHours(settings.businessHoursSchedule);
  return (
    <>
      <footer className="bg-dark text-light py-5 mt-5 text-start">
        <Container>
          <Row>
            {/* Company Info */}
            <Col lg={3} md={6} className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #DAA520, #D2B48C)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #8B4513'
                }}>
                  <span style={{ color: '#8B4513', fontSize: '24px' }}>🌴</span>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#DAA520' }}>
                    {config.brand.name}
                  </h5>
                  <small style={{ color: '#228B22' }}>
                    {config.brand.tagline}
                  </small>
                </div>
              </div>
              <p className="text-white small mb-3">
                {config.brand.description}. Experience the authentic taste of traditional 
                South Indian jaggery products, sourced directly from local farmers and 
                processed using time-honored methods.
              </p>
              <div className="d-flex gap-3">
                <a href="https://facebook.com" className="text-white hover-primary" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f fa-lg"></i>
                </a>
                <a href="https://twitter.com" className="text-white hover-primary" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter fa-lg"></i>
                </a>
                <a href="https://instagram.com" className="text-white hover-primary" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram fa-lg"></i>
                </a>
                <a href="https://linkedin.com" className="text-white hover-primary" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin-in fa-lg"></i>
                </a>
                <a href="https://youtube.com" className="text-white hover-primary" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-youtube fa-lg"></i>
                </a>
              </div>
            </Col>

            {/* Quick Links */}
            <Col lg={2} md={6} className="mb-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="fas fa-link me-2"></i>
                Quick Links
              </h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-home me-2"></i>Home
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/products" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-shopping-bag me-2"></i>Products
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/about" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-info-circle me-2"></i>About Us
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/contact" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-envelope me-2"></i>Contact
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/faq" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-question-circle me-2"></i>FAQ
                  </Link>
                </li>
              </ul>
            </Col>

            {/* Categories */}
            <Col lg={2} md={6} className="mb-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="fas fa-th-large me-2"></i>
                Categories
              </h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/products?category=1" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-laptop me-2"></i>Electronics
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/products?category=2" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-tshirt me-2"></i>Clothing
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/products?category=3" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-book me-2"></i>Books
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/products?category=4" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-home me-2"></i>Home & Garden
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/products?category=5" className="text-white text-decoration-none small hover-primary">
                    <i className="fas fa-running me-2"></i>Sports
                  </Link>
                </li>
              </ul>
            </Col>

            {/* Customer Service */}
            <Col lg={2} md={6} className="mb-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="fas fa-headset me-2"></i>
                Customer Service
              </h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">
                    <i className="fas fa-shipping-fast me-2"></i>Track Order
                  </button>
                </li>
                <li className="mb-2">
                  <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">
                    <i className="fas fa-undo me-2"></i>Returns
                  </button>
                </li>
                <li className="mb-2">
                  <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">
                    <i className="fas fa-info me-2"></i>Shipping Info
                  </button>
                </li>
                <li className="mb-2">
                  <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">
                    <i className="fas fa-ruler me-2"></i>Size Guide
                  </button>
                </li>
                <li className="mb-2">
                  <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">
                    <i className="fas fa-life-ring me-2"></i>Support
                  </button>
                </li>
              </ul>
            </Col>

            {/* Contact Info */}
            <Col lg={3} md={6} className="mb-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="fas fa-address-book me-2"></i>
                Contact Info
              </h6>
              <div className="d-flex align-items-start mb-3">
                <i className="fas fa-map-marker-alt text-primary me-3 mt-1"></i>
                <small className="text-white">
                  {settings.address_street}<br/>
                  {settings.address_city}, {settings.address_state} - {settings.address_pincode}<br/>
                  {settings.address_country}
                </small>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-phone text-primary me-3"></i>
                <small className="text-white">{settings.supportPhone}</small>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-envelope text-primary me-3"></i>
                <small className="text-white">{settings.contactEmail}</small>
              </div>
              {settings.showBusinessHours && (
                <div className="d-flex align-items-start mb-3">
                  <i className="fas fa-clock text-primary me-3 mt-1"></i>
                  <small className="text-white">
                    {bhLines.map((line, i) => (
                      <span key={i}>{line}{i < bhLines.length - 1 && <br />}</span>
                    ))}
                  </small>
                </div>
              )}
              
              {/* Newsletter */}
              <div className="mt-4">
                <h6 className="fw-bold mb-2 text-primary">
                  <i className="fas fa-bell me-2"></i>
                  Newsletter
                </h6>
                <div className="input-group input-group-sm">
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="Your email"
                    aria-label="Email for newsletter"
                  />
                  <button className="btn btn-primary" type="button">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
                <small className="text-white">Get updates on new products & offers</small>
              </div>
            </Col>
          </Row>

          <hr className="my-4 border-secondary" />

          {/* Payment Methods & Security */}
          <Row className="mb-3">
            <Col md={6} className="mb-3">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="fas fa-credit-card me-2"></i>
                We Accept
              </h6>
              <div className="d-flex gap-3 flex-wrap align-items-center">
                <i className="fab fa-cc-visa fa-2x text-info" title="Visa"></i>
                <i className="fab fa-cc-mastercard fa-2x text-warning" title="Mastercard"></i>
                <i className="fab fa-cc-amex fa-2x text-primary" title="American Express"></i>
                <i className="fab fa-cc-paypal fa-2x text-info" title="PayPal"></i>
                <i className="fab fa-cc-stripe fa-2x text-primary" title="Stripe"></i>
                <i className="fab fa-google-pay fa-2x text-success" title="Google Pay"></i>
                <i className="fab fa-apple-pay fa-2x text-dark" title="Apple Pay"></i>
              </div>
            </Col>
            <Col md={6} className="mb-3">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="fas fa-shield-alt me-2"></i>
                Security & Trust
              </h6>
              <div className="d-flex gap-3 flex-wrap align-items-center">
                <span className="badge bg-success">
                  <i className="fas fa-lock me-1"></i>SSL Secured
                </span>
                <span className="badge bg-primary">
                  <i className="fas fa-certificate me-1"></i>Verified Store
                </span>
                <span className="badge bg-warning text-dark">
                  <i className="fas fa-star me-1"></i>5.0 Rating
                </span>
                <span className="badge bg-info">
                  <i className="fas fa-users me-1"></i>10K+ Customers
                </span>
              </div>
            </Col>
          </Row>

          {/* Bottom Footer */}
          <Row className="align-items-center pt-3 border-top border-secondary">
            <Col md={8}>
              <small className="text-white">
                © {new Date().getFullYear()} Vembar Karuppatti. All rights reserved. 
                Made with <i className="fas fa-heart text-danger"></i> for our customers.
              </small>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-3 flex-wrap">
                <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">Privacy</button>
                <span className="text-white">|</span>
                <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">Terms</button>
                <span className="text-white">|</span>
                <button onClick={() => {}} className="btn btn-link text-white text-decoration-none small hover-primary p-0">Cookies</button>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .hover-primary:hover {
          color: var(--bs-primary) !important;
          transition: color 0.3s ease;
        }
        
        footer a:hover i {
          transform: scale(1.1);
          transition: transform 0.3s ease;
        }
        
        .badge {
          font-size: 0.7em;
        }
        
        @media (max-width: 768px) {
          footer .row > .col-lg-2,
          footer .row > .col-lg-3 {
            margin-bottom: 2rem;
          }
        }
      `}</style>
    </>
  );
};

export default Footer;