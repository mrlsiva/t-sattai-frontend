# Stripe Payment Debugging Tools

This project includes comprehensive debugging tools to help diagnose Stripe payment integration issues.

## 🚀 Quick Start

1. **Enable Debug Mode**: In development mode, debugging tools are automatically enabled.

2. **Access Debug Dashboard**: Look for the orange bug icon (🐛) in the bottom-right corner of your screen when running in development mode.

3. **Set Environment Variables**: Copy `.env.example` to `.env.local` and configure your Stripe keys:
   ```bash
   cp .env.example .env.local
   ```

## 🛠️ Debug Tools Overview

### 1. Debug Dashboard

- **Location**: Floating button in bottom-right corner (dev mode only)
- **Features**:
  - Environment validation
  - Quick connection tests
  - Full backend testing suite
  - Live Stripe logs
  - Data export capabilities

### 2. Enhanced Checkout Form

- **File**: `src/components/CheckoutFormWithDebug.tsx`
- **Features**:
  - Step-by-step payment flow logging
  - Detailed error reporting
  - Payment intent status checking
  - Backend confirmation testing

### 3. Stripe Debugger Utility

- **File**: `src/utils/stripeDebugger.ts`
- **Features**:
  - Centralized logging system
  - Environment validation
  - Error categorization
  - Export functionality

### 4. Backend Tester

- **File**: `src/utils/paymentBackendTester.ts`
- **Features**:
  - API endpoint testing
  - Payment intent creation testing
  - Connection validation
  - Automated test suites

## 🔍 Common Debugging Scenarios

### Scenario 1: 400 Bad Request Error

**Symptoms**: Getting a 400 error when confirming payment

**Debug Steps**:

1. Open Debug Dashboard
2. Click "Test Backend Connection"
3. Click "Test Payment Intent"
4. Check console logs for detailed error information

**Common Causes**:

- Invalid client_secret format
- Payment intent in wrong status
- Missing or invalid shipping address
- Backend validation failures

### Scenario 2: Payment Intent Creation Fails

**Debug Steps**:

1. Check environment variables (Stripe keys)
2. Test backend connection
3. Verify Laravel Stripe configuration
4. Check Laravel logs

### Scenario 3: Frontend Shows Success but Backend Fails

**Debug Steps**:

1. Check browser network tab
2. Examine backend response
3. Verify payment intent status in Stripe dashboard
4. Check Laravel error logs

## 🧪 Testing the Payment Flow

### Quick Tests

```javascript
// Test from browser console
import { runBackendTest } from "./utils/paymentBackendTester";
runBackendTest();
```

### Manual Testing Steps

1. **Environment Check**: Verify all environment variables are set
2. **Backend Connection**: Ensure Laravel API is running and accessible
3. **Payment Intent Creation**: Test creating a payment intent
4. **Stripe Dashboard**: Check payment intent status in Stripe dashboard
5. **Payment Confirmation**: Test the full payment flow

## 📊 Debug Data Export

### Export Options

- **Stripe Logs**: All frontend Stripe interactions
- **Backend Test Results**: API endpoint test results
- **Environment Info**: Configuration and browser details
- **Complete Debug Package**: All debug data in JSON format

### Using Exported Data

1. Click "Export All Debug Data" in Debug Dashboard
2. Save the JSON file
3. Include in bug reports or support requests

## 🔧 Configuration

### Environment Variables

```bash
# Required
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_API_URL=http://localhost:8000/api

# Optional Debug Settings
REACT_APP_STRIPE_DEBUG_ENABLED=true
REACT_APP_LOG_LEVEL=debug
```

### Laravel Backend Configuration

Ensure your Laravel backend has:

- Stripe secret key configured
- CORS properly set up
- Payment endpoints available:
  - `POST /api/payments/create-intent`
  - `POST /api/payments/confirm`
  - `GET /api/payments/methods`

## 🚨 Common Issues & Solutions

### Issue: "Stripe not loaded"

**Solution**: Check if Stripe publishable key is set correctly in environment variables

### Issue: "Payment intent in unexpected state"

**Solutions**:

- Check Stripe dashboard for payment intent status
- Ensure payment intent isn't already processed
- Verify client_secret is current and valid

### Issue: "Backend connection failed"

**Solutions**:

- Verify Laravel server is running
- Check CORS configuration
- Ensure API routes are properly registered

### Issue: "400 Bad Request from Stripe"

**Solutions**:

- Verify payment method is properly attached
- Check shipping address format
- Ensure payment intent amount matches
- Validate all required fields are present

## 📱 Console Commands

Enable/disable debugging from browser console:

```javascript
// Enable debugging
stripeDebugger.setEnabled(true);

// View all logs
console.log(stripeDebugger.getLogs());

// Run backend test
runBackendTest();

// Clear all logs
stripeDebugger.clearLogs();
```

## 🔒 Security Notes

- Debug tools are automatically disabled in production builds
- Sensitive data (like full keys) is masked in logs
- Client secrets are truncated in debug output
- Always use test keys during development

## 📞 Support

When reporting issues, include:

1. Exported debug data JSON file
2. Browser console logs
3. Laravel error logs
4. Stripe dashboard screenshots
5. Steps to reproduce the issue

The debug tools provide comprehensive logging and testing capabilities to help identify and resolve Stripe payment integration issues quickly and efficiently.
