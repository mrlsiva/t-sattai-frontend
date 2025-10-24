import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Nav, Tab } from 'react-bootstrap';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  language: string;
}

interface PaymentSettings {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  paypalClientId: string;
  paypalClientSecret: string;
}

interface ShippingSettings {
  freeShippingThreshold: number;
  standardShippingCost: number;
  expressShippingCost: number;
  overnightShippingCost: number;
  internationalShipping: boolean;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: string;
  fromEmail: string;
  fromName: string;
}

interface SecuritySettings {
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'E-Commerce Store',
    siteDescription: 'Your premier destination for quality products',
    contactEmail: 'support@ecomstore.com',
    supportPhone: '+1 (555) 123-4567',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en'
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripeEnabled: true,
    paypalEnabled: false,
    stripePublishableKey: 'pk_test_...',
    stripeSecretKey: 'sk_test_...',
    paypalClientId: '',
    paypalClientSecret: ''
  });

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: 50.00,
    standardShippingCost: 5.99,
    expressShippingCost: 12.99,
    overnightShippingCost: 24.99,
    internationalShipping: true
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    fromEmail: 'noreply@ecomstore.com',
    fromName: 'E-Commerce Store'
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeout: 120,
    maxLoginAttempts: 5
  });

  const handleSaveSettings = (settingsType: string) => {
    // Simulate API call
    setTimeout(() => {
      setShowAlert({
        type: 'success',
        message: `${settingsType} settings saved successfully!`
      });
      setTimeout(() => setShowAlert(null), 3000);
    }, 500);
  };

  const handleTestConnection = (type: string) => {
    // Simulate connection test
    setTimeout(() => {
      setShowAlert({
        type: 'success',
        message: `${type} connection test successful!`
      });
      setTimeout(() => setShowAlert(null), 3000);
    }, 1000);
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">System Settings</h2>
          <p className="text-muted mb-0">Configure your store settings and preferences</p>
        </div>
      </div>

      {showAlert && (
        <Row className="mb-4">
          <Col>
            <Alert variant={showAlert.type} dismissible onClose={() => setShowAlert(null)}>
              {showAlert.message}
            </Alert>
          </Col>
        </Row>
      )}

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'system')}>
        <Row>
          {/* Settings Navigation */}
          <Col lg={3} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column p-3">
                  <Nav.Item>
                    <Nav.Link eventKey="system" className="d-flex align-items-center">
                      <i className="bi bi-gear me-2"></i>
                      System Settings
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="payment" className="d-flex align-items-center">
                      <i className="bi bi-credit-card me-2"></i>
                      Payment Settings
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="shipping" className="d-flex align-items-center">
                      <i className="bi bi-truck me-2"></i>
                      Shipping Settings
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="email" className="d-flex align-items-center">
                      <i className="bi bi-envelope me-2"></i>
                      Email Settings
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="security" className="d-flex align-items-center">
                      <i className="bi bi-shield-lock me-2"></i>
                      Security Settings
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Settings Content */}
          <Col lg={9}>
            <Tab.Content>
              {/* System Settings */}
              <Tab.Pane eventKey="system">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="fw-bold mb-0">System Configuration</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Site Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={systemSettings.siteName}
                              onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contact Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={systemSettings.contactEmail}
                              onChange={(e) => setSystemSettings({...systemSettings, contactEmail: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Site Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={systemSettings.siteDescription}
                          onChange={(e) => setSystemSettings({...systemSettings, siteDescription: e.target.value})}
                        />
                      </Form.Group>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Support Phone</Form.Label>
                            <Form.Control
                              type="tel"
                              value={systemSettings.supportPhone}
                              onChange={(e) => setSystemSettings({...systemSettings, supportPhone: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Currency</Form.Label>
                            <Form.Select
                              value={systemSettings.currency}
                              onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
                            >
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="GBP">GBP - British Pound</option>
                              <option value="CAD">CAD - Canadian Dollar</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Timezone</Form.Label>
                            <Form.Select
                              value={systemSettings.timezone}
                              onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                            >
                              <option value="America/New_York">Eastern Time</option>
                              <option value="America/Chicago">Central Time</option>
                              <option value="America/Denver">Mountain Time</option>
                              <option value="America/Los_Angeles">Pacific Time</option>
                              <option value="UTC">UTC</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Button variant="primary" onClick={() => handleSaveSettings('System')}>
                        <i className="bi bi-check-lg me-2"></i>
                        Save System Settings
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Payment Settings */}
              <Tab.Pane eventKey="payment">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="fw-bold mb-0">Payment Configuration</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <h6 className="fw-bold mb-3">Payment Methods</h6>
                      <Row className="mb-4">
                        <Col md={6}>
                          <Form.Check
                            type="switch"
                            label="Enable Stripe Payments"
                            checked={paymentSettings.stripeEnabled}
                            onChange={(e) => setPaymentSettings({...paymentSettings, stripeEnabled: e.target.checked})}
                            className="mb-3"
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Check
                            type="switch"
                            label="Enable PayPal Payments"
                            checked={paymentSettings.paypalEnabled}
                            onChange={(e) => setPaymentSettings({...paymentSettings, paypalEnabled: e.target.checked})}
                            className="mb-3"
                          />
                        </Col>
                      </Row>

                      {paymentSettings.stripeEnabled && (
                        <>
                          <h6 className="fw-bold mb-3">Stripe Configuration</h6>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Stripe Publishable Key</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={paymentSettings.stripePublishableKey}
                                  onChange={(e) => setPaymentSettings({...paymentSettings, stripePublishableKey: e.target.value})}
                                  placeholder="pk_test_..."
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Stripe Secret Key</Form.Label>
                                <Form.Control
                                  type="password"
                                  value={paymentSettings.stripeSecretKey}
                                  onChange={(e) => setPaymentSettings({...paymentSettings, stripeSecretKey: e.target.value})}
                                  placeholder="sk_test_..."
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          <Button 
                            variant="outline-secondary" 
                            className="me-2 mb-3"
                            onClick={() => handleTestConnection('Stripe')}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            Test Stripe Connection
                          </Button>
                        </>
                      )}

                      {paymentSettings.paypalEnabled && (
                        <>
                          <h6 className="fw-bold mb-3 mt-4">PayPal Configuration</h6>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>PayPal Client ID</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={paymentSettings.paypalClientId}
                                  onChange={(e) => setPaymentSettings({...paymentSettings, paypalClientId: e.target.value})}
                                  placeholder="Your PayPal Client ID"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>PayPal Client Secret</Form.Label>
                                <Form.Control
                                  type="password"
                                  value={paymentSettings.paypalClientSecret}
                                  onChange={(e) => setPaymentSettings({...paymentSettings, paypalClientSecret: e.target.value})}
                                  placeholder="Your PayPal Client Secret"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          <Button 
                            variant="outline-secondary" 
                            className="me-2 mb-3"
                            onClick={() => handleTestConnection('PayPal')}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            Test PayPal Connection
                          </Button>
                        </>
                      )}

                      <div className="border-top pt-3">
                        <Button variant="primary" onClick={() => handleSaveSettings('Payment')}>
                          <i className="bi bi-check-lg me-2"></i>
                          Save Payment Settings
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Shipping Settings */}
              <Tab.Pane eventKey="shipping">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="fw-bold mb-0">Shipping Configuration</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <h6 className="fw-bold mb-3">Shipping Costs</h6>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Free Shipping Threshold ($)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={shippingSettings.freeShippingThreshold}
                              onChange={(e) => setShippingSettings({...shippingSettings, freeShippingThreshold: parseFloat(e.target.value)})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Standard Shipping ($)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={shippingSettings.standardShippingCost}
                              onChange={(e) => setShippingSettings({...shippingSettings, standardShippingCost: parseFloat(e.target.value)})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Express Shipping ($)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={shippingSettings.expressShippingCost}
                              onChange={(e) => setShippingSettings({...shippingSettings, expressShippingCost: parseFloat(e.target.value)})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Overnight Shipping ($)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={shippingSettings.overnightShippingCost}
                              onChange={(e) => setShippingSettings({...shippingSettings, overnightShippingCost: parseFloat(e.target.value)})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Check
                        type="switch"
                        label="Enable International Shipping"
                        checked={shippingSettings.internationalShipping}
                        onChange={(e) => setShippingSettings({...shippingSettings, internationalShipping: e.target.checked})}
                        className="mb-3"
                      />
                      <Button variant="primary" onClick={() => handleSaveSettings('Shipping')}>
                        <i className="bi bi-check-lg me-2"></i>
                        Save Shipping Settings
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Email Settings */}
              <Tab.Pane eventKey="email">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="fw-bold mb-0">Email Configuration</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <h6 className="fw-bold mb-3">SMTP Settings</h6>
                      <Row>
                        <Col md={8}>
                          <Form.Group className="mb-3">
                            <Form.Label>SMTP Host</Form.Label>
                            <Form.Control
                              type="text"
                              value={emailSettings.smtpHost}
                              onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                              placeholder="smtp.gmail.com"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>SMTP Port</Form.Label>
                            <Form.Control
                              type="number"
                              value={emailSettings.smtpPort}
                              onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value)})}
                              placeholder="587"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>SMTP Username</Form.Label>
                            <Form.Control
                              type="text"
                              value={emailSettings.smtpUsername}
                              onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                              placeholder="your-email@gmail.com"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>SMTP Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={emailSettings.smtpPassword}
                              onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                              placeholder="Your app password"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Encryption</Form.Label>
                            <Form.Select
                              value={emailSettings.smtpEncryption}
                              onChange={(e) => setEmailSettings({...emailSettings, smtpEncryption: e.target.value})}
                            >
                              <option value="tls">TLS</option>
                              <option value="ssl">SSL</option>
                              <option value="none">None</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>From Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={emailSettings.fromEmail}
                              onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                              placeholder="noreply@yourdomain.com"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>From Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={emailSettings.fromName}
                              onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                              placeholder="Your Store Name"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="d-flex gap-2">
                        <Button variant="primary" onClick={() => handleSaveSettings('Email')}>
                          <i className="bi bi-check-lg me-2"></i>
                          Save Email Settings
                        </Button>
                        <Button 
                          variant="outline-secondary"
                          onClick={() => handleTestConnection('Email')}
                        >
                          <i className="bi bi-envelope-check me-2"></i>
                          Test Email Connection
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Security Settings */}
              <Tab.Pane eventKey="security">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="fw-bold mb-0">Security Configuration</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <h6 className="fw-bold mb-3">Password Requirements</h6>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Minimum Password Length</Form.Label>
                            <Form.Control
                              type="number"
                              min="6"
                              max="50"
                              value={securitySettings.passwordMinLength}
                              onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Session Timeout (minutes)</Form.Label>
                            <Form.Control
                              type="number"
                              min="15"
                              max="1440"
                              value={securitySettings.sessionTimeout}
                              onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Check
                            type="switch"
                            label="Require Uppercase Letters"
                            checked={securitySettings.requireUppercase}
                            onChange={(e) => setSecuritySettings({...securitySettings, requireUppercase: e.target.checked})}
                            className="mb-3"
                          />
                          <Form.Check
                            type="switch"
                            label="Require Numbers"
                            checked={securitySettings.requireNumbers}
                            onChange={(e) => setSecuritySettings({...securitySettings, requireNumbers: e.target.checked})}
                            className="mb-3"
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Check
                            type="switch"
                            label="Require Special Characters"
                            checked={securitySettings.requireSpecialChars}
                            onChange={(e) => setSecuritySettings({...securitySettings, requireSpecialChars: e.target.checked})}
                            className="mb-3"
                          />
                          <Form.Group className="mb-3">
                            <Form.Label>Max Login Attempts</Form.Label>
                            <Form.Control
                              type="number"
                              min="3"
                              max="10"
                              value={securitySettings.maxLoginAttempts}
                              onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Button variant="primary" onClick={() => handleSaveSettings('Security')}>
                        <i className="bi bi-check-lg me-2"></i>
                        Save Security Settings
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default AdminSettings;