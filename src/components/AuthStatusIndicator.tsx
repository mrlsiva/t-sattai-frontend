import React from 'react';
import { Alert, Badge, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

interface AuthStatusIndicatorProps {
  showDetails?: boolean;
}

const AuthStatusIndicator: React.FC<AuthStatusIndicatorProps> = ({ showDetails = false }) => {
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem('auth_token');
  
  const getAuthStatus = () => {
    if (!isAuthenticated || !token) {
      return {
        status: 'unauthenticated',
        variant: 'danger',
        icon: 'x-circle',
        message: 'Not authenticated - Login required for checkout'
      };
    }
    
    if (isAuthenticated && token) {
      return {
        status: 'authenticated',
        variant: 'success',
        icon: 'check-circle',
        message: `Authenticated as ${user?.email || 'Unknown user'}`
      };
    }
    
    return {
      status: 'partial',
      variant: 'warning',
      icon: 'exclamation-triangle',
      message: 'Partial authentication - Please refresh and login again'
    };
  };

  const authStatus = getAuthStatus();

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <Alert variant={authStatus.variant} className="d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center">
        <i className={`bi bi-${authStatus.icon} me-2`}></i>
        <div>
          <strong>Authentication Status: </strong>
          <Badge bg={authStatus.variant} className="me-2">
            {authStatus.status.toUpperCase()}
          </Badge>
          <span>{authStatus.message}</span>
          
          {showDetails && token && (
            <div className="mt-2">
              <small className="text-muted">
                <strong>Token:</strong> {token.substring(0, 20)}...
                <br />
                <strong>Length:</strong> {token.length} characters
                <br />
                <strong>User ID:</strong> {user?.id || 'Unknown'}
              </small>
            </div>
          )}
        </div>
      </div>
      
      {authStatus.status === 'unauthenticated' && (
        <Button variant="primary" size="sm" onClick={handleLoginRedirect}>
          Login Now
        </Button>
      )}
    </Alert>
  );
};

export default AuthStatusIndicator;