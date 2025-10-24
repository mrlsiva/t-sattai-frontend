// Application Configuration
// This file centralizes all configuration values for easy management

export const config = {
    // API Configuration
    api: {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
        timeout: 10000,
        retryAttempts: 3,
    },

    // Stripe Configuration
    stripe: {
        publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
    },

    // App Configuration
    app: {
        name: 'E-Commerce Frontend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    },

    // Feature Flags
    features: {
        enableDebugMode: process.env.NODE_ENV === 'development',
        enableAnalytics: process.env.NODE_ENV === 'production',
    },

    // Pagination and Limits
    pagination: {
        defaultPageSize: 12,
        maxPageSize: 100,
    },

    // Image Configuration
    images: {
        placeholder: '/api/placeholder/400/400',
        categoryPlaceholderBase: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=',
    },
};

// Log configuration in development
if (config.app.environment === 'development') {
    console.log('🔧 App Configuration:', {
        'API Base URL': config.api.baseURL,
        'Environment': config.app.environment,
        'Debug Mode': config.features.enableDebugMode,
    });
}

export default config;