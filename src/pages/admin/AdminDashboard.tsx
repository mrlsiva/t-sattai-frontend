import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { adminDashboardApi } from '../../services/api';
import { Order } from '../../types';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  recentOrdersCount: number;
  activeUsersCount: number;
}

interface ProductStats {
  total: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<{type: 'success' | 'danger' | 'warning', message: string} | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all dashboard data in parallel
      const [statsResult, productStatsResult, recentOrdersResult] = await Promise.allSettled([
        adminDashboardApi.getDashboardStats(),
        adminDashboardApi.getProductStats(),
        adminDashboardApi.getRecentOrders(5)
      ]);

      // Handle stats result
      if (statsResult.status === 'fulfilled' && statsResult.value.success && statsResult.value.data) {
        setStats(statsResult.value.data);
        
        // Show fallback message if using aggregated data
        if (statsResult.value.message?.includes('aggregated from available endpoints')) {
          setShowAlert({
            type: 'warning',
            message: 'Dashboard data loaded from individual endpoints. Full dashboard API pending implementation.'
          });
        } else if (statsResult.value.message?.includes('backend endpoints pending')) {
          setShowAlert({
            type: 'danger',
            message: 'Backend API endpoints not implemented yet. Dashboard showing placeholder data.'
          });
        }
      }

      // Handle product stats result
      if (productStatsResult.status === 'fulfilled' && productStatsResult.value.success && productStatsResult.value.data) {
        setProductStats(productStatsResult.value.data);
      }

      // Handle recent orders result
      if (recentOrdersResult.status === 'fulfilled' && recentOrdersResult.value.success) {
        setRecentOrders(recentOrdersResult.value.data || []);
      }

      // Clear alert after 5 seconds
      if (showAlert) {
        setTimeout(() => setShowAlert(null), 5000);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // useCallback dependency array

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'success';
      case 'processing':
      case 'shipped':
        return 'warning';
      case 'pending':
      case 'confirmed':
        return 'secondary';
      case 'cancelled':
        return 'danger';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading dashboard data...</span>
        </Spinner>
        <div className="mt-2">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Dashboard</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Dashboard</h1>
        <small className="text-muted">Welcome back, Admin!</small>
      </div>

      {/* Alert Messages */}
      {showAlert && (
        <Alert variant={showAlert.type} className="mb-4" dismissible onClose={() => setShowAlert(null)}>
          {showAlert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-primary bg-opacity-10 rounded">
                    <i className="bi bi-box text-primary fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold fs-4">{stats?.totalProducts ?? 0}</div>
                  <div className="text-muted small">Total Products</div>
                  {productStats && (
                    <div className="text-success small">
                      <i className="bi bi-check-circle me-1"></i>
                      {productStats.inStock} in stock
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-success bg-opacity-10 rounded">
                    <i className="bi bi-cart-check text-success fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold fs-4">{stats?.totalOrders ?? 0}</div>
                  <div className="text-muted small">Total Orders</div>
                  {stats && (
                    <div className="text-info small">
                      <i className="bi bi-clock me-1"></i>
                      {stats.todayOrders} today
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-info bg-opacity-10 rounded">
                    <i className="bi bi-people text-info fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold fs-4">{stats?.totalUsers ?? 0}</div>
                  <div className="text-muted small">Total Users</div>
                  {stats && (
                    <div className="text-success small">
                      <i className="bi bi-person-check me-1"></i>
                      {stats.activeUsersCount} active
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-warning bg-opacity-10 rounded">
                    <i className="bi bi-cash text-warning fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold fs-4">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</div>
                  <div className="text-muted small">Total Revenue</div>
                  {stats && (
                    <div className="text-warning small">
                      <i className="bi bi-calendar-day me-1"></i>
                      ₹{stats.todayRevenue.toLocaleString()} today
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Today's Stats */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Today's Performance</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-primary">{stats?.todayOrders}</div>
                    <div className="text-muted small">Orders Today</div>
                  </div>
                </Col>
                <Col>
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-success">${stats?.todayRevenue}</div>
                    <div className="text-muted small">Revenue Today</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Product
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Export Reports
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Product Statistics */}
      {productStats && (
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="h-100 border-0 shadow-sm bg-success bg-opacity-10">
              <Card.Body className="text-center">
                <i className="bi bi-check-circle text-success fs-3 mb-2"></i>
                <div className="fw-bold fs-4 text-success">{productStats.inStock}</div>
                <div className="text-muted small">In Stock</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="h-100 border-0 shadow-sm bg-danger bg-opacity-10">
              <Card.Body className="text-center">
                <i className="bi bi-x-circle text-danger fs-3 mb-2"></i>
                <div className="fw-bold fs-4 text-danger">{productStats.outOfStock}</div>
                <div className="text-muted small">Out of Stock</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="h-100 border-0 shadow-sm bg-warning bg-opacity-10">
              <Card.Body className="text-center">
                <i className="bi bi-exclamation-triangle text-warning fs-3 mb-2"></i>
                <div className="fw-bold fs-4 text-warning">{productStats.lowStock}</div>
                <div className="text-muted small">Low Stock</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="h-100 border-0 shadow-sm bg-info bg-opacity-10">
              <Card.Body className="text-center">
                <i className="bi bi-box-seam text-info fs-3 mb-2"></i>
                <div className="fw-bold fs-4 text-info">{productStats.total}</div>
                <div className="text-muted small">Total Products</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Recent Orders */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Recent Orders</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td>${order.total?.toFixed(2) || '0.00'}</td>
                        <td>
                          <Badge bg={getStatusVariant(order.orderStatus)}>
                            {order.orderStatus}
                          </Badge>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <div className="text-muted">
                          <i className="bi bi-inbox display-6 d-block mb-2"></i>
                          No recent orders available
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;