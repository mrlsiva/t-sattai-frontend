import axios, { AxiosResponse, AxiosError } from 'axios';
import config from '../config';
import {
    ApiResponse,
    PaginatedResponse,
    User,
    Product,
    Order,
    Category,
    Review,
    LoginData,
    RegisterData,
    CheckoutData,
    ProductFilters
} from '../types';

// Create axios instance with default config
const api = axios.create({
    baseURL: config.api.baseURL,
    timeout: config.api.timeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authApi = {
    login: async (credentials: LoginData): Promise<ApiResponse<{ user: User; token: string }>> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    register: async (userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    logout: async (): Promise<ApiResponse<null>> => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    getProfile: async (): Promise<ApiResponse<User>> => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
        const response = await api.put('/auth/profile', userData);
        return response.data;
    },

    forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, password: string, passwordConfirmation: string): Promise<ApiResponse<null>> => {
        const response = await api.post('/auth/reset-password', {
            token,
            password,
            password_confirmation: passwordConfirmation,
        });
        return response.data;
    },
};

// Products API
export const productsApi = {
    getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
        const response = await api.get('/products', { params: filters });
        return response.data;
    },

    getProduct: async (id: string): Promise<ApiResponse<Product>> => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    getFeaturedProducts: async (): Promise<ApiResponse<Product[]>> => {
        const response = await api.get('/products/featured');
        return response.data;
    },

    getRelatedProducts: async (productId: string): Promise<ApiResponse<Product[]>> => {
        const response = await api.get(`/products/${productId}/related`);
        return response.data;
    },

    searchProducts: async (query: string): Promise<ApiResponse<Product[]>> => {
        const response = await api.get('/products/search', { params: { q: query } });
        return response.data;
    },
};

// Categories API
export const categoriesApi = {
    getCategories: async (): Promise<ApiResponse<Category[]>> => {
        const response = await api.get('/categories');
        return response.data;
    },

    getCategory: async (id: string): Promise<ApiResponse<Category>> => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    getCategoryProducts: async (categoryId: string, filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
        const response = await api.get(`/categories/${categoryId}/products`, { params: filters });
        return response.data;
    },
};

