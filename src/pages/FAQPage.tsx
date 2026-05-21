import React, { useState } from 'react';
import { Container, Row, Col, Accordion, Form, Badge, Card, Button } from 'react-bootstrap';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "How do I create an account?",
      answer: "To create an account, click on the 'Sign Up' button in the top right corner of our website. Fill in your email address, create a secure password, and provide your basic information. You'll receive a confirmation email to verify your account.",
      category: "account"
    },
    {
      id: 2,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through our encrypted payment gateway.",
      category: "payment"
    },
    {
      id: 3,
      question: "How long does shipping take?",
      answer: "Shipping times vary by location and shipping method:\n\n• Standard shipping (5-7 business days): Free on orders over ₹2000\n• Express shipping (2-3 business days): ₹150\n• Same day delivery (select cities): ₹300\n\nDelivery is available across India.",
      category: "shipping"
    },
    {
      id: 4,
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for unused items in their original condition and packaging. To initiate a return, log into your account and select 'Return Items' from your order history. We'll provide a prepaid return label for your convenience.",
      category: "returns"
    },
    {
      id: 5,
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email and SMS. You can also track your order by logging into your account and viewing your order history. Real-time tracking updates are available 24/7.",
      category: "shipping"
    },
    {
      id: 6,
      question: "Can I modify or cancel my order?",
      answer: "Orders can be modified or cancelled within 2 hours of placement. After this time, orders are processed and cannot be changed. Contact our customer service team immediately if you need to make changes.",
      category: "orders"
    },
    {
      id: 7,
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to over 50 countries worldwide. International shipping costs and delivery times vary by destination. Customs duties and taxes may apply and are the responsibility of the customer.",
      category: "shipping"
    },
    {
      id: 8,
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a secure reset link. Follow the instructions in the email to create a new password.",
      category: "account"
    },
    {
      id: 9,
      question: "Are my payment details secure?",
      answer: "Absolutely. We use industry-standard SSL encryption and PCI DSS compliance to protect your payment information. We never store your complete credit card details on our servers.",
      category: "payment"
    },
    {
      id: 10,
      question: "How can I contact customer support?",
      answer: "You can reach our customer support team through:\n\n• Live chat (available 24/7)\n• Email: support@vembarkaruppatti.com\n• Phone: +1 (555) 123-4567\n• Contact form on our website\n\nOur average response time is under 2 hours.",
      category: "support"
    },
    {
      id: 11,
      question: "Do you offer wholesale pricing?",
      answer: "Yes, we offer wholesale pricing for bulk orders. Contact our sales team at wholesale@vembarkaruppatti.com with your requirements, and we'll provide a custom quote within 24 hours.",
      category: "orders"
    },
    {
      id: 12,
      question: "What if I receive a damaged item?",
      answer: "If you receive a damaged item, please contact us immediately with photos of the damage. We'll arrange for a replacement or full refund, and provide a prepaid return label at no cost to you.",
      category: "returns"
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories', count: faqData.length },
    { value: 'account', label: 'Account & Login', count: faqData.filter(faq => faq.category === 'account').length },
    { value: 'payment', label: 'Payment & Billing', count: faqData.filter(faq => faq.category === 'payment').length },
    { value: 'shipping', label: 'Shipping & Delivery', count: faqData.filter(faq => faq.category === 'shipping').length },
    { value: 'returns', label: 'Returns & Refunds', count: faqData.filter(faq => faq.category === 'returns').length },
    { value: 'orders', label: 'Orders & Pricing', count: faqData.filter(faq => faq.category === 'orders').length },
    { value: 'support', label: 'Customer Support', count: faqData.filter(faq => faq.category === 'support').length }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-light">
      <Container className="py-5">
        {/* Hero Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center">
              <h1 className="display-4 fw-bold mb-4">Frequently Asked Questions</h1>
              <p className="lead text-muted">
                Find quick answers to common questions. Can't find what you're looking for? 
                <a href="/contact" className="text-decoration-none ms-1">Contact our support team</a>.
              </p>
            </div>
          </Col>
        </Row>

        {/* Search and Filter */}
        <Row className="mb-5">
          <Col lg={8} className="mx-auto">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3 mb-md-0">
                      <Form.Label className="fw-semibold">Search FAQs</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          placeholder="Type your question here..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="ps-5"
                        />
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Category</Form.Label>
                      <Form.Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label} ({category.count})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Category Filters */}
        <Row className="mb-4">
          <Col>
            <div className="text-center">
              <h6 className="text-muted mb-3">Quick Filters:</h6>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {categories.map(category => (
                  <Badge
                    key={category.value}
                    bg={selectedCategory === category.value ? "primary" : "light"}
                    text={selectedCategory === category.value ? "white" : "dark"}
                    className="p-2 cursor-pointer user-select-none"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {category.label} ({category.count})
                  </Badge>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {/* Results Count */}
        {(searchTerm || selectedCategory !== 'all') && (
          <Row className="mb-4">
            <Col>
              <div className="text-center">
                <p className="text-muted">
                  Showing {filteredFAQs.length} of {faqData.length} questions
                  {searchTerm && <span> for "{searchTerm}"</span>}
                </p>
              </div>
            </Col>
          </Row>
        )}

        {/* FAQ Accordion */}
        <Row>
          <Col lg={10} className="mx-auto">
            {filteredFAQs.length > 0 ? (
              <Accordion defaultActiveKey="0">
                {filteredFAQs.map((faq, index) => (
                  <Accordion.Item key={faq.id} eventKey={index.toString()}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center">
                        <Badge 
                          bg="primary" 
                          className="me-3"
                          style={{ textTransform: 'capitalize' }}
                        >
                          {faq.category}
                        </Badge>
                        <span className="fw-semibold">{faq.question}</span>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="pt-2">
                        {faq.answer.split('\n').map((line, lineIndex) => (
                          <p key={lineIndex} className={lineIndex === faq.answer.split('\n').length - 1 ? "mb-0" : "mb-2"}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            ) : (
              <Card className="border-0 shadow-sm text-center">
                <Card.Body className="p-5">
                  <i className="bi bi-search display-1 text-muted mb-3"></i>
                  <h4 className="fw-bold mb-3">No Questions Found</h4>
                  <p className="text-muted mb-4">
                    We couldn't find any questions matching your search criteria.
                  </p>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button variant="primary" href="/contact">
                      Contact Support
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Still Need Help Section */}
        <Row className="mt-5">
          <Col>
            <Card className="border-0 shadow-sm bg-primary text-white">
              <Card.Body className="p-5 text-center">
                <h3 className="fw-bold mb-3">Still Need Help?</h3>
                <p className="mb-4 opacity-75">
                  Can't find the answer you're looking for? Our customer support team is here to help.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <Button variant="light" size="lg" href="/contact">
                    <i className="bi bi-envelope me-2"></i>
                    Contact Support
                  </Button>
                  <Button variant="outline-light" size="lg" href="tel:+15551234567">
                    <i className="bi bi-telephone me-2"></i>
                    Call Us
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FAQPage;