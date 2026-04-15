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
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('mock_user_data');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Error handler utility
export const handleApiError = (error: any): string => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

// Authentication API
export const authApi = {
    async login(loginData: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
        try {
            const response = await api.post('/auth/login', loginData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async register(registerData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
        try {
            const response = await api.post('/auth/register', registerData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async logout(): Promise<ApiResponse<null>> {
        try {
            const response = await api.post('/auth/logout');
            return response.data;
        } catch (error) {
            // Even if API fails, logout locally
            return {
                success: true,
                message: 'Logged out successfully'
            };
        }
    },

    async getProfile(): Promise<ApiResponse<User>> {
        try {
            const response = await api.get('/auth/profile');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await api.put('/auth/profile', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
        try {
            const response = await api.put('/auth/password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Products API
export const productsApi = {
    async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
        try {
            const response = await api.get('/products', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
        try {
            const response = await api.get('/products', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getById(id: number): Promise<ApiResponse<Product>> {
        try {
            const response = await api.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getProduct(id: number): Promise<ApiResponse<Product>> {
        try {
            const response = await api.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getBySlug(slug: string): Promise<ApiResponse<Product>> {
        try {
            const response = await api.get(`/products/slug/${slug}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getFeatured(): Promise<ApiResponse<Product[]>> {
        try {
            const response = await api.get('/products/featured');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
        try {
            const response = await api.get('/products/featured');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async search(query: string, filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
        try {
            const response = await api.get('/products/search', {
                params: { query, ...filters }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Categories API
export const categoriesApi = {
    async getAll(): Promise<ApiResponse<Category[]>> {
        try {
            const response = await api.get('/categories');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getCategories(): Promise<ApiResponse<Category[]>> {
        try {
            const response = await api.get('/categories');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getById(id: number): Promise<ApiResponse<Category>> {
        try {
            const response = await api.get(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getBySlug(slug: string): Promise<ApiResponse<Category>> {
        try {
            const response = await api.get(`/categories/slug/${slug}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Orders API
export const ordersApi = {
    async getAll(filters?: any): Promise<ApiResponse<Order[]>> {
        try {
            const response = await api.get('/orders', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getAllOrders(filters?: any): Promise<ApiResponse<Order[]>> {
        try {
            const response = await api.get('/admin/orders', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getOrderStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/orders/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.put(`/admin/orders/${orderId}/status`, { status });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getById(id: string): Promise<ApiResponse<Order>> {
        try {
            const response = await api.get(`/orders/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async create(orderData: CheckoutData): Promise<ApiResponse<Order>> {
        try {
            const response = await api.post('/orders', orderData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async cancel(id: string): Promise<ApiResponse<Order>> {
        try {
            const response = await api.put(`/orders/${id}/cancel`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Reviews API
export const reviewsApi = {
    async getByProduct(productId: number): Promise<ApiResponse<Review[]>> {
        try {
            const response = await api.get(`/products/${productId}/reviews`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async create(productId: number, reviewData: Partial<Review>): Promise<ApiResponse<Review>> {
        try {
            const response = await api.post(`/products/${productId}/reviews`, reviewData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async update(id: string, reviewData: Partial<Review>): Promise<ApiResponse<Review>> {
        try {
            const response = await api.put(`/reviews/${id}`, reviewData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        try {
            const response = await api.delete(`/reviews/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Cart API
export const cartApi = {
    async getCart(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/cart');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async addToCart(productId: number, quantity: number): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/cart/add', { product_id: productId, quantity });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async removeFromCart(itemId: number): Promise<ApiResponse<any>> {
        try {
            const response = await api.delete(`/cart/remove/${itemId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateCartItem(itemId: number, quantity: number): Promise<ApiResponse<any>> {
        try {
            const response = await api.put(`/cart/update/${itemId}`, { quantity });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async clearCart(): Promise<ApiResponse<any>> {
        try {
            const response = await api.delete('/cart/clear');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Payment API
export const paymentApi = {
    async createPaymentIntent(paymentData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/payments/create-intent', paymentData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async createPaymentIntentSimple(paymentData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/payments/create-intent-simple', paymentData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async confirmPayment(paymentIntentId: string, shippingAddress: any, cartItems?: any[]): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/payments/confirm', {
                payment_intent_id: paymentIntentId,
                shipping_address: shippingAddress,
                ...(cartItems && cartItems.length > 0 ? { cart_items: cartItems } : {}),
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Checkout API for dynamic calculations
export const checkoutApi = {
    async calculateTotals(data: {
        shipping_address?: any;
        shipping_method?: string;
        cart_items?: any[];
    }): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/checkout/calculate-totals', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getShippingMethods(shippingAddress?: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/checkout/shipping-methods', {
                shipping_address: shippingAddress
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getTaxRates(address: {
        country: string;
        state?: string;
        city?: string;
        postal_code?: string;
    }): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/checkout/tax-rates', address);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Address API
export const addressApi = {
    async getAddresses(): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get('/addresses');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getUserAddresses(): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get('/user/addresses');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getAddressById(id: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.get(`/user/addresses/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getAddressesByType(type: 'shipping' | 'billing' | 'both'): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get(`/user/addresses/type/${type}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async createAddress(addressData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/addresses', addressData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async addUserAddress(addressData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/user/addresses', addressData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateAddress(id: string, addressData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.put(`/user/addresses/${id}`, addressData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteAddress(id: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.delete(`/user/addresses/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async setAddressAsDefault(id: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.put(`/user/addresses/${id}/default`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Admin APIs
export const adminDashboardApi = {
    async getStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/dashboard/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getDashboardStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/dashboard/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getProductStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/dashboard/product-stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getRecentOrders(limit?: number): Promise<ApiResponse<any[]>> {
        try {
            const params = limit ? { limit } : {};
            const response = await api.get('/admin/dashboard/recent-orders', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getTopProducts(): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get('/admin/dashboard/top-products');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export const adminProfileApi = {
    async getProfile(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/profile');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getAdminProfile(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/profile');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateProfile(profileData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.put('/admin/profile', profileData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateAdminProfile(profileData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.put('/admin/profile', profileData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updatePassword(passwordData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.put('/admin/profile/password', passwordData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async changePassword(passwordData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.put('/admin/profile/password', passwordData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateSettings(settingsData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.put('/admin/profile/settings', settingsData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateNotifications(notificationData: any): Promise<ApiResponse<any>> {
        try {
            const response = await api.put('/admin/profile/notifications', notificationData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async uploadAvatar(formData: FormData): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/admin/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteAccount(password: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.delete('/admin/profile', {
                data: { password }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getActivityLog(): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get('/admin/profile/activity');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async exportData(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/profile/export');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export const adminUsersApi = {
    async getUsers(filters?: any): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get('/admin/users', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getAllUsers(filters?: any): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get('/admin/users', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getUserStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/admin/users/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateUserStatus(userId: number, status: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.put(`/admin/users/${userId}/status`, { status });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateUserRole(userId: number, role: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.put(`/admin/users/${userId}/role`, { role });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteUser(userId: number): Promise<ApiResponse<any>> {
        try {
            const response = await api.delete(`/admin/users/${userId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default api;