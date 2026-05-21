import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components (temporarily simplified)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import DebugDashboard from './components/DebugDashboard';

// Import pages (temporarily simplified)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';
import UserDashboard from './pages/UserDashboard';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Temporary placeholder component for missing pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="container py-5">
    <div className="row">
      <div className="col">
        <h1>{title}</h1>
        <p>This page is under development.</p>
      </div>
    </div>
  </div>
);

function App() {
  const [showDebugDashboard, setShowDebugDashboard] = useState(false);

  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
          <Router>
            <div className="App">
              <ScrollToTop />
              
              <Routes>
                {/* Admin Routes - No common header/footer */}
                <Route 
                  path="/admin/*" 
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  } 
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="profile" element={<AdminProfile />} />
                </Route>
                
                {/* All other routes with common header/footer */}
                <Route path="*" element={
                  <>
                    <Navbar />
                    <main className="main-content">
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/products" element={<ProductListPage />} />
                        <Route path="/products/category/:categoryId" element={<ProductListPage />} />
                        <Route path="/products/:productId" element={<ProductDetailPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        
                        {/* Protected Routes */}
                        <Route 
                          path="/checkout" 
                          element={
                            <ProtectedRoute>
                              <CheckoutPage />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/order-success/:orderNumber" 
                          element={
                            <ProtectedRoute>
                              <OrderSuccessPage />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/order-confirmation" 
                          element={
                            <ProtectedRoute>
                              <OrderConfirmationPage />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/dashboard/*" 
                          element={
                            <ProtectedRoute>
                              <UserDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/wishlist" 
                          element={
                            <ProtectedRoute>
                              <WishlistPage />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* 404 Route */}
                        <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                } />
              </Routes>

              {/* Debug Dashboard - Only in development */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <button
                    className="btn btn-warning position-fixed"
                    style={{
                      bottom: '20px',
                      right: '20px',
                      zIndex: 1050,
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}
                    onClick={() => setShowDebugDashboard(true)}
                    title="Open Debug Dashboard"
                  >
                    <i className="bi bi-bug" style={{ fontSize: '1.5rem' }}></i>
                  </button>
                  
                  <DebugDashboard 
                    show={showDebugDashboard} 
                    onHide={() => setShowDebugDashboard(false)} 
                  />
                </>
              )}
            </div>
          </Router>
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
