// Types for the e-commerce application

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    is_admin: boolean;
    is_active: boolean;
    last_login_at?: string;
    preferences?: Record<string, any>;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    short_description?: string;
    price: string;
    sale_price?: string;
    sku: string;
    stock: number;
    images: string[];
    category: Category;
    brand?: string;
    weight?: string;
    specifications?: Record<string, string>;
    features?: string[];
    tags?: string[];
    is_active: boolean;
    is_featured: boolean;
    average_rating: string;
    review_count: number;
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent_id?: number;
    sort_order: number;
    is_active: boolean;
    meta_title?: string;
    meta_description?: string;
    children?: Category[];
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    selectedVariant?: ProductVariant;
}

export interface ProductVariant {
    id: string;
    name: string;
    value: string;
    priceModifier: number;
}

export interface Order {
    id: string;
    user: User;
    items: OrderItem[];
    shippingAddress: Address;
    billingAddress: Address;
    paymentMethod: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    total: number;
    couponCode?: string;
    trackingNumber?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    product: Product;
    quantity: number;
    price: number;
    variant?: ProductVariant;
}

export interface Review {
    id: string;
    user: User;
    product: Product;
    rating: number;
    title: string;
    content: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: string;
}

export interface Wishlist {
    id: string;
    user: User;
    products: Product[];
    createdAt: string;
    updatedAt: string;
}

export interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxDiscount?: number;
    expiryDate: string;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
}

export interface ShippingMethod {
    id: string;
    name: string;
    description: string;
    cost: number;
    estimatedDays: number;
    isActive: boolean;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';
    isActive: boolean;
    processingFee?: number;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

// Context Types
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: RegisterData) => Promise<void>;
    updateProfile: (userData: Partial<User>) => Promise<void>;
    loading: boolean;
}

export interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
    removeItem: (itemId: string | number) => void;
    updateQuantity: (itemId: string | number, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

export interface WishlistContextType {
    items: Product[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
    clearWishlist: () => void;
}

// Form Types
export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
}

export interface LoginData {
    email: string;
    password: string;
    remember?: boolean;
}

export interface CheckoutData {
    shippingAddress: Omit<Address, 'id'>;
    billingAddress: Omit<Address, 'id'>;
    paymentMethod: string;
    shippingMethod: string;
    couponCode?: string;
}

// Filter Types
export interface ProductFilters {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    search?: string;
    sortBy?: 'name' | 'price' | 'rating' | 'newest' | 'popular';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}