# 🔧 API Configuration Guide

This guide explains how to easily change the API base URL and other configuration settings.

## 📁 Configuration Files

### 1. Environment Variables (`.env`)

The primary place to configure your API settings:

```properties
# API Configuration
REACT_APP_API_URL=https://api.pandiyankanna.com/public/api

# Stripe Configuration (Test Keys)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51SLJsp8FTpauxKQS4LU1mBX5eLaoS6DuWngOP0TZEqEUR7qyG8YvXl8XOW6OFuF1p0LBkdkqoz5tJOfOSjxNRPLT00ECTflJuu
```

### 2. Centralized Config (`src/config/index.ts`)

All application configuration in one place:

```typescript
export const config = {
  api: {
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
    timeout: 10000,
  },
  // ... other settings
};
```

## 🚀 How to Change API URL

### For Development

1. **Edit `.env` file:**
   ```properties
   REACT_APP_API_URL=http://localhost:8000/api
   ```

### For Production

1. **Edit `.env` file:**
   ```properties
   REACT_APP_API_URL=https://api.pandiyankanna.com/public/api
   ```

### For Different Environments

1. **Create environment-specific files:**

   - `.env.development` - for development
   - `.env.production` - for production
   - `.env.staging` - for staging

2. **Example `.env.production`:**
   ```properties
   REACT_APP_API_URL=https://api.pandiyankanna.com/public/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
   ```

## 🔄 Applying Changes

### During Development

1. Stop the development server (`Ctrl+C`)
2. Edit the `.env` file
3. Restart the development server (`npm start`)

### For Production Build

1. Update the `.env` or `.env.production` file
2. Build the application (`npm run build`)
3. Deploy the `build` folder

## 📍 Current Configuration

You can check the current API URL in the browser console. Look for:

```
🔧 App Configuration: {
  "API Base URL": "https://api.pandiyankanna.com/public/api",
  "Environment": "development",
  "Debug Mode": true
}
```

## ✅ Verification

To verify your API URL is working:

1. **Check Browser Console** - Look for the configuration log
2. **Check Network Tab** - API calls should go to your configured URL
3. **Test Product Pages** - Data should load from your API

## 🛠️ Advanced Configuration

### Custom Timeouts

Edit `src/config/index.ts`:

```typescript
api: {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 15000, // 15 seconds
  retryAttempts: 5,
}
```

### Feature Flags

```typescript
features: {
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableAnalytics: true,
}
```

## 🔐 Security Notes

- Never commit real API keys to version control
- Use different keys for development and production
- Consider using environment-specific `.env` files
- Add `.env.local` to `.gitignore` for local overrides

## 📞 Support

If you need to change the API URL or have configuration issues:

1. Check the browser console for configuration logs
2. Verify your `.env` file is in the root directory
3. Restart the development server after changes
4. Check that environment variables start with `REACT_APP_`
