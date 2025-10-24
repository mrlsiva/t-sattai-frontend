import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

interface AdminProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  bio: string;
  lastLogin: string;
  accountCreated: string;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  orderNotifications: boolean;
  userNotifications: boolean;
  systemNotifications: boolean;
  marketingEmails: boolean;
}

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [profile, setProfile] = useState<AdminProfileData>({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@ecomstore.com',
    phone: '+1 (555) 123-4567',
    role: 'Super Administrator',
    avatar: 'https://via.placeholder.com/150',
    bio: 'Experienced e-commerce administrator with expertise in online retail management and customer service.',
    lastLogin: '2024-01-25 14:30:00',
    accountCreated: '2023-12-01 09:15:00'
  });

  const [passwordData, setPasswordData] = useState<PasswordChange>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    orderNotifications: true,
    userNotifications: true,
    systemNotifications: false,
    marketingEmails: false
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setShowAlert({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      setTimeout(() => setShowAlert(null), 3000);
    }, 500);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setShowAlert({
        type: 'danger',
        message: 'New passwords do not match!'
      });
      setTimeout(() => setShowAlert(null), 3000);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setShowAlert({
        type: 'danger',
        message: 'Password must be at least 8 characters long!'
      });
      setTimeout(() => setShowAlert(null), 3000);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setShowAlert({
        type: 'success',
        message: 'Password changed successfully!'
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowAlert(null), 3000);
    }, 500);
  };

  const handleNotificationUpdate = () => {
    // Simulate API call
    setTimeout(() => {
      setShowAlert({
        type: 'success',
        message: 'Notification preferences updated!'
      });
      setTimeout(() => setShowAlert(null), 3000);
    }, 500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file upload
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile({...profile, avatar: e.target?.result as string});
        setShowAlert({
          type: 'success',
          message: 'Avatar updated successfully!'
        });
        setTimeout(() => setShowAlert(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccountDeletion = () => {
    // Simulate account deletion
    setShowDeleteModal(false);
    setShowAlert({
      type: 'success',
      message: 'Account deletion request submitted. You will receive a confirmation email.'
    });
    setTimeout(() => setShowAlert(null), 5000);
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Admin Profile</h2>
          <p className="text-muted mb-0">Manage your personal information and account settings</p>
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

      <Row>
        {/* Profile Overview */}
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block">
                <img
                  src={profile.avatar}
                  alt="Profile Avatar"
                  className="rounded-circle mb-3"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
                <label
                  htmlFor="avatar-upload"
                  className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2"
                  style={{ cursor: 'pointer', transform: 'translate(25%, 25%)' }}
                >
                  <i className="bi bi-camera"></i>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <h4 className="fw-bold">{profile.name}</h4>
              <p className="text-muted mb-2">{profile.role}</p>
              <p className="text-muted small mb-3">{profile.email}</p>
              
              <div className="border-top pt-3">
                <div className="row text-center">
                  <div className="col-6">
                    <div className="fw-bold">Last Login</div>
                    <small className="text-muted">
                      {new Date(profile.lastLogin).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="col-6">
                    <div className="fw-bold">Member Since</div>
                    <small className="text-muted">
                      {new Date(profile.accountCreated).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h6 className="fw-bold mb-0">Account Statistics</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span>Orders Managed</span>
                <span className="fw-bold">1,247</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span>Users Supervised</span>
                <span className="fw-bold">89</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span>Products Added</span>
                <span className="fw-bold">156</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2">
                <span>Login Sessions</span>
                <span className="fw-bold">342</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Profile Settings */}
        <Col lg={8}>
          {/* Personal Information */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Personal Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileUpdate}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
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
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.role}
                        disabled
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        Contact super admin to change role
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  <i className="bi bi-check-lg me-2"></i>
                  Update Profile
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Password Change */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Change Password</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handlePasswordChange}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        minLength={8}
                      />
                      <Form.Text className="text-muted">
                        Minimum 8 characters
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        minLength={8}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="warning" type="submit">
                  <i className="bi bi-shield-check me-2"></i>
                  Change Password
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Notification Preferences */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Notification Preferences</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    label="Email Notifications"
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                    className="mb-2"
                  />
                  <Form.Check
                    type="switch"
                    label="Order Notifications"
                    checked={notifications.orderNotifications}
                    onChange={(e) => setNotifications({...notifications, orderNotifications: e.target.checked})}
                    className="mb-2"
                  />
                  <Form.Check
                    type="switch"
                    label="User Registration Notifications"
                    checked={notifications.userNotifications}
                    onChange={(e) => setNotifications({...notifications, userNotifications: e.target.checked})}
                    className="mb-2"
                  />
                  <Form.Check
                    type="switch"
                    label="System Alerts"
                    checked={notifications.systemNotifications}
                    onChange={(e) => setNotifications({...notifications, systemNotifications: e.target.checked})}
                    className="mb-2"
                  />
                  <Form.Check
                    type="switch"
                    label="Marketing Emails"
                    checked={notifications.marketingEmails}
                    onChange={(e) => setNotifications({...notifications, marketingEmails: e.target.checked})}
                    className="mb-2"
                  />
                </div>
                <Button variant="info" onClick={handleNotificationUpdate}>
                  <i className="bi bi-bell me-2"></i>
                  Update Notifications
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Danger Zone */}
          <Card className="border-danger shadow-sm">
            <Card.Header className="bg-danger bg-opacity-10 border-0">
              <h5 className="fw-bold mb-0 text-danger">Danger Zone</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button 
                variant="outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="bi bi-exclamation-triangle me-2"></i>
                Delete Account
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="bi bi-exclamation-triangle text-danger display-4 mb-3"></i>
            <h5>Are you absolutely sure?</h5>
            <p className="text-muted">
              This action cannot be undone. This will permanently delete your admin account 
              and remove all associated data from our servers.
            </p>
            <Alert variant="danger" className="text-start">
              <strong>This will:</strong>
              <ul className="mb-0 mt-2">
                <li>Delete your profile and personal information</li>
                <li>Revoke all admin privileges</li>
                <li>Remove access to the admin panel</li>
                <li>Cannot be reversed</li>
              </ul>
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleAccountDeletion}>
            <i className="bi bi-trash me-2"></i>
            Yes, Delete Account
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProfile;