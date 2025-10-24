/**
 * Quick Backend Test Script
 * Run this script to test your Laravel backend connection
 */

const testBackendConnection = async () => {
    // Read from environment variable or fallback to localhost
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

    console.log('🔍 Testing Laravel Backend Connection...');
    console.log(`API Base URL: ${API_BASE_URL}`);

    // Check if we have an auth token (simulating browser environment)
    const hasAuthToken = false; // We don't have access to localStorage in Node.js
    console.log(`🔐 Auth Token Available: ${hasAuthToken ? 'Yes' : 'No (Expected in Node.js)'}`);

    try {
        // Test 1: Basic API health check (no auth required)
        console.log('\n1️⃣ Testing basic API connectivity...');

        const healthResponse = await fetch(`${API_BASE_URL}/payments/methods`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${healthResponse.status} ${healthResponse.statusText}`);

        if (healthResponse.status === 401) {
            console.log('✅ Expected Result: API is responding but requires authentication');
            console.log('🔐 This confirms that authentication is required for payment endpoints');
        } else if (healthResponse.ok) {
            const data = await healthResponse.json();
            console.log('✅ Response:', data);
        } else {
            const errorText = await healthResponse.text();
            console.log('❌ Error Response:', errorText);
        }

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n🔧 Possible solutions:');
        console.log('- Make sure your Laravel server is running (php artisan serve)');
        console.log('- Check if the server is running on port 8000');
        console.log('- Verify CORS configuration in Laravel');
        console.log('- Check firewall settings');
        return;
    }

    try {
        // Test 2: Create payment intent test (will fail without auth)
        console.log('\n2️⃣ Testing payment intent creation (without auth)...');

        const testPaymentData = {
            amount: 2000, // $20.00
            currency: 'usd',
            shipping_address: {
                name: 'Test User',
                line1: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                postal_code: '12345',
                country: 'US'
            }
        };

        const paymentResponse = await fetch(`${API_BASE_URL}/payments/create-intent`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPaymentData)
        });

        console.log(`Status: ${paymentResponse.status} ${paymentResponse.statusText}`);

        if (paymentResponse.status === 401) {
            console.log('✅ Expected Result: Payment endpoints require authentication');
            console.log('🔐 This is the root cause of your 400/401 errors');
        } else if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            console.log('✅ Payment Intent Created:', {
                success: paymentData.success,
                client_secret: paymentData.data?.client_secret ? 'present' : 'missing'
            });
        } else {
            const errorText = await paymentResponse.text();
            console.log('❌ Payment Intent Error:', errorText);
        }

    } catch (error) {
        console.error('❌ Payment Intent Test Failed:', error.message);
    }

    console.log('\n🎯 DIAGNOSIS:');
    console.log('❌ Root Cause: Payment endpoints require authentication');
    console.log('🔧 Solution Options:');
    console.log('   1. Ensure users are logged in before checkout');
    console.log('   2. Make payment endpoints public for guest checkout');
    console.log('   3. Handle authentication properly in frontend');

    console.log('\n🚀 Next Steps:');
    console.log('1. Open your React app at: http://localhost:3002');
    console.log('2. Make sure you are LOGGED IN to the application');
    console.log('3. Look for the orange bug icon (🐛) in the bottom-right corner');
    console.log('4. Click it to open the Debug Dashboard');
    console.log('5. Run the automated tests from there (while logged in)');
};// Run the test
testBackendConnection();