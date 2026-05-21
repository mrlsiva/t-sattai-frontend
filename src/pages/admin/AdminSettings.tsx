import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Nav, Tab, Spinner } from 'react-bootstrap';
import api from '../../utils/api';
import { useSiteSettings, WeekSchedule, DayKey, DAY_LIST, DEFAULT_SCHEDULE } from '../../contexts/SettingsContext';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  addressCountry: string;
  currency: string;
  timezone: string;
  language: string;
  showBusinessHours: boolean;
  businessHoursSchedule: WeekSchedule;
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
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refetch: refetchSiteSettings } = useSiteSettings();

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Vembar Karupatti',
    siteDescription: 'Pure traditional jaggery from South India',
    contactEmail: 'support@vembarkarupatti.in',
    supportPhone: '+91 99940 90422',
    addressStreet: 'Vembar',
    addressCity: 'Vembar',
    addressState: 'Tamil Nadu',
    addressPincode: '628501',
    addressCountry: 'India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en',
    showBusinessHours: true,
    businessHoursSchedule: DEFAULT_SCHEDULE,
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
    fromEmail: 'noreply@vembarkaruppatti.com',
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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data?.success && response.data?.data) {
          const d = response.data.data;
          if (d.system) {
            const sys = { ...d.system };
            // Force booleans — backend stores these as strings "true"/"false"
            if ('showBusinessHours' in sys) {
              sys.showBusinessHours = sys.showBusinessHours === true || sys.showBusinessHours === 1 || sys.showBusinessHours === 'true';
            }
            // Normalise schedule key — backend returns camelCase but guard against snake_case
            const schedule = sys.businessHoursSchedule ?? sys.business_hours_schedule;
            if (schedule) {
              sys.businessHoursSchedule = { ...DEFAULT_SCHEDULE, ...schedule };
              delete sys.business_hours_schedule;
            }
            setSystemSettings(prev => ({ ...prev, ...sys }));
          }
          if (d.payment) setPaymentSettings(prev => ({ ...prev, ...d.payment }));
          if (d.shipping) setShippingSettings(prev => ({ ...prev, ...d.shipping }));
          if (d.email) setEmailSettings(prev => ({ ...prev, ...d.email }));
          if (d.security) setSecuritySettings(prev => ({ ...prev, ...d.security }));
        }
      } catch {
        // keep defaults on error
      } finally {
        setPageLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (group: string, payload: object) => {
    try {
      setSaving(true);
      const response = await api.post(`/admin/settings/${group.toLowerCase()}`, payload);
      if (response.data?.success) {
        setShowAlert({ type: 'success', message: `${group} settings saved successfully!` });
        refetchSiteSettings();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
    } catch (err: any) {
      setShowAlert({ type: 'danger', message: err.message || `Failed to save ${group} settings` });
    } finally {
      setSaving(false);
      setTimeout(() => setShowAlert(null), 4000);
    }
  };

  const handleTestConnection = async (type: string) => {
    try {
      const response = await api.post(`/admin/settings/test-${type.toLowerCase()}`);
      setShowAlert({
        type: response.data?.success ? 'success' : 'danger',
        message: response.data?.message || `${type} connection test successful!`
      });
    } catch (err: any) {
      setShowAlert({ type: 'danger', message: err.response?.data?.message || `${type} connection test failed` });
    } finally {
      setTimeout(() => setShowAlert(null), 4000);
    }
  };

  if (pageLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

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
                      </Row>

                      {/* Address */}
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Address</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Street / Door No."
                          value={systemSettings.addressStreet}
                          onChange={(e) => setSystemSettings({...systemSettings, addressStreet: e.target.value})}
                          className="mb-2"
                        />
                        <Row>
                          <Col md={4}>
                            <Form.Control
                              type="text"
                              placeholder="City"
                              value={systemSettings.addressCity}
                              onChange={(e) => setSystemSettings({...systemSettings, addressCity: e.target.value})}
                            />
                          </Col>
                          <Col md={4}>
                            <Form.Control
                              type="text"
                              placeholder="State"
                              value={systemSettings.addressState}
                              onChange={(e) => setSystemSettings({...systemSettings, addressState: e.target.value})}
                            />
                          </Col>
                          <Col md={2}>
                            <Form.Control
                              type="text"
                              placeholder="Pincode"
                              value={systemSettings.addressPincode}
                              onChange={(e) => setSystemSettings({...systemSettings, addressPincode: e.target.value})}
                            />
                          </Col>
                          <Col md={2}>
                            <Form.Control
                              type="text"
                              placeholder="Country"
                              value={systemSettings.addressCountry}
                              onChange={(e) => setSystemSettings({...systemSettings, addressCountry: e.target.value})}
                            />
                          </Col>
                        </Row>
                      </Form.Group>

                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Currency</Form.Label>
                            <Form.Select
                              value={systemSettings.currency}
                              onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
                              disabled
                            >
                              <option value="INR">INR - Indian Rupee (₹)</option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Only INR is supported for this store
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Timezone</Form.Label>
                            <Form.Select
                              value={systemSettings.timezone}
                              onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                              disabled
                            >
                              <option value="Asia/Kolkata">India Standard Time (IST)</option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Only IST is supported for this store
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4 p-3 border rounded">
                        <Form.Label className="fw-semibold d-block mb-2">Display Options</Form.Label>
                        <Form.Check
                          type="checkbox"
                          id="showBusinessHours"
                          label="Show Business Hours on Contact page and Footer"
                          checked={systemSettings.showBusinessHours}
                          onChange={(e) => setSystemSettings({...systemSettings, showBusinessHours: e.target.checked})}
                          className="mb-3"
                        />
                        {systemSettings.showBusinessHours && (
                          <div className="mt-3">
                            {/* Header row */}
                            <Row className="g-2 mb-1 text-muted small fw-semibold px-1">
                              <Col xs={3}>Day</Col>
                              <Col xs={2}>Status</Col>
                              <Col xs={3}>Open</Col>
                              <Col xs={1} className="text-center px-0">–</Col>
                              <Col xs={3}>Close</Col>
                            </Row>
                            {DAY_LIST.map(({ key, label }) => {
                              const day = systemSettings.businessHoursSchedule[key as DayKey];
                              const updateDay = (field: 'open' | 'from' | 'to', value: any) =>
                                setSystemSettings(prev => ({
                                  ...prev,
                                  businessHoursSchedule: {
                                    ...prev.businessHoursSchedule,
                                    [key]: { ...prev.businessHoursSchedule[key as DayKey], [field]: value },
                                  },
                                }));
                              return (
                                <Row key={key} className="g-2 align-items-center mb-2 px-1 py-1 rounded"
                                  style={{ background: day.open ? '#f8f9fa' : '#fff0f0' }}>
                                  <Col xs={3}>
                                    <small className="fw-semibold">{label}</small>
                                  </Col>
                                  <Col xs={2}>
                                    <Form.Check
                                      type="switch"
                                      checked={day.open}
                                      onChange={(e) => updateDay('open', e.target.checked)}
                                      title={day.open ? 'Open' : 'Closed'}
                                    />
                                    <small className={day.open ? 'text-success' : 'text-danger'} style={{ fontSize: '10px' }}>
                                      {day.open ? 'Open' : 'Closed'}
                                    </small>
                                  </Col>
                                  <Col xs={3}>
                                    <Form.Control
                                      type="time"
                                      size="sm"
                                      value={day.from}
                                      disabled={!day.open}
                                      onChange={(e) => updateDay('from', e.target.value)}
                                    />
                                  </Col>
                                  <Col xs={1} className="text-center px-0">
                                    <small className="text-muted">–</small>
                                  </Col>
                                  <Col xs={3}>
                                    <Form.Control
                                      type="time"
                                      size="sm"
                                      value={day.to}
                                      disabled={!day.open}
                                      onChange={(e) => updateDay('to', e.target.value)}
                                    />
                                  </Col>
                                </Row>
                              );
                            })}
                          </div>
                        )}
                      </Form.Group>

                      <Button variant="primary" disabled={saving} onClick={() => handleSaveSettings('System', systemSettings)}>
                        {saving ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : <i className="bi bi-check-lg me-2"></i>}
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
                          <small className="text-muted d-block mb-3">
                            <i className="bi bi-info-circle me-1"></i>
                            Save settings first, then verify PayPal credentials in your PayPal dashboard.
                          </small>
                        </>
                      )}

                      <div className="border-top pt-3">
                        <Button variant="primary" disabled={saving} onClick={() => handleSaveSettings('Payment', paymentSettings)}>
                          {saving ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : <i className="bi bi-check-lg me-2"></i>}
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
                      <Button variant="primary" disabled={saving} onClick={() => handleSaveSettings('Shipping', shippingSettings)}>
                        {saving ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : <i className="bi bi-check-lg me-2"></i>}
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
                        <Button variant="primary" disabled={saving} onClick={() => handleSaveSettings('Email', emailSettings)}>
                          {saving ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : <i className="bi bi-check-lg me-2"></i>}
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
                      <Button variant="primary" disabled={saving} onClick={() => handleSaveSettings('Security', securitySettings)}>
                        {saving ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : <i className="bi bi-check-lg me-2"></i>}
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