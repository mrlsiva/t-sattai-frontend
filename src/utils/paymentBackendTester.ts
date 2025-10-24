/**
 * Stripe Payment Backend Test Script
 * This script helps test the Laravel backend payment endpoints
 */

import axios from 'axios';
import config from '../config';

// Configuration - Update these values for your environment
const CONFIG = {
    API_BASE_URL: config.api.baseURL,
    STRIPE_PUBLISHABLE_KEY: config.stripe.publishableKey,
    TEST_AMOUNT: 2000, // $20.00 in cents
    TEST_CURRENCY: 'usd'
};

interface TestShippingAddress {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

interface TestResults {
    step: string;
    success: boolean;
    data?: any;
    error?: any;
    timestamp: string;
}

class PaymentBackendTester {
    private results: TestResults[] = [];
    private apiClient: any;

    constructor() {
        this.apiClient = axios.create({
            baseURL: CONFIG.API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 30000, // 30 second timeout
        });

        // Add request/response interceptors for debugging
        this.apiClient.interceptors.request.use(
            (config: any) => {
                console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
                    data: config.data,
                    headers: config.headers
                });
                return config;
            },
            (error: any) => {
                console.error('🔴 API Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.apiClient.interceptors.response.use(
            (response: any) => {
                console.log(`🟢 API Response: ${response.status} ${response.config.url}`, {
                    data: response.data,
                    headers: response.headers
                });
                return response;
            },
            (error: any) => {
                console.error(`🔴 API Response Error: ${error.response?.status || 'No Status'} ${error.config?.url}`, {
                    data: error.response?.data,
                    message: error.message,
                    status: error.response?.status
                });
                return Promise.reject(error);
            }
        );
    }

    private logResult(step: string, success: boolean, data?: any, error?: any) {
        const result: TestResults = {
            step,
            success,
            data,
            error,
            timestamp: new Date().toISOString()
        };

        this.results.push(result);

        if (success) {
            console.log(`✅ ${step}: SUCCESS`, data);
        } else {
            console.error(`❌ ${step}: FAILED`, error);
        }
    }