// Orders API
export const ordersApi = {
    createOrder: async (orderData: CheckoutData): Promise<ApiResponse<Order>> => {
        const response = await api.post('/orders', orderData);
        return response.data;
    },

    getOrders: async (): Promise<ApiResponse<Order[]>> => {
        const response = await api.get('/orders');
        return response.data;
    },

    getOrder: async (id: string): Promise<ApiResponse<Order>> => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    cancelOrder: async (id: string): Promise<ApiResponse<Order>> => {
        const response = await api.put(`/orders/${id}/cancel`);
        return response.data;
    },

    trackOrder: async (id: string): Promise<ApiResponse<{ status: string; tracking: any[] }>> => {
        const response = await api.get(`/orders/${id}/track`);
        return response.data;
    },

    // Admin-specific order management endpoints with fallback to regular endpoints
    getAllOrders: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<Order[]>> => {
        try {
            const searchParams = new URLSearchParams();
            if (params?.page) searchParams.append('page', params.page.toString());
            if (params?.limit) searchParams.append('limit', params.limit.toString());
            if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
            if (params?.search) searchParams.append('search', params.search);

            const queryString = searchParams.toString();
            const url = queryString ? `/admin/orders?${queryString}` : '/admin/orders';

            const response = await api.get(url);
            return response.data;
        } catch (error: any) {
            // Fallback to regular orders endpoint if admin endpoint doesn't exist
            if (error.response?.status === 404) {
                console.warn('Admin orders endpoint not available, falling back to regular orders endpoint');
                try {
                    const response = await api.get('/orders');

                    // Transform data to match expected format if needed
                    let orders = response.data.data || response.data;

                    // Apply client-side filtering if needed
                    if (params?.status && params.status !== 'all') {
                        orders = orders.filter((order: any) => order.status === params.status);
                    }
                    if (params?.search) {
                        const searchLower = params.search.toLowerCase();
                        orders = orders.filter((order: any) =>
                            order.id?.toString().includes(searchLower) ||
                            order.user?.name?.toLowerCase().includes(searchLower) ||
                            order.user?.email?.toLowerCase().includes(searchLower)
                        );
                    }

                    return {
                        success: true,
                        data: orders,
                        message: 'Orders retrieved successfully (fallback)'
                    };
                } catch (fallbackError: any) {
                    // If even the basic orders endpoint doesn't exist, return empty data
                    console.warn('No orders endpoints available, returning empty data');
                    return {
                        success: true,
                        data: [],
                        message: 'No order endpoints available. Backend API needs to be implemented.'
                    };
                }
            }
            throw error;
        }
    },

    updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<Order>> => {
        try {
            const response = await api.put(`/admin/orders/${orderId}/status`, { status });
            return response.data;
        } catch (error: any) {
            // Fallback: try to update via regular order endpoint (if exists)
            if (error.response?.status === 404) {
                console.warn('Admin order status update endpoint not available');
                // Return an error response indicating the operation is not available
                return {
                    success: false,
                    message: 'Order status update endpoint not available (admin endpoints pending)',
                    errors: { general: ['Admin endpoints not implemented in backend'] }
                };
            }
            throw error;
        }
    },

    getOrderStats: async (): Promise<ApiResponse<{
        total: number;
        pending: number;
        processing: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        totalValue: number;
    }>> => {
        try {
            const response = await api.get('/admin/orders/stats');
            return response.data;
        } catch (error: any) {
            // Fallback: calculate stats from regular orders endpoint
            if (error.response?.status === 404) {
                console.warn('Admin stats endpoint not available, calculating from orders');
                try {
                    const ordersResponse = await api.get('/orders');
                    const orders = ordersResponse.data.data || ordersResponse.data || [];

                    const stats = {
                        total: orders.length,
                        pending: orders.filter((o: any) => o.status === 'pending').length,
                        processing: orders.filter((o: any) => o.status === 'processing').length,
                        shipped: orders.filter((o: any) => o.status === 'shipped').length,
                        delivered: orders.filter((o: any) => o.status === 'delivered').length,
                        cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
                        totalValue: orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_amount) || 0), 0)
                    };

                    return {
                        success: true,
                        data: stats,
                        message: 'Order statistics calculated from available data'
                    };
                } catch (fallbackError) {
                    // Return default stats if no orders endpoint is available
                    return {
                        success: true,
                        data: {
                            total: 0,
                            pending: 0,
                            processing: 0,
                            shipped: 0,
                            delivered: 0,
                            cancelled: 0,
                            totalValue: 0
                        },
                        message: 'No order data available'
                    };
                }
            }
            throw error;
        }
    },
};

// Cart API
export const cartApi = {
    getCart: async (): Promise<ApiResponse<any>> => {
        const response = await api.get('/cart');
        return response.data;
    },

    addToCart: async (productId: number, quantity: number = 1): Promise<ApiResponse<any>> => {
        const response = await api.post('/cart', { product_id: productId, quantity });
        return response.data;
    },

    updateCartItem: async (itemId: number, quantity: number): Promise<ApiResponse<any>> => {
        const response = await api.put(`/cart/${itemId}`, { quantity });
        return response.data;
    },

    removeFromCart: async (itemId: number): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/cart/${itemId}`);
        return response.data;
    },

    clearCart: async (): Promise<ApiResponse<any>> => {
        const response = await api.delete('/cart');
        return response.data;
    },

    applyCoupon: async (couponCode: string): Promise<ApiResponse<any>> => {
        const response = await api.post('/cart/coupon', { code: couponCode });
        return response.data;
    },

    removeCoupon: async (): Promise<ApiResponse<any>> => {
        const response = await api.delete('/cart/coupon');
        return response.data;
    },
};

// Wishlist API
export const wishlistApi = {
    getWishlist: async (): Promise<ApiResponse<any>> => {
        const response = await api.get('/wishlist');
        return response.data;
    },

    addToWishlist: async (productId: number): Promise<ApiResponse<any>> => {
        const response = await api.post('/wishlist', { product_id: productId });
        return response.data;
    },

    removeFromWishlist: async (productId: number): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/wishlist/${productId}`);
        return response.data;
    },

    clearWishlist: async (): Promise<ApiResponse<any>> => {
        const response = await api.delete('/wishlist');
        return response.data;
    },
};

// Reviews API
export const reviewsApi = {
    getProductReviews: async (productId: string): Promise<ApiResponse<Review[]>> => {
        const response = await api.get(`/products/${productId}/reviews`);
        return response.data;
    },

    addReview: async (productId: string, reviewData: Partial<Review>): Promise<ApiResponse<Review>> => {
        const response = await api.post(`/products/${productId}/reviews`, reviewData);
        return response.data;
    },

    updateReview: async (reviewId: string, reviewData: Partial<Review>): Promise<ApiResponse<Review>> => {
        const response = await api.put(`/reviews/${reviewId}`, reviewData);
        return response.data;
    },

    deleteReview: async (reviewId: string): Promise<ApiResponse<null>> => {
        const response = await api.delete(`/reviews/${reviewId}`);
        return response.data;
    },

    markHelpful: async (reviewId: string): Promise<ApiResponse<null>> => {
        const response = await api.post(`/reviews/${reviewId}/helpful`);
        return response.data;
    },
};

// Payment API
export const paymentApi = {
    createPaymentIntent: async (paymentData: {
        amount: number;
        currency: string;
        shipping_address: {
            name: string;
            line1: string;
            line2?: string;
            city: string;
            state?: string;
            postal_code: string;
            country: string;
        };
    }): Promise<ApiResponse<any>> => {
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('auth_token');
            if (!token) {
                return {
                    success: false,
                    message: 'Authentication required. Please log in to continue with payment.',
                    errors: { auth: ['User must be authenticated to create payment intent'] }
                };
            }

            const response = await api.post(`/payments/create-intent`, paymentData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                return {
                    success: false,
                    message: 'Authentication expired. Please log in again.',
                    errors: { auth: ['Authentication token expired or invalid'] }
                };
            }
            throw error;
        }
    },

    confirmPayment: async (paymentIntentId: string, shippingAddress: any): Promise<ApiResponse<any>> => {
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('auth_token');
            if (!token) {
                return {
                    success: false,
                    message: 'Authentication required. Please log in to complete payment.',
                    errors: { auth: ['User must be authenticated to confirm payment'] }
                };
            }

            const response = await api.post(`/payments/confirm`, {
                payment_intent_id: paymentIntentId,
                shipping_address: shippingAddress,
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                return {
                    success: false,
                    message: 'Authentication expired. Please log in again.',
                    errors: { auth: ['Authentication token expired or invalid'] }
                };
            }
            throw error;
        }
    },

    getPaymentMethods: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get('/payments/methods');
        return response.data;
    },
};

