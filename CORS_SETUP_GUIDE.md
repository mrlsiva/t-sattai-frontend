# CORS Configuration Guide for Backend

## Issue

Your frontend (`https://vembarkarupatti.in`) is being blocked by CORS policy when trying to access your backend API (`https://backend.vembarkarupatti.in`).

## Backend Solutions

### For Laravel Backend

Add this to your `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://vembarkarupatti.in',
        'http://localhost:3000',  // for local development
        'http://127.0.0.1:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

### For Express.js Backend

Add this to your server setup:

```javascript
const cors = require("cors");

const corsOptions = {
  origin: [
    "https://vembarkarupatti.in",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### For Apache Server (.htaccess)

Add this to your `.htaccess` file in the backend root:

```apache
# Enable CORS
Header always set Access-Control-Allow-Origin "https://vembarkarupatti.in"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
Header always set Access-Control-Allow-Credentials "true"

# Handle preflight OPTIONS requests
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

### For Nginx Server

Add this to your server block:

```nginx
location /api {
    add_header Access-Control-Allow-Origin "https://vembarkarupatti.in" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    if ($request_method = 'OPTIONS') {
        return 200;
    }

    # Your existing API configuration
}
```

## Quick Test Solution

For immediate testing, you can temporarily use a CORS proxy in your frontend:

### Option 1: Update .env for local testing

```env
# For local development only - use local backend
REACT_APP_API_URL=http://127.0.0.1:8000/api
```

### Option 2: Use CORS proxy (temporary solution)

```env
# Temporary CORS proxy (NOT for production)
REACT_APP_API_URL=https://cors-anywhere.herokuapp.com/https://backend.vembarkarupatti.in/api
```

## Production Solution Required

The proper solution is to configure your backend server to allow CORS from your frontend domain. This must be done on the backend side.

## Testing CORS Configuration

You can test if CORS is working with:

```bash
curl -H "Origin: https://vembarkarupatti.in" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type, Authorization" \
     -X OPTIONS \
     https://backend.vembarkarupatti.in/api/auth/login
```

Expected response should include:

- `Access-Control-Allow-Origin: https://vembarkarupatti.in`
- `Access-Control-Allow-Methods: POST`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
