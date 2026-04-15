import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-light">
      <Container className="py-5">
        {/* Hero Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center">
              <h1 className="display-4 fw-bold mb-4">About EcomStore</h1>
              <p className="lead text-muted">
                Your trusted partner in online shopping since 2020
              </p>
            </div>
          </Col>
        </Row>

        {/* Story Section */}
        <Row className="mb-5">
          <Col lg={6}>
            <h2 className="h3 fw-bold mb-4">Our Story</h2>
            <p className="mb-4">
              EcomStore was founded with a simple mission: to make quality products 
              accessible to everyone, everywhere. What started as a small online retailer 
              has grown into a comprehensive e-commerce platform serving customers worldwide.
            </p>
            <p className="mb-4">
              We believe that shopping online should be easy, secure, and enjoyable. 
              That's why we've built our platform with cutting-edge technology and 
              user-friendly design to provide you with the best possible shopping experience.
            </p>
            <p>
              Today, we're proud to offer thousands of products from trusted brands, 
              with fast shipping, excellent customer service, and competitive prices 
              that make quality accessible to all.
            </p>
          </Col>
          <Col lg={6}>
            <div className="text-center">
              <div 
                className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center"
                style={{ height: '400px' }}
              >
                <i className="bi bi-building text-primary" style={{ fontSize: '6rem' }}></i>
              </div>
            </div>
          </Col>
        </Row>

        {/* Values Section */}
        <Row className="mb-5">
          <Col>
            <h2 className="h3 fw-bold text-center mb-5">Our Values</h2>
          </Col>
        </Row>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-shield-check text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <Card.Title className="h5">Trust & Security</Card.Title>
                <Card.Text>
                  We prioritize the security of your personal information and 
                  ensure safe, encrypted transactions for every purchase.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-heart text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <Card.Title className="h5">Customer First</Card.Title>
                <Card.Text>
                  Your satisfaction is our top priority. We're committed to 
                  providing exceptional service and support at every step.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-lightning text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <Card.Title className="h5">Innovation</Card.Title>
                <Card.Text>
                  We continuously improve our platform with the latest technology 
                  to enhance your shopping experience.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Stats Section */}
        <Row className="mb-5 mt-5 py-5 bg-primary text-white rounded">
          <Col md={3} className="text-center mb-4">
            <div className="display-6 fw-bold">50K+</div>
            <p className="mb-0">Happy Customers</p>
          </Col>
          <Col md={3} className="text-center mb-4">
            <div className="display-6 fw-bold">10K+</div>
            <p className="mb-0">Products</p>
          </Col>
          <Col md={3} className="text-center mb-4">
            <div className="display-6 fw-bold">99%</div>
            <p className="mb-0">Satisfaction Rate</p>
          </Col>
          <Col md={3} className="text-center mb-4">
            <div className="display-6 fw-bold">24/7</div>
            <p className="mb-0">Customer Support</p>
          </Col>
        </Row>

        {/* Contact CTA */}
        <Row className="mt-5">
          <Col className="text-center">
            <h3 className="fw-bold mb-4">Ready to Shop With Us?</h3>
            <p className="lead mb-4">
              Join thousands of satisfied customers who trust EcomStore 
              for their shopping needs.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <a href="/products" className="btn btn-primary btn-lg">
                Start Shopping
              </a>
              <a href="/contact" className="btn btn-outline-primary btn-lg">
                Contact Us
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AboutPage;