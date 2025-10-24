/**
 * Stripe Payment Debugging Utilities
 * This file contains utilities to help debug Stripe payment confirmation issues
 */

interface DebugLog {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
}

class StripeDebugger {
    private logs: DebugLog[] = [];
    private isEnabled: boolean;

    constructor() {
        this.isEnabled = process.env.NODE_ENV === 'development' ||
            localStorage.getItem('stripe_debug_enabled') === 'true';
    }

    private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
        if (!this.isEnabled) return;

        const logEntry: DebugLog = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data ? JSON.parse(JSON.stringify(data)) : undefined
        };

        this.logs.push(logEntry);

        // Also log to console for immediate visibility
        const logMethod = level === 'error' ? console.error :
            level === 'warn' ? console.warn : console.log;

        logMethod(`[Stripe Debug ${level.toUpperCase()}] ${message}`, data || '');
    }

    info(message: string, data?: any) {
        this.log('info', message, data);
    }

    warn(message: string, data?: any) {
        this.log('warn', message, data);
    }

    error(message: string, data?: any) {
        this.log('error', message, data);
    }

    // Payment Intent debugging
    logPaymentIntentCreation(paymentData: any, response: any) {
        this.info('Payment Intent Creation Request', {
            request: paymentData,
            response: response
        });
    }

    logPaymentIntentError(error: any, context?: any) {
        this.error('Payment Intent Creation Failed', {
            error: {
                message: error.message,
                status: error.status,
                code: error.code,
                type: error.type
            },
            context
        });
    }

    // Payment confirmation debugging
    logPaymentConfirmation(paymentIntentId: string, clientSecret: string, shippingAddress: any) {
        this.info('Payment Confirmation Started', {
            paymentIntentId,
            clientSecret: clientSecret ? `${clientSecret.substring(0, 20)}...` : 'missing',
            shippingAddress
        });
    }

    logStripeConfirmationResult(result: any) {
        if (result.error) {
            this.error('Stripe Payment Confirmation Failed', {
                error: {
                    type: result.error.type,
                    code: result.error.code,
                    message: result.error.message,
                    decline_code: result.error.decline_code,
                    payment_intent: result.error.payment_intent
                }
            });
        } else {
            this.info('Stripe Payment Confirmation Successful', {
                paymentIntent: {
                    id: result.paymentIntent?.id,
                    status: result.paymentIntent?.status,
                    amount: result.paymentIntent?.amount,
                    currency: result.paymentIntent?.currency,
                    client_secret: result.paymentIntent?.client_secret ?
                        `${result.paymentIntent.client_secret.substring(0, 20)}...` : 'missing'
                }
            });
        }
    }

    logBackendConfirmation(paymentIntentId: string, shippingAddress: any, response: any) {
        this.info('Backend Payment Confirmation', {
            request: {
                payment_intent_id: paymentIntentId,
                shipping_address: shippingAddress
            },
            response
        });
    }

    logBackendConfirmationError(error: any, paymentIntentId: string) {
        this.error('Backend Payment Confirmation Failed', {
            paymentIntentId,
            error: {
                message: error.message,
                status: error.status || error.response?.status,
                data: error.response?.data
            }
        });
    }

    // Environment validation
    validateEnvironment() {
        const issues: string[] = [];

        const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey || stripeKey === 'pk_test_51234567890abcdef') {
            issues.push('Stripe publishable key is missing or using default value');
        }

        if (stripeKey && !stripeKey.startsWith('pk_')) {
            issues.push('Stripe publishable key format is invalid');
        }

        if (stripeKey && stripeKey.startsWith('sk_')) {
            issues.push('Using secret key instead of publishable key (SECURITY RISK)');
        }

        if (issues.length > 0) {
            this.error('Environment Configuration Issues', { issues });
        } else {
            this.info('Environment Configuration Valid', {
                stripeKey: stripeKey ? `${stripeKey.substring(0, 20)}...` : 'missing'
            });
        }

        return issues;
    }

    // Get all logs
    getLogs(level?: 'info' | 'warn' | 'error'): DebugLog[] {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return [...this.logs];
    }

    // Clear logs
    clearLogs() {
        this.logs = [];
        this.info('Debug logs cleared');
    }

    // Export logs for support
    exportLogs(): string {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            environment: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                nodeEnv: process.env.NODE_ENV
            },
            logs: this.logs
        }, null, 2);
    }

    // Enable/disable debugging
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        localStorage.setItem('stripe_debug_enabled', enabled.toString());
        this.info(`Debug logging ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Create singleton instance
export const stripeDebugger = new StripeDebugger();

// Helper functions for common debugging scenarios
export const debugStripeError = (error: any, context: string) => {
    stripeDebugger.error(`Stripe Error in ${context}`, {
        type: error.type,
        code: error.code,
        message: error.message,
        decline_code: error.decline_code,
        payment_intent: error.payment_intent,
        request_log_url: error.request_log_url
    });
};

export const debugAPIError = (error: any, endpoint: string) => {
    stripeDebugger.error(`API Error at ${endpoint}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
    });
};

export default stripeDebugger;