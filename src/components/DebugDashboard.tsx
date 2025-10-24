import React, { useState } from 'react';
import { Card, Button, Alert, Badge, Accordion, Form, Modal } from 'react-bootstrap';
import { stripeDebugger } from '../utils/stripeDebugger';
import PaymentBackendTester, { runBackendTest, quickTestConnection, quickTestCreateIntent } from '../utils/paymentBackendTester';
import { testAuthentication } from '../utils/authTester';
import { useAuth } from '../contexts/AuthContext';

interface DebugDashboardProps {
  show: boolean;
  onHide: () => void;
}

const DebugDashboard: React.FC<DebugDashboardProps> = ({ show, onHide }) => {
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [backendTestResults, setBackendTestResults] = useState<any>(null);
  const [authTestResults, setAuthTestResults] = useState<any>(null);
  const [stripeLogs, setStripeLogs] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuth();

  const handleRunAuthTest = async () => {
    setIsTestingAuth(true);
    setAuthTestResults(null);
    
    try {
      const results = await testAuthentication();
      setAuthTestResults(results);
    } catch (error) {
      console.error('Auth test failed:', error);
      setAuthTestResults([{
        step: 'Auth Test Error',
        success: false,
        message: 'Authentication test failed to run',
        error: error
      }]);
    } finally {
      setIsTestingAuth(false);
    }
  };

  const handleRunBackendTest = async () => {
    setIsTestingBackend(true);
    setBackendTestResults(null);
    
    try {
      const tester = new PaymentBackendTester();
      await tester.runFullTest();
      setBackendTestResults(tester.getResults());
    } catch (error) {
      console.error('Backend test failed:', error);
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleQuickConnectionTest = async () => {
    try {
      await quickTestConnection();
      alert('Connection test completed. Check console for results.');
    } catch (error) {
      alert('Connection test failed. Check console for details.');
    }
  };

  const handleQuickIntentTest = async () => {
    try {
      const clientSecret = await quickTestCreateIntent();
      if (clientSecret) {
        alert('Payment intent created successfully! Check console for details.');
      } else {
        alert('Payment intent creation failed. Check console for details.');
      }
    } catch (error) {
      alert('Payment intent test failed. Check console for details.');
    }
  };

  const refreshStripeLogs = () => {
    setStripeLogs(stripeDebugger.getLogs());
  };

  const clearAllLogs = () => {
    stripeDebugger.clearLogs();
    setStripeLogs([]);
    setBackendTestResults(null);
  };

  const exportAllData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        nodeEnv: process.env.NODE_ENV,
        stripeKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing'
      },
      stripeLogs: stripeDebugger.getLogs(),
      backendTestResults: backendTestResults
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stripe-debug-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    if (show) {
      refreshStripeLogs();
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-bug"></i> Stripe Payment Debug Dashboard
          <Badge bg="warning" className="ms-2">DEV ONLY</Badge>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Environment Status */}
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">Environment Status</h6>
          </Card.Header>
          <Card.Body>
            <div className="row">
              <div className="col-md-4">
                <small className="text-muted">Node Environment:</small>
                <div><Badge bg={process.env.NODE_ENV === 'development' ? 'success' : 'warning'}>
                  {process.env.NODE_ENV || 'unknown'}
                </Badge></div>
              </div>
              <div className="col-md-4">
                <small className="text-muted">Stripe Key:</small>
                <div><Badge bg={process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'success' : 'danger'}>
                  {process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing'}
                </Badge></div>
              </div>
              <div className="col-md-4">
                <small className="text-muted">Authentication:</small>
                <div><Badge bg={isAuthenticated ? 'success' : 'danger'}>
                  {isAuthenticated ? `✅ ${user?.email}` : '❌ Not logged in'}
                </Badge></div>
              </div>
            </div>
            
            <div className="mt-2">
              <Button variant="outline-primary" size="sm" onClick={() => stripeDebugger.validateEnvironment()}>
                Validate Environment
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">Quick Tests</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex gap-2 flex-wrap">
              <Button 
                variant="outline-success" 
                size="sm" 
                onClick={handleRunAuthTest}
                disabled={isTestingAuth}
              >
                {isTestingAuth ? 'Testing Auth...' : 'Test Authentication'}
              </Button>
              <Button 
                variant="outline-info" 
                size="sm" 
                onClick={handleQuickConnectionTest}
              >
                Test Backend Connection
              </Button>
              <Button 
                variant="outline-info" 
                size="sm" 
                onClick={handleQuickIntentTest}
              >
                Test Payment Intent
              </Button>
              <Button 
                variant="outline-warning" 
                size="sm" 
                onClick={handleRunBackendTest}
                disabled={isTestingBackend}
              >
                {isTestingBackend ? 'Running Full Test...' : 'Run Full Backend Test'}
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Authentication Test Results */}
        {authTestResults && (
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Authentication Test Results</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                {authTestResults.map((result: any, index: number) => (
                  <div key={index} className="d-flex align-items-center mb-1">
                    <span className="me-2">
                      {result.success ? '✅' : '❌'}
                    </span>
                    <span className={result.success ? 'text-success' : 'text-danger'}>
                      {result.step}
                    </span>
                    <small className="text-muted ms-2">
                      {result.message}
                    </small>
                  </div>
                ))}
              </div>
              
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>View Detailed Auth Results</Accordion.Header>
                  <Accordion.Body>
                    <pre className="bg-light p-2 small" style={{ maxHeight: '300px', overflow: 'auto' }}>
                      {JSON.stringify(authTestResults, null, 2)}
                    </pre>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        )}

        {/* Backend Test Results */}
        {backendTestResults && (
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Backend Test Results</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                {backendTestResults.map((result: any, index: number) => (
                  <div key={index} className="d-flex align-items-center mb-1">
                    <span className="me-2">
                      {result.success ? '✅' : '❌'}
                    </span>
                    <span className={result.success ? 'text-success' : 'text-danger'}>
                      {result.step}
                    </span>
                    {!result.success && result.error && (
                      <small className="text-muted ms-2">
                        ({result.error.message || 'Unknown error'})
                      </small>
                    )}
                  </div>
                ))}
              </div>
              
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>View Detailed Results</Accordion.Header>
                  <Accordion.Body>
                    <pre className="bg-light p-2 small" style={{ maxHeight: '300px', overflow: 'auto' }}>
                      {JSON.stringify(backendTestResults, null, 2)}
                    </pre>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        )}

        {/* Stripe Logs */}
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Stripe Debug Logs ({stripeLogs.length})</h6>
            <Button variant="outline-secondary" size="sm" onClick={refreshStripeLogs}>
              Refresh
            </Button>
          </Card.Header>
          <Card.Body>
            {stripeLogs.length === 0 ? (
              <div className="text-muted text-center py-3">
                No logs available. Perform some payment actions to see logs here.
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {stripeLogs.map((log, index) => (
                  <div key={index} className="border-bottom pb-2 mb-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <span className={`badge bg-${log.level === 'error' ? 'danger' : log.level === 'warn' ? 'warning' : 'info'}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <small className="text-muted">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                    <div className="mt-1">
                      <strong>{log.message}</strong>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-muted small" style={{ cursor: 'pointer' }}>
                            View data
                          </summary>
                          <pre className="bg-light p-2 small mt-1" style={{ fontSize: '0.75rem' }}>
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Actions */}
        <Card>
          <Card.Header>
            <h6 className="mb-0">Actions</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex gap-2 flex-wrap">
              <Button variant="outline-success" size="sm" onClick={exportAllData}>
                Export All Debug Data
              </Button>
              <Button variant="outline-danger" size="sm" onClick={clearAllLogs}>
                Clear All Logs
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => console.log('All Debug Data:', {
                  stripeLogs: stripeDebugger.getLogs(),
                  backendTestResults
                })}
              >
                Log to Console
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DebugDashboard;