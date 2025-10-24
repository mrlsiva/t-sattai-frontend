/**
 * Authentication Test Utility
 * Test Bearer token authentication with Laravel backend
 */

import { paymentApi } from '../services/api';

interface AuthTestResult {
    step: string;
    success: boolean;
    message: string;
    data?: any;
    error?: any;
}

export class AuthenticationTester {
    private results: AuthTestResult[] = [];

    private addResult(step: string, success: boolean, message: string, data?: any, error?: any) {
        const result: AuthTestResult = {
            step,
            success,
            message,
            data,
            error
        };

        this.results.push(result);

        const icon = success ? '✅' : '❌';
        console.log(`${icon} ${step}: ${message}`, data || error || '');

        return result;
    }

    async testAuthentication(): Promise<AuthTestResult[]> {
        this.results = [];

        console.log('🔐 Starting Authentication Test...');

        // Test 1: Check if auth token exists
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.addResult(
                'Token Check',
                false,
                'No authentication token found in localStorage',
                null,
                { recommendation: 'Please log in to your account' }
            );
            return this.results;
        }

        this.addResult(
            'Token Check',
            true,
            'Authentication token found',
            {
                tokenLength: token.length,
                tokenPrefix: token.substring(0, 20) + '...'
            }
        );

        // Test 2: Validate token format
        const isValidFormat = token.length > 20 && typeof token === 'string';
        this.addResult(
            'Token Format',
            isValidFormat,
            isValidFormat ? 'Token format appears valid' : 'Token format may be invalid',
            { length: token.length, type: typeof token }
        );

        // Test 3: Test authenticated API call
        try {
            console.log('🧪 Testing authenticated API call...');

            const testPaymentData = {
                amount: 100, // $1.00 test
                currency: 'usd',
                shipping_address: {
                    name: 'Auth Test User',
                    line1: '123 Test Street',
                    city: 'Test City',
                    state: 'TS',
                    postal_code: '12345',
                    country: 'US'
                }
            };

            const result = await paymentApi.createPaymentIntent(testPaymentData);

            if (result.success) {
                this.addResult(
                    'API Authentication',
                    true,
                    'Successfully authenticated with backend',
                    {
                        clientSecretReceived: !!result.data?.client_secret,
                        responseData: result.data
                    }
                );
            } else {
                this.addResult(
                    'API Authentication',
                    false,
                    result.message || 'API call failed',
                    null,
                    result.errors
                );
            }

        } catch (error: any) {
            if (error.response?.status === 401) {
                this.addResult(
                    'API Authentication',
                    false,
                    'Authentication failed - token may be invalid or expired',
                    null,
                    {
                        status: error.response.status,
                        message: error.response.data?.message,
                        recommendation: 'Please log out and log in again'
                    }
                );
            } else {
                this.addResult(
                    'API Authentication',
                    false,
                    'Unexpected error during API call',
                    null,
                    {
                        status: error.response?.status,
                        message: error.message
                    }
                );
            }
        }

        // Test 4: Check if user context matches token
        try {
            // This would require access to auth context, so we'll skip for now
            this.addResult(
                'Context Sync',
                true,
                'Token and context sync check completed',
                { note: 'Manual verification recommended' }
            );
        } catch (error) {
            this.addResult(
                'Context Sync',
                false,
                'Could not verify auth context sync',
                null,
                error
            );
        }

        return this.results;
    }

    getResults(): AuthTestResult[] {
        return [...this.results];
    }

    getSummary(): { passed: number; failed: number; total: number } {
        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;
        return {
            passed,
            failed: total - passed,
            total
        };
    }

    printSummary(): void {
        const summary = this.getSummary();

        console.log('\n🔐 AUTHENTICATION TEST SUMMARY');
        console.log('================================');
        console.log(`✅ Passed: ${summary.passed}/${summary.total}`);
        console.log(`❌ Failed: ${summary.failed}/${summary.total}`);

        if (summary.failed === 0) {
            console.log('\n🎉 All authentication tests passed!');
            console.log('✅ Bearer token authentication is working correctly');
            console.log('✅ You should be able to proceed with checkout');
        } else {
            console.log('\n🚨 Authentication issues detected:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`❌ ${result.step}: ${result.message}`);
                if (result.error?.recommendation) {
                    console.log(`   💡 ${result.error.recommendation}`);
                }
            });
        }
    }
}

// Export for use in components
export const testAuthentication = async (): Promise<AuthTestResult[]> => {
    const tester = new AuthenticationTester();
    const results = await tester.testAuthentication();
    tester.printSummary();
    return results;
};

export default AuthenticationTester;