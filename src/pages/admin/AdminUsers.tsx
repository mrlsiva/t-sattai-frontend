import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap';
import { adminUsersApi } from '../../services/api';
import { User } from '../../types';

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  customers: number;
  newThisMonth: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    customers: 0,
    newThisMonth: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'customer' as 'admin' | 'customer',
    status: 'active' as 'active' | 'inactive' | 'banned'
  });

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'customer', label: 'Customer' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'banned', label: 'Banned' }
  ];

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminUsersApi.getAllUsers({
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      if (result.success) {
        setUsers(result.data || []);
        
        // Show appropriate message based on fallback status
        if (result.message?.includes('No user endpoints available')) {
          setShowAlert({
            type: 'danger',
            message: 'Backend API endpoints not implemented yet. Please set up the Laravel backend with user management routes.'
          });
        } else if (result.message?.includes('fallback')) {
          setShowAlert({
            type: 'success',
            message: 'Users loaded using fallback endpoint. Admin endpoints are being developed.'
          });
        }
      } else {
        setError(result.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const result = await adminUsersApi.getUserStats();
      if (result.success) {
        setStats(result.data || stats);
        
        // Show message if stats were calculated from fallback
        if (result.message?.includes('calculated from available data')) {
          console.info('User statistics calculated from fallback data');
        }
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      // If stats API fails, calculate from current users
      calculateStatsFromUsers();
    }
  };

  // Calculate stats from current users if API fails
  const calculateStatsFromUsers = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const calculatedStats = {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      admins: users.filter(u => u.is_admin).length,
      customers: users.filter(u => !u.is_admin).length,
      newThisMonth: users.filter(u => {
        const createdDate = new Date(u.created_at);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      }).length
    };
    setStats(calculatedStats);
  };

  // Handle user status update
  const handleStatusUpdate = async (userId: number, newStatus: string) => {
    try {
      setUpdatingUserId(userId);
      
      const result = await adminUsersApi.updateUserStatus(userId, newStatus);
      
      if (result.success) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, is_active: newStatus === 'active' } : user
        ));
        setShowAlert({
          type: 'success',
          message: `User status updated to ${newStatus}`
        });
        setTimeout(() => setShowAlert(null), 3000);
      } else {
        // Check if this is a fallback error indicating admin endpoints aren't available
        if (result.message?.includes('admin endpoints pending')) {
          setShowAlert({
            type: 'danger',
            message: 'User status updates not available yet. Admin endpoints are being developed.'
          });
        } else {
          setShowAlert({
            type: 'danger',
            message: result.message || 'Failed to update user status'
          });
        }
        setTimeout(() => setShowAlert(null), 5000);
      }
    } catch (err: any) {
      setShowAlert({
        type: 'danger',
        message: err.message || 'An error occurred while updating user status'
      });
      setTimeout(() => setShowAlert(null), 5000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle user role update
  const handleRoleUpdate = async (userId: number, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      
      const result = await adminUsersApi.updateUserRole(userId, newRole);
      
      if (result.success) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, is_admin: newRole === 'admin' } : user
        ));
        setShowAlert({
          type: 'success',
          message: `User role updated to ${newRole}`
        });
        setTimeout(() => setShowAlert(null), 3000);
      } else {
        if (result.message?.includes('admin endpoints pending')) {
          setShowAlert({
            type: 'danger',
            message: 'User role updates not available yet. Admin endpoints are being developed.'
          });
        } else {
          setShowAlert({
            type: 'danger',
            message: result.message || 'Failed to update user role'
          });
        }
        setTimeout(() => setShowAlert(null), 5000);
      }
    } catch (err: any) {
      setShowAlert({
        type: 'danger',
        message: err.message || 'An error occurred while updating user role'
      });
      setTimeout(() => setShowAlert(null), 5000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // useEffect hooks
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUserStats();
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (users.length > 0) {
      calculateStatsFromUsers();
    }
  }, [users]);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'warning';
  };

  const getRoleColor = (isAdmin: boolean) => {
    return isAdmin ? 'primary' : 'secondary';
  };

  // Since API handles filtering, we can display users directly
  // But keep client-side filtering as fallback if API doesn't support it
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && user.is_admin) ||
      (roleFilter === 'customer' && !user.is_admin);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: Math.max(...users.map(u => u.id)) + 1,
      name: newUser.name,
      email: newUser.email,
      phone: undefined,
      date_of_birth: undefined,
      gender: undefined,
      is_admin: newUser.role === 'admin',
      is_active: newUser.status === 'active',
      email_verified_at: undefined,
      last_login_at: undefined,
      preferences: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'customer', status: 'active' });
    setShowCreateModal(false);
    setShowAlert({
      type: 'success',
      message: 'User created successfully'
    });
    setTimeout(() => setShowAlert(null), 3000);
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
    setShowAlert({
      type: 'success',
      message: 'User deleted successfully'
    });
    setTimeout(() => setShowAlert(null), 3000);
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Users Management</h2>
          <p className="text-muted mb-0">Manage user accounts, roles, and permissions</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-lg me-2"></i>
          Add User
        </Button>
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

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-people text-primary"></i>
              </div>
              <h4 className="fw-bold">{stats.total}</h4>
              <p className="text-muted small mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-check-circle text-success"></i>
              </div>
              <h4 className="fw-bold">{stats.active}</h4>
              <p className="text-muted small mb-0">Active</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-pause-circle text-warning"></i>
              </div>
              <h4 className="fw-bold">{stats.inactive}</h4>
              <p className="text-muted small mb-0">Inactive</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-person-plus text-info"></i>
              </div>
              <h4 className="fw-bold">{stats.newThisMonth}</h4>
              <p className="text-muted small mb-0">New This Month</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-shield text-info"></i>
              </div>
              <h4 className="fw-bold">{stats.admins}</h4>
              <p className="text-muted small mb-0">Admins</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-person text-secondary"></i>
              </div>
              <h4 className="fw-bold">{stats.customers}</h4>
              <p className="text-muted small mb-0">Customers</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2} className="text-end">
          <p className="text-muted mb-0">
            Showing {filteredUsers.length} of {users.length}
          </p>
        </Col>
      </Row>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Last Login</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <div className="mt-2">Loading users...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="text-danger">
                      <i className="bi bi-exclamation-triangle display-4 d-block mb-2"></i>
                      {error}
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div className="fw-semibold">{user.name}</div>
                        <small className="text-muted">{user.email}</small>
                      </div>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={user.is_admin ? 'admin' : 'customer'}
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                        className={`border-0 bg-${getRoleColor(user.is_admin)} text-white fw-bold`}
                        disabled={updatingUserId === user.id}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={user.is_active ? 'active' : 'inactive'}
                        onChange={(e) => handleStatusUpdate(user.id, e.target.value)}
                        className={`border-0 bg-${getStatusColor(user.is_active)} text-white fw-bold`}
                        disabled={updatingUserId === user.id}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</td>
                    <td>N/A</td>
                    <td className="fw-bold">N/A</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-inbox display-4 d-block mb-2"></i>
                      No users found matching your criteria
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* User Details Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>User Details - {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="fw-bold">Personal Information</h6>
                  <p className="mb-1"><strong>Name:</strong> {selectedUser.name}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedUser.email}</p>
                  <p className="mb-1"><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</p>
                  <p className="mb-1">
                    <strong>Role:</strong>{' '}
                    <Badge bg={getRoleColor(selectedUser.is_admin)}>
                      {selectedUser.is_admin ? 'Admin' : 'Customer'}
                    </Badge>
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusColor(selectedUser.is_active)}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                  <p className="mb-1">
                    <strong>Email Verified:</strong> {selectedUser.email_verified_at ? 'Yes' : 'No'}
                  </p>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold">Account Information</h6>
                  <p className="mb-1"><strong>Registered:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Last Updated:</strong> {new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Last Login:</strong> {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleDateString() : 'Never'}</p>
                  <p className="mb-1"><strong>Date of Birth:</strong> {selectedUser.date_of_birth || 'Not provided'}</p>
                  <p className="mb-1"><strong>Gender:</strong> {selectedUser.gender || 'Not provided'}</p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
          </Button>
          <Button variant="primary">
            <i className="bi bi-envelope me-2"></i>
            Send Email
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateUser}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'customer'})}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={newUser.status}
                onChange={(e) => setNewUser({...newUser, status: e.target.value as 'active' | 'inactive' | 'banned'})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateUser}>
            <i className="bi bi-plus-lg me-2"></i>
            Create User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers;