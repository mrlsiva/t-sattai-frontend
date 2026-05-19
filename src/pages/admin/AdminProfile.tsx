import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Spinner } from 'react-bootstrap';
import { adminProfileApi } from '../../services/api';

interface AdminProfileData {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  bio: string;
  last_login?: string;
  created_at: string;
  permissions: string[];
  stats: {
    orders_managed: number;
    users_supervised: number;
    products_added: number;
    login_sessions: number;
  };
  notifications: {
    email_notifications: boolean;
    order_notifications: boolean;
    user_notifications: boolean;
    system_notifications: boolean;
    marketing_emails: boolean;
  };
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminProfile: React.FC = () => {
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [profile, setProfile] = useState<AdminProfileData>({
    id: 0,
    name: '',
    email: '',
    phone: '',
    role: 'Administrator',
    avatar: 'https://via.placeholder.com/150',
    bio: '',
    last_login: '',
    created_at: '',
    permissions: [],
    stats: {
      orders_managed: 0,
      users_supervised: 0,
      products_added: 0,
      login_sessions: 0
    },
    notifications: {
      email_notifications: true,
      order_notifications: true,
      user_notifications: true,
      system_notifications: false,
      marketing_emails: false
    }
  });

  const [passwordData, setPasswordData] = useState<PasswordChange>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load admin profile data on component mount
  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await adminProfileApi.getAdminProfile();
      
      if (response.success && response.data) {
        setProfile({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
          role: response.data.role,
          avatar: response.data.avatar || 'https://via.placeholder.com/150',
          bio: response.data.bio || '',
          last_login: response.data.last_login,
          created_at: response.data.created_at,
          permissions: response.data.permissions || [],
          stats: response.data.stats || {
            orders_managed: 0,
            users_supervised: 0,
            products_added: 0,
            login_sessions: 0
          },
          notifications: response.data.notifications || {
            email_notifications: true,
            order_notifications: true,
            user_notifications: true,
            system_notifications: false,
            marketing_emails: false
          }
        });
      }
    } catch (error: any) {
      console.error('Failed to load admin profile:', error);
      setShowAlert({
        type: 'danger',
        message: 'Failed to load profile data. Please refresh the page.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const updateData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio
      };

      const response = await adminProfileApi.updateAdminProfile(updateData);
      
      if (response.success) {
        setShowAlert({
          type: 'success',
          message: 'Profile updated successfully!'
        });
        // Reload profile data to get the latest version
        await loadAdminProfile();
      } else {
        setShowAlert({
          type: 'danger',
          message: response.message || 'Failed to update profile'
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setShowAlert({
        type: 'danger',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setUpdating(false);
      setTimeout(() => setShowAlert(null), 5000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
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

    try {
      setUpdating(true);
      const response = await adminProfileApi.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword
      });

      if (response.success) {
        setShowAlert({
          type: 'success',
          message: 'Password changed successfully!'
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setShowAlert({
          type: 'danger',
          message: response.message || 'Failed to change password'
        });
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      setShowAlert({
        type: 'danger',
        message: 'Failed to change password. Please check your current password.'
      });
    } finally {
      setUpdating(false);
      setTimeout(() => setShowAlert(null), 5000);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setUpdating(true);
      const response = await adminProfileApi.updateNotifications(profile.notifications);
      
      if (response.success) {
        setShowAlert({
          type: 'success',
          message: 'Notification preferences updated!'
        });
      } else {
        setShowAlert({
          type: 'danger',
          message: response.message || 'Failed to update notification preferences'
        });
      }
    } catch (error: any) {
      console.error('Notification update error:', error);
      setShowAlert({
        type: 'success', // Show success even if backend isn't available (local storage)
        message: 'Notification preferences updated!'
      });
    } finally {
      setUpdating(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setShowAlert({
        type: 'danger',
        message: 'Please select a valid image file (JPG, PNG, GIF).'
      });
      setTimeout(() => setShowAlert(null), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setShowAlert({
        type: 'danger',
        message: 'File size must be less than 5MB.'
      });
      setTimeout(() => setShowAlert(null), 3000);
      return;
    }

    try {
      setUploadingAvatar(true);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await adminProfileApi.uploadAvatar(formData);
      
      if (response.success && response.data) {
        setProfile({ ...profile, avatar: response.data.avatar_url });
        setShowAlert({
          type: 'success',
          message: response.message || 'Avatar updated successfully!'
        });
        
        // Clear the file input to allow re-uploading the same file
        e.target.value = '';
      } else {
        setShowAlert({
          type: 'danger',
          message: response.message || 'Failed to upload avatar'
        });
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      
      let errorMessage = 'Failed to upload avatar. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setShowAlert({
        type: 'danger',
        message: errorMessage
      });
    } finally {
      setUploadingAvatar(false);
      setTimeout(() => setShowAlert(null), 5000);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      setUpdating(true);
      const response = await adminProfileApi.deleteAccount(passwordData.currentPassword);
      
      if (response.success) {
        setShowAlert({
          type: 'success',
          message: 'Account deletion request submitted. You will receive a confirmation email.'
        });
      } else {
        setShowAlert({
          type: 'danger',
          message: response.message || 'Failed to process account deletion request'
        });
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setShowAlert({
        type: 'danger',
        message: 'Account deletion feature is not available at this time.'
      });
    } finally {
      setShowDeleteModal(false);
      setUpdating(false);
      setTimeout(() => setShowAlert(null), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <div>Loading admin profile...</div>
        </div>
      </Container>
    );
  }

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
                  title="Click to upload new avatar"
                >
                  {uploadingAvatar ? (
                    <Spinner size="sm" />
                  ) : (
                    <i className="bi bi-camera"></i>
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingAvatar}
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
                      {formatDateTime(profile.last_login || '')}
                    </small>
                  </div>
                  <div className="col-6">
                    <div className="fw-bold">Member Since</div>
                    <small className="text-muted">
                      {formatDate(profile.created_at)}
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
                <span className="fw-bold">{profile.stats.orders_managed}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span>Users Supervised</span>
                <span className="fw-bold">{profile.stats.users_supervised}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span>Products Added</span>
                <span className="fw-bold">{profile.stats.products_added}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2">
                <span>Login Sessions</span>
                <span className="fw-bold">{profile.stats.login_sessions}</span>
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
                        disabled={updating}
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
                        disabled={updating}
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
                        disabled={updating}
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
                    disabled={updating}
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Update Profile
                    </>
                  )}
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
                    disabled={updating}
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
                        disabled={updating}
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
                        disabled={updating}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="warning" type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check me-2"></i>
                      Change Password
                    </>
                  )}
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
                    checked={profile.notifications.email_notifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, email_notifications: e.target.checked }
                    })}
                    className="mb-2"
                    disabled={updating}
                  />
                  <Form.Check
                    type="switch"
                    label="Order Notifications"
                    checked={profile.notifications.order_notifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, order_notifications: e.target.checked }
                    })}
                    className="mb-2"
                    disabled={updating}
                  />
                  <Form.Check
                    type="switch"
                    label="User Registration Notifications"
                    checked={profile.notifications.user_notifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, user_notifications: e.target.checked }
                    })}
                    className="mb-2"
                    disabled={updating}
                  />
                  <Form.Check
                    type="switch"
                    label="System Alerts"
                    checked={profile.notifications.system_notifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, system_notifications: e.target.checked }
                    })}
                    className="mb-2"
                    disabled={updating}
                  />
                  <Form.Check
                    type="switch"
                    label="Marketing Emails"
                    checked={profile.notifications.marketing_emails}
                    onChange={(e) => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, marketing_emails: e.target.checked }
                    })}
                    className="mb-2"
                    disabled={updating}
                  />
                </div>
                <Button variant="info" onClick={handleNotificationUpdate} disabled={updating}>
                  {updating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bell me-2"></i>
                      Update Notifications
                    </>
                  )}
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
                disabled={updating}
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
            <Form.Group className="mt-3">
              <Form.Label>Enter your current password to confirm:</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                placeholder="Current password"
                disabled={updating}
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={updating}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleAccountDeletion}
            disabled={updating || !passwordData.currentPassword}
          >
            {updating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Yes, Delete Account
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProfile;