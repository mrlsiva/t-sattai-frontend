# Address Management API Requirements

## Overview

This document outlines the API endpoints required for managing user addresses in the e-commerce application.

## API Endpoints

### 1. Get User Addresses

**Endpoint:** `GET /api/user/addresses`
**Purpose:** Retrieve all saved addresses for the authenticated user
**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "addr_123",
      "name": "John Doe",
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "country": "US",
      "zipCode": "10001",
      "isDefault": true,
      "type": "home",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Addresses retrieved successfully"
}
```

### 2. Add New Address

**Endpoint:** `POST /api/user/addresses`
**Purpose:** Add a new address for the authenticated user
**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "name": "John Doe",
  "street": "456 Oak Avenue",
  "city": "Los Angeles",
  "state": "CA",
  "country": "US",
  "zipCode": "90210",
  "isDefault": false,
  "type": "work"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "addr_124",
    "name": "John Doe",
    "street": "456 Oak Avenue",
    "city": "Los Angeles",
    "state": "CA",
    "country": "US",
    "zipCode": "90210",
    "isDefault": false,
    "type": "work",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Address added successfully"
}
```

### 3. Update Address

**Endpoint:** `PUT /api/user/addresses/{addressId}`
**Purpose:** Update an existing address
**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "name": "John Doe Jr.",
  "street": "456 Oak Avenue Apt 2B",
  "city": "Los Angeles",
  "state": "CA",
  "country": "US",
  "zipCode": "90210",
  "isDefault": true,
  "type": "home"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "addr_124",
    "name": "John Doe Jr.",
    "street": "456 Oak Avenue Apt 2B",
    "city": "Los Angeles",
    "state": "CA",
    "country": "US",
    "zipCode": "90210",
    "isDefault": true,
    "type": "home",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Address updated successfully"
}
```

### 4. Delete Address

**Endpoint:** `DELETE /api/user/addresses/{addressId}`
**Purpose:** Delete an address
**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

### 5. Set Default Address

**Endpoint:** `PUT /api/user/addresses/{addressId}/default`
**Purpose:** Set an address as the default
**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "addr_124",
    "isDefault": true,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Default address updated successfully"
}
```

## Database Schema

### addresses Table

```sql
CREATE TABLE addresses (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    street VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'US',
    zip_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    type ENUM('home', 'work', 'other') DEFAULT 'home',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
);
```

## Business Rules

1. **Default Address Logic:**

   - Only one address can be marked as default per user
   - When setting a new default address, the previous default should be unset
   - If a user has no addresses and adds their first address, it should automatically be set as default

2. **Validation Rules:**

   - Name: Required, max 255 characters
   - Street: Required, max 500 characters
   - City: Required, max 100 characters
   - State: Required, max 100 characters
   - Country: Required, max 100 characters, default 'US'
   - ZIP Code: Required, max 20 characters
   - Type: Optional, enum('home', 'work', 'other'), default 'home'

3. **Security:**
   - Users can only access/modify their own addresses
   - All endpoints require authentication
   - Validate address ownership before any operations

## Integration with Checkout

The checkout process should:

1. Load user's saved addresses
2. Pre-select the default address if available
3. Allow users to select from saved addresses or enter a new one
4. Optionally save new addresses during checkout

## Fallback Behavior

If address endpoints are not available:

1. Try to populate address fields from user profile data
2. Allow manual address entry during checkout
3. Show appropriate messages about address management not being available

## Example PHP Implementation (Laravel)

```php
// AddressController.php
class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()->orderBy('is_default', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $addresses,
            'message' => 'Addresses retrieved successfully'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'street' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'zipCode' => 'required|string|max:20',
            'isDefault' => 'boolean',
            'type' => 'in:home,work,other'
        ]);

        // If this is the first address or explicitly set as default
        if ($validated['isDefault'] ?? false || $request->user()->addresses()->count() === 0) {
            // Unset other default addresses
            $request->user()->addresses()->update(['is_default' => false]);
            $validated['is_default'] = true;
        }

        $address = $request->user()->addresses()->create($validated);

        return response()->json([
            'success' => true,
            'data' => $address,
            'message' => 'Address added successfully'
        ]);
    }
}
```