// Admin Users API
export const adminUsersApi = {
    // Get all users with optional filtering and pagination
    getAllUsers: async (params?: {
        page?: number;
        limit?: number;
        role?: string;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<User[]>> => {
        try {
            const searchParams = new URLSearchParams();
            if (params?.page) searchParams.append('page', params.page.toString());
            if (params?.limit) searchParams.append('limit', params.limit.toString());
            if (params?.role && params.role !== 'all') searchParams.append('role', params.role);
            if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
            if (params?.search) searchParams.append('search', params.search);

            const queryString = searchParams.toString();
            const url = queryString ? `/admin/users?${queryString}` : '/admin/users';

            const response = await api.get(url);
            return response.data;
        } catch (error: any) {
            // Fallback to regular users endpoint if admin endpoint doesn't exist
            if (error.response?.status === 404) {
                console.warn('Admin users endpoint not available, falling back to regular users endpoint');
                try {
                    const response = await api.get('/users');

                    // Transform data to match expected format if needed
                    let users = response.data.data || response.data;

                    // Apply client-side filtering if needed
                    if (params?.role && params.role !== 'all') {
                        users = users.filter((user: any) => {
                            if (params.role === 'admin') return user.is_admin;
                            if (params.role === 'customer') return !user.is_admin;
                            return true;
                        });
                    }
                    if (params?.status && params.status !== 'all') {
                        users = users.filter((user: any) => {
                            if (params.status === 'active') return user.is_active;
                            if (params.status === 'inactive') return !user.is_active;
                            return true;
                        });
                    }
                    if (params?.search) {
                        const searchLower = params.search.toLowerCase();
                        users = users.filter((user: any) =>
                            user.name?.toLowerCase().includes(searchLower) ||
                            user.email?.toLowerCase().includes(searchLower)
                        );
                    }

                    return {
                        success: true,
                        data: users,
                        message: 'Users retrieved successfully (fallback)'
                    };
                } catch (fallbackError: any) {
                    // If even the basic users endpoint doesn't exist, return empty data
                    console.warn('No users endpoints available, returning empty data');
                    return {
                        success: true,
                        data: [],
                        message: 'No user endpoints available. Backend API needs to be implemented.'
                    };
                }
            }
            throw error;
        }
    },

    // Update user status (activate/deactivate/ban)
    updateUserStatus: async (userId: number, status: string): Promise<ApiResponse<User>> => {
        try {
            const response = await api.put(`/admin/users/${userId}/status`, { status });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn('Admin user status update endpoint not available');
                return {
                    success: false,
                    message: 'User status update endpoint not available (admin endpoints pending)',
                    errors: { general: ['Admin endpoints not implemented in backend'] }
                };
            }
            throw error;
        }
    },

    // Update user role (admin/customer)
    updateUserRole: async (userId: number, role: string): Promise<ApiResponse<User>> => {
        try {
            const response = await api.put(`/admin/users/${userId}/role`, { role });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn('Admin user role update endpoint not available');
                return {
                    success: false,
                    message: 'User role update endpoint not available (admin endpoints pending)',
                    errors: { general: ['Admin endpoints not implemented in backend'] }
                };
            }
            throw error;
        }
    },

    // Get user statistics
    getUserStats: async (): Promise<ApiResponse<{
        total: number;
        active: number;
        inactive: number;
        admins: number;
        customers: number;
        newThisMonth: number;
    }>> => {
        try {
            const response = await api.get('/admin/users/stats');
            return response.data;
        } catch (error: any) {
            // Fallback: calculate stats from regular users endpoint
            if (error.response?.status === 404) {
                console.warn('Admin user stats endpoint not available, calculating from users');
                try {
                    const usersResponse = await api.get('/users');
                    const users = usersResponse.data.data || usersResponse.data || [];

                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();

                    const stats = {
                        total: users.length,
                        active: users.filter((u: any) => u.is_active).length,
                        inactive: users.filter((u: any) => !u.is_active).length,
                        admins: users.filter((u: any) => u.is_admin).length,
                        customers: users.filter((u: any) => !u.is_admin).length,
                        newThisMonth: users.filter((u: any) => {
                            const createdDate = new Date(u.created_at);
                            return createdDate.getMonth() === currentMonth &&
                                createdDate.getFullYear() === currentYear;
                        }).length
                    };

                    return {
                        success: true,
                        data: stats,
                        message: 'User statistics calculated from available data'
                    };
                } catch (fallbackError) {
                    // Return default stats if no users endpoint is available
                    return {
                        success: true,
                        data: {
                            total: 0,
                            active: 0,
                            inactive: 0,
                            admins: 0,
                            customers: 0,
                            newThisMonth: 0
                        },
                        message: 'No user data available'
                    };
                }
            }
            throw error;
        }
    },

    // Delete user (soft delete)
    deleteUser: async (userId: number): Promise<ApiResponse<any>> => {
        try {
            const response = await api.delete(`/admin/users/${userId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn('Admin user delete endpoint not available');
                return {
                    success: false,
                    message: 'User delete endpoint not available (admin endpoints pending)',
                    errors: { general: ['Admin endpoints not implemented in backend'] }
                };
            }
            throw error;
        }
    },
};

// Admin Dashboard API
export const adminDashboardApi = {
    // Get comprehensive dashboard statistics
    getDashboardStats: async (): Promise<ApiResponse<{
        totalProducts: number;
        totalOrders: number;
        totalUsers: number;
        totalRevenue: number;
        todayOrders: number;
        todayRevenue: number;
        recentOrdersCount: number;
        activeUsersCount: number;
    }>> => {
        try {
            const response = await api.get('/admin/dashboard/stats');
            return response.data;
        } catch (error: any) {
            // Fallback: aggregate stats from individual endpoints
            if (error.response?.status === 404) {
                console.warn('Admin dashboard stats endpoint not available, aggregating from individual endpoints');
                try {
                    // Get data from individual APIs
                    const [ordersResponse, usersResponse, productsResponse] = await Promise.allSettled([
                        ordersApi.getAllOrders(),
                        adminUsersApi.getAllUsers(),
                        api.get('/products')
                    ]);

                    let totalOrders = 0;
                    let totalRevenue = 0;
                    let todayOrders = 0;
                    let todayRevenue = 0;

                    if (ordersResponse.status === 'fulfilled') {
                        const orders = ordersResponse.value.data || [];
                        totalOrders = orders.length;
                        totalRevenue = orders.reduce((sum: number, order: any) =>
                            sum + (parseFloat(order.total_amount || order.total) || 0), 0);

                        const today = new Date().toISOString().split('T')[0];
                        const todayOrdersList = orders.filter((order: any) =>
                            order.created_at?.startsWith(today));
                        todayOrders = todayOrdersList.length;
                        todayRevenue = todayOrdersList.reduce((sum: number, order: any) =>
                            sum + (parseFloat(order.total_amount || order.total) || 0), 0);
                    }

                    let totalUsers = 0;
                    let activeUsersCount = 0;
                    if (usersResponse.status === 'fulfilled') {
                        const users = usersResponse.value.data || [];
                        totalUsers = users.length;
                        activeUsersCount = users.filter((user: any) => user.is_active).length;
                    }

                    let totalProducts = 0;
                    if (productsResponse.status === 'fulfilled') {
                        const products = productsResponse.value.data?.data || productsResponse.value.data || [];
                        totalProducts = products.length;
                    }

                    const aggregatedStats = {
                        totalProducts,
                        totalOrders,
                        totalUsers,
                        totalRevenue,
                        todayOrders,
                        todayRevenue,
                        recentOrdersCount: Math.min(totalOrders, 10),
                        activeUsersCount
                    };

                    return {
                        success: true,
                        data: aggregatedStats,
                        message: 'Dashboard statistics aggregated from available endpoints'
                    };
                } catch (fallbackError) {
                    // Return default stats if no endpoints are available
                    return {
                        success: true,
                        data: {
                            totalProducts: 0,
                            totalOrders: 0,
                            totalUsers: 0,
                            totalRevenue: 0,
                            todayOrders: 0,
                            todayRevenue: 0,
                            recentOrdersCount: 0,
                            activeUsersCount: 0
                        },
                        message: 'No dashboard data available - backend endpoints pending'
                    };
                }
            }
            throw error;
        }
    },

    // Get recent orders for dashboard
    getRecentOrders: async (limit: number = 10): Promise<ApiResponse<Order[]>> => {
        try {
            const response = await api.get(`/admin/dashboard/recent-orders?limit=${limit}`);
            return response.data;
        } catch (error: any) {
            // Fallback: get orders and filter for recent ones
            if (error.response?.status === 404) {
                console.warn('Admin recent orders endpoint not available, using orders fallback');
                try {
                    const ordersResponse = await ordersApi.getAllOrders({ limit });

                    if (ordersResponse.success) {
                        // Sort by creation date and take most recent
                        const orders = (ordersResponse.data || [])
                            .sort((a: any, b: any) =>
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, limit);

                        return {
                            success: true,
                            data: orders,
                            message: 'Recent orders retrieved from fallback endpoint'
                        };
                    }
                } catch (fallbackError) {
                    // Return empty array if no orders endpoint available
                    return {
                        success: true,
                        data: [],
                        message: 'No recent orders data available'
                    };
                }
            }
            throw error;
        }
    },

    // Get products statistics
    getProductStats: async (): Promise<ApiResponse<{
        total: number;
        inStock: number;
        outOfStock: number;
        lowStock: number;
    }>> => {
        try {
            const response = await api.get('/admin/dashboard/product-stats');
            return response.data;
        } catch (error: any) {
            // Fallback: calculate from products endpoint
            if (error.response?.status === 404) {
                console.warn('Admin product stats endpoint not available, calculating from products');
                try {
                    const productsResponse = await api.get('/products');
                    const products = productsResponse.data?.data || productsResponse.data || [];

                    const stats = {
                        total: products.length,
                        inStock: products.filter((p: any) => (p.stock_quantity || p.stock) > 0).length,
                        outOfStock: products.filter((p: any) => (p.stock_quantity || p.stock) === 0).length,
                        lowStock: products.filter((p: any) => {
                            const stock = p.stock_quantity || p.stock || 0;
                            return stock > 0 && stock < 10;
                        }).length
                    };

                    return {
                        success: true,
                        data: stats,
                        message: 'Product statistics calculated from available data'
                    };
                } catch (fallbackError) {
                    // Return default stats if no products endpoint available
                    return {
                        success: true,
                        data: {
                            total: 0,
                            inStock: 0,
                            outOfStock: 0,
                            lowStock: 0
                        },
                        message: 'No product data available'
                    };
                }
            }
            throw error;
        }
    },
};

// Shipping API
export const shippingApi = {
    getShippingMethods: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get('/shipping/methods');
        return response.data;
    },

    calculateShipping: async (address: any, items: any[]): Promise<ApiResponse<any>> => {
        const response = await api.post('/shipping/calculate', { address, items });
        return response.data;
    },
};

// Utility functions
export const handleApiError = (error: any) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

export default api;