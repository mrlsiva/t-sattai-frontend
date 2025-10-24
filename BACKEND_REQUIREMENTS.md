# Complete Backend API Documentation

## Overview

Your Laravel backend now provides a complete set of API endpoints that match your frontend requirements exactly. All fallback logic can be removed as these endpoints provide real data.

## Authentication

Most endpoints require authentication:

- Header: `Authorization: Bearer {token}`
- Admin endpoints also require admin privileges

## Available Endpoints

### 🔐 Authentication

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/profile
```

### 📦 Orders Management

#### User Orders

```
GET /api/orders
GET /api/orders/{orderNumber}
```

#### Admin Orders

```
GET /api/admin/orders              # All orders with filtering
GET /api/admin/orders/stats        # Order statistics
GET /api/admin/orders/{orderNumber} # Specific order details
PUT /api/admin/orders/{orderNumber}/status # Update order status
```

**Order Statistics Response:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 12,
    "confirmed": 5,
    "processing": 18,
    "shipped": 25,
    "delivered": 85,
    "cancelled": 5,
    "totalValue": 45299.99
  }
}
```

### 👥 User Management

#### Fallback Endpoint

```
GET /api/users                     # Fallback endpoint (requires admin)
```

#### Admin User Management

```
GET    /api/admin/users            # List users with filtering
GET    /api/admin/users/stats      # User statistics
GET    /api/admin/users/{id}       # Specific user details
PUT    /api/admin/users/{id}/status # Update user status
PUT    /api/admin/users/{id}/role  # Update user role
DELETE /api/admin/users/{id}       # Delete/deactivate user
```

**User Statistics Response:**

```json
{
  "success": true,
  "data": {
    "total": 342,
    "active": 321,
    "inactive": 21,
    "admins": 5,
    "customers": 337,
    "newThisMonth": 28,
    "usersWithOrders": 156,
    "avgOrdersPerUser": 2.34,
    "topSpenders": [...]
  }
}
```

### 📊 Admin Dashboard

#### Dashboard Statistics

```
GET /api/admin/dashboard/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalProducts": 89,
    "totalOrders": 342,
    "totalUsers": 156,
    "totalRevenue": 45299.99,
    "todayOrders": 12,
    "todayRevenue": 1299.99,
    "recentOrdersCount": 45,
    "activeUsersCount": 321,
    "productStats": {
      "total": 89,
      "inStock": 76,
      "outOfStock": 8,
      "lowStock": 13
    }
  }
}
```

#### Recent Orders

```
GET /api/admin/dashboard/recent-orders?limit=10
```

#### Product Statistics

```
GET /api/admin/dashboard/product-stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 89,
    "inStock": 76,
    "outOfStock": 8,
    "lowStock": 13,
    "topProducts": [
      {
        "product_id": 15,
        "product_name": "Wireless Headphones",
        "total_sold": 45,
        "total_revenue": 2299.55
      }
    ]
  }
}
```

### 💳 Payments (Stripe Integration)

```
POST /api/payments/create-intent    # Create Stripe PaymentIntent
POST /api/payments/confirm          # Confirm payment and create order
GET  /api/payments/methods          # Get payment methods
POST /webhooks/stripe               # Stripe webhook (public)
```

### 🛒 Cart Management

```
GET    /api/cart                   # Get cart items
POST   /api/cart                   # Add item to cart
PUT    /api/cart/{id}              # Update cart item
DELETE /api/cart/{id}              # Remove cart item
DELETE /api/cart                   # Clear cart
```

### 🛍️ Products & Categories

```
GET /api/products                  # List products (public)
GET /api/products/featured         # Featured products (public)
GET /api/products/{id}             # Product details (public)
GET /api/categories                # List categories (public)
GET /api/categories/{id}           # Category details (public)
```

## Query Parameters

### Pagination

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 15, max: 100)

### Filtering

- `search`: Search by name, email, order number, etc.
- `status`: Filter by status (active/inactive, pending/completed, etc.)
- `role`: Filter by role (admin/customer)

### Examples

```
GET /api/admin/users?search=john&status=active&page=2&limit=20
GET /api/admin/orders?status=pending&search=ORD-123
GET /api/orders?status=delivered&limit=10
```

## Response Format

All endpoints follow a consistent response format:

### Success Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 150,
    "last_page": 10
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

## Security Features

1. **Authentication**: Sanctum token-based authentication
2. **Authorization**: Admin middleware for protected routes
3. **Validation**: Input validation on all endpoints
4. **Audit Logging**: All admin actions are logged
5. **Token Management**: Automatic token revocation on user deactivation
6. **Self-Protection**: Admins cannot delete/deactivate themselves

## Database Schema

### Required Columns Added

- `orders.payment_reference` - Stores Stripe PaymentIntent IDs
- `order_items.product_name` - Product name at time of order
- `order_items.product_sku` - Product SKU at time of order
- `order_items.product_image` - Product image at time of order

## Testing

Run the comprehensive test:

```bash
php test-complete-api.php
```

## Frontend Integration

Your frontend will now:

1. ✅ **Use real data** instead of fallback logic
2. ✅ **Display accurate statistics** in all dashboards
3. ✅ **Enable full CRUD operations** for orders and users
4. ✅ **Handle pagination and filtering** efficiently
5. ✅ **Process real payments** through Stripe
6. ✅ **Manage user roles and permissions** properly

## Production Ready

The backend is now production-ready with:

- Complete API coverage
- Proper error handling
- Security middleware
- Input validation
- Audit logging
- Database consistency
- Performance optimization

Your e-commerce platform is fully functional! 🚀
