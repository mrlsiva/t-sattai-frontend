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
        name: 'Vembar Karupatti',
        tagline: 'Pure Sweetness from Nature',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    },

    // Brand Configuration
    brand: {
        name: 'VEMBAR KARUPATTI',
        tagline: 'Pure Sweetness from Nature',
        colors: {
            primary: '#8B4513',     // Brown (like jaggery)
            secondary: '#D2B48C',   // Light brown/tan
            accent: '#228B22',      // Forest green (palm tree)
            gold: '#DAA520',        // Golden yellow (like the logo background)
        },
        description: 'Premium traditional jaggery and natural sweeteners from South India',
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

export default config;