    async testServerConnection(): Promise<boolean> {
        try {
            const response = await this.apiClient.get('/health-check');
            this.logResult('Server Connection', true, response.data);
            return true;
        } catch (error: any) {
            // If health-check doesn't exist, try a basic endpoint
            try {
                const response = await this.apiClient.get('/');
                this.logResult('Server Connection (fallback)', true, response.data);
                return true;
            } catch (fallbackError: any) {
                this.logResult('Server Connection', false, null, {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                return false;
            }
        }
    }

    async testCreatePaymentIntent(): Promise<string | null> {
        const testAddress: TestShippingAddress = {
            name: 'John Doe',
            line1: '123 Test Street',
            city: 'Test City',
            state: 'TS',
            postal_code: '12345',
            country: 'US'
        };

        const paymentData = {
            amount: CONFIG.TEST_AMOUNT,
            currency: CONFIG.TEST_CURRENCY,
            shipping_address: testAddress
        };

        try {
            const response = await this.apiClient.post('/payments/create-intent', paymentData);

            if (response.data.success && response.data.data.client_secret) {
                this.logResult('Create Payment Intent', true, {
                    client_secret: response.data.data.client_secret.substring(0, 20) + '...',
                    amount: response.data.data.amount,
                    currency: response.data.data.currency
                });
                return response.data.data.client_secret;
            } else {
                this.logResult('Create Payment Intent', false, null, {
                    message: 'Invalid response format',
                    response: response.data
                });
                return null;
            }
        } catch (error: any) {
            this.logResult('Create Payment Intent', false, null, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            return null;
        }
    }

    async testConfirmPayment(paymentIntentId: string): Promise<boolean> {
        const testAddress: TestShippingAddress = {
            name: 'John Doe',
            line1: '123 Test Street',
            city: 'Test City',
            state: 'TS',
            postal_code: '12345',
            country: 'US'
        };

        const confirmData = {
            payment_intent_id: paymentIntentId,
            shipping_address: testAddress
        };

        try {
            const response = await this.apiClient.post('/payments/confirm', confirmData);

            if (response.data.success) {
                this.logResult('Confirm Payment', true, {
                    order_number: response.data.data.order_number,
                    status: response.data.data.status
                });
                return true;
            } else {
                this.logResult('Confirm Payment', false, null, {
                    message: response.data.message,
                    errors: response.data.errors
                });
                return false;
            }
        } catch (error: any) {
            this.logResult('Confirm Payment', false, null, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            return false;
        }
    }

    async testPaymentMethods(): Promise<boolean> {
        try {
            const response = await this.apiClient.get('/payments/methods');

            if (response.data.success) {
                this.logResult('Get Payment Methods', true, {
                    count: response.data.data.length,
                    methods: response.data.data.map((m: any) => ({ id: m.id, name: m.name, type: m.type }))
                });
                return true;
            } else {
                this.logResult('Get Payment Methods', false, null, response.data);
                return false;
            }
        } catch (error: any) {
            this.logResult('Get Payment Methods', false, null, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            return false;
        }
    }

    async runFullTest(): Promise<void> {
        console.log('🚀 Starting Backend Payment System Test...');
        console.log('Configuration:', {
            API_BASE_URL: CONFIG.API_BASE_URL,
            STRIPE_KEY_PRESENT: !!CONFIG.STRIPE_PUBLISHABLE_KEY,
            TEST_AMOUNT: CONFIG.TEST_AMOUNT,
            TEST_CURRENCY: CONFIG.TEST_CURRENCY
        });

        // Test 1: Server Connection
        console.log('\n📡 Testing server connection...');
        const serverConnected = await this.testServerConnection();

        if (!serverConnected) {
            console.log('❌ Cannot proceed - server not reachable');
            this.printSummary();
            return;
        }

        // Test 2: Payment Methods
        console.log('\n💳 Testing payment methods endpoint...');
        await this.testPaymentMethods();

        // Test 3: Create Payment Intent
        console.log('\n🎯 Testing payment intent creation...');
        const clientSecret = await this.testCreatePaymentIntent();

        if (!clientSecret) {
            console.log('❌ Cannot proceed - payment intent creation failed');
            this.printSummary();
            return;
        }

        // Extract payment intent ID from client secret
        const paymentIntentId = clientSecret.split('_secret_')[0];
        console.log(`📝 Extracted Payment Intent ID: ${paymentIntentId}`);

        // Test 4: Payment Confirmation (This will likely fail without actual payment)
        console.log('\n✅ Testing payment confirmation...');
        console.log('⚠️  Note: This test will likely fail since we haven\'t actually processed a payment');
        await this.testConfirmPayment(paymentIntentId);

        this.printSummary();
    }

    printSummary(): void {
        console.log('\n📊 TEST SUMMARY');
        console.log('================');

        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;

        console.log(`✅ Passed: ${passed}/${total} tests`);
        console.log(`❌ Failed: ${total - passed}/${total} tests`);

        console.log('\nDetailed Results:');
        this.results.forEach((result, index) => {
            const icon = result.success ? '✅' : '❌';
            console.log(`${index + 1}. ${icon} ${result.step}`);
            if (!result.success && result.error) {
                console.log(`   Error: ${result.error.message || 'Unknown error'}`);
                if (result.error.status) {
                    console.log(`   Status: ${result.error.status}`);
                }
            }
        });

        console.log('\n🔧 DEBUGGING RECOMMENDATIONS:');

        if (!this.results.find(r => r.step === 'Server Connection')?.success) {
            console.log('• Check if Laravel server is running');
            console.log('• Verify API_BASE_URL is correct');
            console.log('• Check CORS configuration');
        }

        const createIntentResult = this.results.find(r => r.step === 'Create Payment Intent');
        if (!createIntentResult?.success) {
            console.log('• Check Stripe secret key configuration in Laravel');
            console.log('• Verify /api/payments/create-intent route exists');
            console.log('• Check Laravel logs for detailed errors');
        }

        const confirmResult = this.results.find(r => r.step === 'Confirm Payment');
        if (!confirmResult?.success) {
            console.log('• This is expected if payment wasn\'t actually processed');
            console.log('• Check /api/payments/confirm route implementation');
            console.log('• Verify payment intent status validation');
        }

        console.log('\n📁 Export results to console:');
        console.log('Copy this for support: ', JSON.stringify(this.results, null, 2));
    }

    getResults(): TestResults[] {
        return [...this.results];
    }

    clearResults(): void {
        this.results = [];
    }
}

// Export for use in React components or standalone testing
export default PaymentBackendTester;

// For standalone testing (can be called from browser console)
export const runBackendTest = () => {
    const tester = new PaymentBackendTester();
    return tester.runFullTest();
};

// Quick test functions for individual endpoints
export const quickTestConnection = () => {
    const tester = new PaymentBackendTester();
    return tester.testServerConnection();
};

export const quickTestCreateIntent = () => {
    const tester = new PaymentBackendTester();
    return tester.testCreatePaymentIntent();
};

export const quickTestPaymentMethods = () => {
    const tester = new PaymentBackendTester();
    return tester.testPaymentMethods();
};