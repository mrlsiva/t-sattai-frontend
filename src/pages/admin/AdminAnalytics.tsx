import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import api from '../../utils/api';

interface Summary {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  avg_order_value: number;
  revenue_growth: number;
  orders_growth: number;
  customers_growth: number;
  avg_order_growth: number;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface TopProduct {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  percentage: number;
}

interface Activity {
  type: 'order' | 'customer' | 'review' | 'shipment';
  title: string;
  description: string;
  time: string;
}

interface OrderStatus {
  status: string;
  count: number;
  percentage: number;
}

const PERIOD_LABELS: Record<string, string> = {
  '7days':  'Last 7 days',
  '30days': 'Last 30 days',
  '90days': 'Last 90 days',
  '1year':  'Last year',
};

const GrowthBadge: React.FC<{ value: number | undefined }> = ({ value }) => {
  if (value === undefined || value === null) return null;
  return (
    <Badge bg={value >= 0 ? 'success' : 'danger'} className="small">
      {value >= 0 ? '+' : ''}{value}%
    </Badge>
  );
};

const activityIcon: Record<string, { icon: string; bg: string; color: string }> = {
  order:    { icon: 'bi-bag-check',   bg: 'bg-success', color: 'text-success' },
  customer: { icon: 'bi-person-plus', bg: 'bg-primary', color: 'text-primary' },
  review:   { icon: 'bi-star',        bg: 'bg-warning', color: 'text-warning' },
  shipment: { icon: 'bi-truck',       bg: 'bg-info',    color: 'text-info'    },
};

const statusColor: Record<string, string> = {
  delivered:  'success',
  processing: 'warning',
  shipped:    'info',
  pending:    'secondary',
  cancelled:  'danger',
};

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatRevenue(value: number): string {
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value}`;
}

const AdminAnalytics: React.FC = () => {
  const [period, setPeriod]         = useState('30days');
  const [chartType, setChartType]   = useState('revenue');
  const [loading, setLoading]       = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [summary, setSummary]             = useState<Summary | null>(null);
  const [chartData, setChartData]         = useState<ChartPoint[]>([]);
  const [topProducts, setTopProducts]     = useState<TopProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [orderStatus, setOrderStatus]     = useState<OrderStatus[]>([]);

  // Track whether this is the first render to avoid double chart fetch
  const firstRender = useRef(true);

  // Full refresh — called when period changes
  const fetchAll = useCallback(async (p: string, type: string) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, chartRes, productsRes, activityRes, statusRes] = await Promise.all([
        api.get(`/admin/analytics/summary?period=${p}`),
        api.get(`/admin/analytics/chart?period=${p}&type=${type}`),
        api.get(`/admin/analytics/top-products?period=${p}&limit=5`),
        api.get(`/admin/analytics/recent-activity?limit=8`),
        api.get(`/admin/analytics/order-status?period=${p}`),
      ]);

      if (summaryRes.data?.success)  setSummary(summaryRes.data.data);
      if (chartRes.data?.success)    setChartData(chartRes.data.data ?? []);
      if (productsRes.data?.success) setTopProducts(productsRes.data.data ?? []);
      if (activityRes.data?.success) setRecentActivity(activityRes.data.data ?? []);
      if (statusRes.data?.success)   setOrderStatus(statusRes.data.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chart-only refresh — called when chartType changes
  const fetchChartOnly = useCallback(async (p: string, type: string) => {
    setChartLoading(true);
    try {
      const res = await api.get(`/admin/analytics/chart?period=${p}&type=${type}`);
      if (res.data?.success) setChartData(res.data.data ?? []);
    } catch {}
    finally { setChartLoading(false); }
  }, []);

  // Period change → full refresh (keeps current chartType)
  useEffect(() => {
    fetchAll(period, chartType);
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chart type change → chart only (skip on first render to avoid double fetch)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    fetchChartOnly(period, chartType);
  }, [chartType]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderChart = () => {
    if (!chartData.length) {
      return <p className="text-muted text-center py-4">No data available for this period</p>;
    }

    const max = Math.max(...chartData.map(d => d.value), 1);
    const count = chartData.length;
    // Adaptive bar width and label skipping
    const barWidth = count <= 7 ? 40 : count <= 14 ? 28 : count <= 31 ? 20 : 14;
    const showEvery = count <= 7 ? 1 : count <= 14 ? 2 : count <= 31 ? 5 : 4;

    return (
      <div style={{ overflowX: 'auto' }}>
        <div
          className="d-flex align-items-end"
          style={{ minWidth: count * (barWidth + 8), height: '220px', gap: '4px', padding: '0 4px' }}
        >
          {chartData.map((d, i) => {
            const h = Math.max((d.value / max) * 180, d.value > 0 ? 4 : 0);
            const showLabel = i % showEvery === 0 || i === count - 1;
            return (
              <div key={i} className="d-flex flex-column align-items-center flex-shrink-0" style={{ width: barWidth }}>
                {d.value > 0 && (
                  <small className="text-muted mb-1" style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>
                    {chartType === 'revenue' ? formatRevenue(d.value) : d.value}
                  </small>
                )}
                <div
                  className="rounded-top w-100"
                  style={{ height: `${h}px`, background: '#8B4513', opacity: 0.85, minHeight: d.value > 0 ? 4 : 0 }}
                  title={`${d.label}: ${chartType === 'revenue' ? `₹${d.value.toLocaleString()}` : d.value}`}
                />
                <small
                  className="text-muted mt-1"
                  style={{ fontSize: '9px', whiteSpace: 'nowrap', visibility: showLabel ? 'visible' : 'hidden' }}
                >
                  {d.label}
                </small>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Analytics Dashboard</h2>
          <p className="text-muted mb-0">Monitor your business performance and key metrics</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            {Object.entries(PERIOD_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Form.Select>
          <Button variant="outline-primary" onClick={() => fetchAll(period, chartType)}>
            <i className="bi bi-arrow-clockwise me-2"></i>Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4 g-3">
        {[
          {
            label: 'Total Revenue',    icon: 'bi-cash',     bg: 'bg-primary',
            value: summary ? `₹${Number(summary.total_revenue).toLocaleString()}` : '—',
            growth: summary?.revenue_growth,
          },
          {
            label: 'Total Orders',     icon: 'bi-bag',      bg: 'bg-info',
            value: summary ? summary.total_orders.toLocaleString() : '—',
            growth: summary?.orders_growth,
          },
          {
            label: 'Total Customers',  icon: 'bi-people',   bg: 'bg-success',
            value: summary ? summary.total_customers.toLocaleString() : '—',
            growth: summary?.customers_growth,
          },
          {
            label: 'Avg. Order Value', icon: 'bi-graph-up', bg: 'bg-warning',
            value: summary ? `₹${Number(summary.avg_order_value).toFixed(0)}` : '—',
            growth: summary?.avg_order_growth,
          },
        ].map((card, i) => (
          <Col key={i} lg={3} md={6} sm={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className={`${card.bg} bg-opacity-10 rounded-circle p-3 me-3 flex-shrink-0`}>
                    <i className={`bi ${card.icon} ${card.bg.replace('bg-', 'text-')} fs-5`}></i>
                  </div>
                  <div>
                    <h4 className="fw-bold mb-0">{card.value}</h4>
                    <p className="text-muted mb-1 small">{card.label}</p>
                    <GrowthBadge value={card.growth} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        {/* Chart + Activity */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Performance Overview</h5>
              <div className="d-flex gap-2">
                {(['revenue', 'orders', 'customers'] as const).map(t => (
                  <Button
                    key={t}
                    variant={chartType === t ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setChartType(t)}
                    disabled={chartLoading}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </Card.Header>
            <Card.Body>
              <h6 className="text-muted mb-3">
                {chartType === 'revenue'   && 'Revenue Trends'}
                {chartType === 'orders'    && 'Order Volume'}
                {chartType === 'customers' && 'Customer Acquisition'}
                {' '}
                <small className="text-muted fw-normal">· {PERIOD_LABELS[period]}</small>
              </h6>
              {chartLoading ? (
                <div className="d-flex justify-content-center py-4">
                  <Spinner animation="border" size="sm" variant="primary" />
                </div>
              ) : renderChart()}
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {recentActivity.length === 0 ? (
                <p className="text-muted text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((item, i) => {
                  const icon = activityIcon[item.type] ?? activityIcon.order;
                  return (
                    <div
                      key={i}
                      className={`d-flex align-items-center px-3 py-2 ${i < recentActivity.length - 1 ? 'border-bottom' : ''}`}
                    >
                      <div className={`${icon.bg} bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0`}>
                        <i className={`bi ${icon.icon} ${icon.color}`}></i>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold small text-truncate">{item.title}</div>
                        <small className="text-muted text-truncate d-block">{item.description}</small>
                      </div>
                      <small className="text-muted flex-shrink-0 ms-3">{timeAgo(item.time)}</small>
                    </div>
                  );
                })
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Top Products + Order Status */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Top Selling Products</h5>
            </Card.Header>
            <Card.Body>
              {topProducts.length === 0 ? (
                <p className="text-muted text-center py-2">No sales data yet</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={p.id} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold small text-truncate me-2" style={{ maxWidth: '60%' }}>
                        {i + 1}. {p.name}
                      </span>
                      <Badge bg="primary" className="flex-shrink-0">{p.sales} sold</Badge>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">₹{Number(p.revenue).toLocaleString()}</small>
                      <small className="text-success fw-semibold">{p.percentage}%</small>
                    </div>
                    <ProgressBar now={p.percentage} variant="primary" style={{ height: '5px' }} />
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">Order Status</h5>
            </Card.Header>
            <Card.Body>
              {orderStatus.length === 0 ? (
                <p className="text-muted text-center py-2">No order data yet</p>
              ) : (
                orderStatus.map((s, i) => (
                  <div key={i} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-capitalize small">{s.status}</span>
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted">{s.count.toLocaleString()}</small>
                        <span className={`fw-bold small text-${statusColor[s.status] ?? 'secondary'}`}>
                          {s.percentage}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      now={s.percentage}
                      variant={statusColor[s.status] ?? 'secondary'}
                      style={{ height: '5px' }}
                    />
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminAnalytics;
