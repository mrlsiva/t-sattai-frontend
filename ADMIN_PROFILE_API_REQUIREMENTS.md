# Admin Profile API Documentation

## Overview

This document outlines the required API endpoints for the admin profile functionality. All endpoints require Bearer token authentication.

## Authentication

All requests must include:

```
Authorization: Bearer {your-auth-token}
```

---

## 1. Get Admin Profile

**Endpoint:** `GET /api/admin/profile`

**Description:** Retrieve the current admin's profile data including statistics and preferences.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin Name",
    "email": "admin@example.com",
    "phone": "+1234567890",
    "bio": "Admin bio text",
    "avatar": "https://yoursite.com/storage/avatars/filename.jpg",
    "role": "Administrator",
    "permissions": ["all"],
    "last_login": "2024-01-25T14:30:00Z",
    "created_at": "2023-12-01T09:15:00Z",
    "updated_at": "2024-01-25T14:30:00Z",
    "stats": {
      "orders_managed": 150,
      "users_supervised": 89,
      "products_added": 25,
      "login_sessions": 342
    },
    "notifications": {
      "email_notifications": true,
      "order_notifications": true,
      "user_notifications": true,
      "system_notifications": false,
      "marketing_emails": false
    }
  },
  "message": "Profile retrieved successfully"
}
```

---

## 2. Update Admin Profile

**Endpoint:** `PUT /api/admin/profile`

**Description:** Update admin's personal information.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "phone": "+1234567890",
  "bio": "Updated bio text"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Name",
    "email": "new@example.com",
    "phone": "+1234567890",
    "bio": "Updated bio text",
    "updated_at": "2024-01-25T15:30:00Z"
  },
  "message": "Profile updated successfully"
}
```

**Validation Rules:**

- `name`: required, string, max 255 characters
- `email`: required, valid email, unique
- `phone`: optional, string, max 20 characters
- `bio`: optional, string, max 1000 characters

---

## 3. Upload Avatar ⭐ (PRIORITY)

**Endpoint:** `POST /api/admin/profile/avatar`

**Description:** Upload a new profile avatar image.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:** (Form Data)

- `avatar`: File (image file)

**Accepted File Types:** JPEG, JPG, PNG, GIF, WebP
**Max File Size:** 5MB

**Response Example:**

```json
{
  "success": true,
  "data": {
    "avatar_url": "https://yoursite.com/storage/avatars/abc123-filename.jpg"
  },
  "message": "Avatar uploaded successfully"
}
```

**Error Response Example:**

```json
{
  "success": false,
  "message": "Invalid file type",
  "errors": {
    "avatar": ["The avatar must be an image."]
  }
}
```

---

## 4. Change Password

**Endpoint:** `PUT /api/admin/profile/password`

**Description:** Change the admin's password.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword123",
  "new_password_confirmation": "newpassword123"
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Validation Rules:**

- `current_password`: required, must match current password
- `new_password`: required, minimum 8 characters
- `new_password_confirmation`: required, must match new_password

---

## 5. Update Notification Preferences

**Endpoint:** `PUT /api/admin/profile/notifications`

**Description:** Update notification preferences for the admin.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "email_notifications": true,
  "order_notifications": false,
  "user_notifications": true,
  "system_notifications": false,
  "marketing_emails": false
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "email_notifications": true,
    "order_notifications": false,
    "user_notifications": true,
    "system_notifications": false,
    "marketing_emails": false
  },
  "message": "Notification preferences updated"
}
```

---

## 6. Get Admin Statistics (Optional)

**Endpoint:** `GET /api/admin/profile/stats`

**Description:** Get detailed statistics for the admin dashboard.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "orders_managed": 150,
    "users_supervised": 89,
    "products_added": 25,
    "login_sessions": 342,
    "recent_activities": [
      {
        "action": "user_management",
        "description": "Updated user permissions",
        "timestamp": "2024-01-25T13:30:00Z"
      },
      {
        "action": "order_management",
        "description": "Processed order updates",
        "timestamp": "2024-01-25T12:15:00Z"
      }
    ]
  },
  "message": "Statistics retrieved successfully"
}
```

---

## 7. Delete Account (Optional)

**Endpoint:** `DELETE /api/admin/profile`

**Description:** Soft delete the admin account (requires password confirmation).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "password": "currentpassword123"
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Account deletion request submitted"
}
```

---

## Fallback Endpoints

If the primary endpoints are not available, the frontend will attempt these alternatives:

### Alternative Avatar Upload:

- `POST /api/auth/profile/avatar`
- `POST /api/upload/avatar`

### Alternative Profile Management:

- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`

---

## Database Requirements

Ensure your `users` table includes these fields:

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN bio TEXT NULL;
ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
```

---

## Error Response Format

All error responses should follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (not admin)
- `404`: Endpoint not found
- `413`: File too large
- `422`: Validation error
- `500`: Server error

---

## Priority Implementation Order

1. **GET /api/admin/profile** - Load profile data
2. **POST /api/admin/profile/avatar** - Image upload (current issue)
3. **PUT /api/admin/profile** - Update profile
4. **PUT /api/admin/profile/password** - Change password
5. **PUT /api/admin/profile/notifications** - Update preferences
6. Other endpoints as needed

---

## Testing

Use the diagnostic tool in the admin profile page to test each endpoint. The tool will show detailed logs and help identify any issues with the API implementation.

### Quick Test:

1. Open browser Developer Tools (F12)
2. Go to Admin Profile page
3. Use the "🔧 Avatar Upload Diagnostic Tool"
4. Check console logs for detailed endpoint testing results
