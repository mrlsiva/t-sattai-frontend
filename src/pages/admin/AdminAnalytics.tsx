import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, ProgressBar } from 'react-bootstrap';

interface SalesData {
  period: string;
  sales: number;
  orders: number;
  customers: number;
}

interface ProductSalesData {
  name: string;
  sales: number;
  revenue: number;
  percentage: number;
}

const AdminAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [chartType, setChartType] = useState('sales');

  // Mock data for analytics
  const salesData: SalesData[] = [
    { period: 'Jan 2024', sales: 15420, orders: 145, customers: 89 },
    { period: 'Feb 2024', sales: 18350, orders: 167, customers: 102 },
    { period: 'Mar 2024', sales: 22100, orders: 198, customers: 124 },
    { period: 'Apr 2024', sales: 19800, orders: 178, customers: 115 },
    { period: 'May 2024', sales: 25600, orders: 231, customers: 145 },
    { period: 'Jun 2024', sales: 28900, orders: 267, customers: 162 }
  ];

  const topProducts: ProductSalesData[] = [
    { name: 'Wireless Headphones', sales: 156, revenue: 15600, percentage: 85 },
    { name: 'Smartphone Case', sales: 234, revenue: 7020, percentage: 78 },
    { name: 'Bluetooth Speaker', sales: 89, revenue: 17800, percentage: 65 },
    { name: 'USB Cable', sales: 345, revenue: 8625, percentage: 92 },
    { name: 'Screen Protector', sales: 267, revenue: 5340, percentage: 70 }
  ];

  const getOverallStats = () => {
    const totalSales = salesData.reduce((sum, data) => sum + data.sales, 0);
    const totalOrders = salesData.reduce((sum, data) => sum + data.orders, 0);
    const totalCustomers = salesData.reduce((sum, data) => sum + data.customers, 0);
    const avgOrderValue = totalSales / totalOrders;
    
    return {
      totalSales,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      growthRate: 15.2, // Mock growth rate
      conversionRate: 3.4 // Mock conversion rate
    };
  };

  const stats = getOverallStats();

  const renderMockChart = (type: string) => {
    return (
      <div className="d-flex align-items-end justify-content-center" style={{ height: '200px' }}>
        {salesData.map((data, index) => {
          let value;
          let maxValue;
          switch (type) {
            case 'orders':
              value = data.orders;
              maxValue = Math.max(...salesData.map(d => d.orders));
              break;
            case 'customers':
              value = data.customers;
              maxValue = Math.max(...salesData.map(d => d.customers));
              break;
            default:
              value = data.sales;
              maxValue = Math.max(...salesData.map(d => d.sales));
          }
          
          const height = (value / maxValue) * 180;
          
          return (
            <div key={index} className="d-flex flex-column align-items-center mx-2">
              <div
                className="bg-primary rounded-top"
                style={{
                  width: '40px',
                  height: `${height}px`,
                  minHeight: '10px',
                  opacity: 0.8
                }}
                title={`${data.period}: ${value.toLocaleString()}`}
              ></div>
              <small className="text-muted mt-1" style={{ fontSize: '10px' }}>
                {data.period.split(' ')[0]}
              </small>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Analytics Dashboard</h2>
          <p className="text-muted mb-0">Monitor your business performance and key metrics</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </Form.Select>
          <Button variant="outline-primary">
            <i className="bi bi-download me-2"></i>
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-cash text-primary fs-5"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0">₹{stats.totalSales.toLocaleString()}</h4>
                  <p className="text-muted mb-0 small">Total Revenue</p>
                  <Badge bg="success" className="small">+{stats.growthRate}%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-bag text-info fs-5"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0">{stats.totalOrders.toLocaleString()}</h4>
                  <p className="text-muted mb-0 small">Total Orders</p>
                  <Badge bg="success" className="small">+12.5%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-people text-success fs-5"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0">{stats.totalCustomers.toLocaleString()}</h4>
                  <p className="text-muted mb-0 small">Total Customers</p>
                  <Badge bg="success" className="small">+8.3%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-graph-up text-warning fs-5"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0">${stats.avgOrderValue.toFixed(0)}</h4>
                  <p className="text-muted mb-0 small">Avg. Order Value</p>
                  <Badge bg="success" className="small">+5.7%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-target text-danger fs-5"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0">{stats.conversionRate}%</h4>
                  <p className="text-muted mb-0 small">Conversion Rate</p>
                  <Badge bg="success" className="small">+2.1%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-secondary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-clock text-secondary fs-5"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0">2.3m</h4>
                  <p className="text-muted mb-0 small">Avg. Session</p>
                  <Badge bg="danger" className="small">-1.2%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Main Chart */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Performance Overview</h5>
              <div className="d-flex gap-2">
                <Button
                  variant={chartType === 'sales' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setChartType('sales')}
                >
                  Revenue
                </Button>
                <Button
                  variant={chartType === 'orders' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setChartType('orders')}
                >
                  Orders
                </Button>
                <Button
                  variant={chartType === 'customers' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setChartType('customers')}
                >
                  Customers
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6 className="text-muted">
                  {chartType === 'sales' && 'Revenue Trends'}
                  {chartType === 'orders' && 'Order Volume'}
                  {chartType === 'customers' && 'Customer Acquisition'}
                </h6>
              </div>
              {renderMockChart(chartType)}
              <div className="text-center mt-3">
                <small className="text-muted">
                  Data shown for the last 6 months • 
                  <span className="text-primary"> Interactive charts coming soon</span>
                </small>
              </div>
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center py-2 border-bottom">
                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-bag-check text-success"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">New order received</div>
                  <small className="text-muted">Order #ORD-2024-156 - $299.99</small>
                </div>
                <small className="text-muted">2 min ago</small>
              </div>
              <div className="d-flex align-items-center py-2 border-bottom">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-person-plus text-primary"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">New customer registered</div>
                  <small className="text-muted">john.doe@example.com</small>
                </div>
                <small className="text-muted">15 min ago</small>
              </div>
              <div className="d-flex align-items-center py-2 border-bottom">
                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-star text-warning"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">Product review received</div>
                  <small className="text-muted">5-star review for Wireless Headphones</small>
                </div>
                <small className="text-muted">1 hour ago</small>
              </div>
              <div className="d-flex align-items-center py-2">
                <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-truck text-info"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">Order shipped</div>
                  <small className="text-muted">Order #ORD-2024-154 shipped to customer</small>
                </div>
                <small className="text-muted">2 hours ago</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Top Products & Sales Goals */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Top Selling Products</h5>
            </Card.Header>
            <Card.Body>
              {topProducts.map((product, index) => (
                <div key={index} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold">{product.name}</span>
                    <Badge bg="primary">{product.sales} sold</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">${product.revenue.toLocaleString()} revenue</small>
                    <small className="text-success">{product.percentage}%</small>
                  </div>
                  <ProgressBar 
                    now={product.percentage} 
                    variant="primary" 
                    className="mb-2"
                    style={{ height: '6px' }}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Monthly Goals</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Revenue Target</span>
                  <span className="text-success fw-bold">78%</span>
                </div>
                <ProgressBar now={78} variant="success" className="mb-1" />
                <small className="text-muted">$23,400 of $30,000 target</small>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Orders Target</span>
                  <span className="text-warning fw-bold">65%</span>
                </div>
                <ProgressBar now={65} variant="warning" className="mb-1" />
                <small className="text-muted">195 of 300 orders</small>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">New Customers</span>
                  <span className="text-info fw-bold">92%</span>
                </div>
                <ProgressBar now={92} variant="info" className="mb-1" />
                <small className="text-muted">138 of 150 new customers</small>
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Customer Satisfaction</span>
                  <span className="text-success fw-bold">96%</span>
                </div>
                <ProgressBar now={96} variant="success" className="mb-1" />
                <small className="text-muted">4.8/5.0 average rating</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminAnalytics;