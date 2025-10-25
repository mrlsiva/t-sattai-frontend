import React from 'react';
import { Button, Alert, Card, Form, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const AddressDebugHelper: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [testAddress, setTestAddress] = React.useState({
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    country: 'US'
  });

  const addTestAddressToProfile = async () => {
    try {
      await updateProfile(testAddress);
      alert('Test address added to profile! Go to checkout to see if it works.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. This might be because the backend endpoint is not available.');
    }
  };

  const clearAddressFromProfile = async () => {
    try {
      await updateProfile({
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: ''
      });
      alert('Address cleared from profile.');
    } catch (error) {
      console.error('Failed to clear profile:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setTestAddress(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-4 border-warning">
      <Card.Header className="bg-warning bg-opacity-10">
        <h6 className="mb-0">🔧 Address Debug Helper</h6>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-3">
          <strong>Purpose:</strong> This tool helps test the address functionality by adding test address data to your user profile.
        </Alert>
        
        <Form className="mb-3">
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={testAddress.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>City</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={testAddress.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>State</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={testAddress.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>ZIP Code</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={testAddress.zip_code}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={testAddress.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <div className="d-flex gap-2">
          <Button variant="success" size="sm" onClick={addTestAddressToProfile}>
            Add Test Address to Profile
          </Button>
          <Button variant="outline-danger" size="sm" onClick={clearAddressFromProfile}>
            Clear Address from Profile
          </Button>
        </div>

        <div className="mt-3">
          <small className="text-muted">
            <strong>Current User Profile:</strong><br />
            Name: {user?.name}<br />
            Address: {user?.address || 'Not set'}<br />
            City: {user?.city || 'Not set'}<br />
            State: {user?.state || 'Not set'}<br />
            ZIP: {user?.zip_code || 'Not set'}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AddressDebugHelper;