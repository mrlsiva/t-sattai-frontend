import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Product, Category } from '../types';
import api from '../utils/api';
import { resolveCategoryImage } from '../utils/imageHelpers';
import SearchFilters from '../components/Search/SearchFilters';
import WishlistButton from '../components/Wishlist/WishlistButton';
import '../styles/productDetail.css';

const ProductListPage: React.FC = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      
      // Use mock data when backend is not available
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.log('Backend not available, using mock categories');
        const mockCategories: Category[] = [
          { 
            id: 1, 
            name: 'Electronics', 
            slug: 'electronics', 
            sort_order: 1, 
            is_active: true, 
            created_at: '2023-01-01T00:00:00Z', 
            updated_at: '2023-01-01T00:00:00Z' 
          },
          { 
            id: 2, 
            name: 'Clothing', 
            slug: 'clothing', 
            sort_order: 2, 
            is_active: true, 
            created_at: '2023-01-01T00:00:00Z', 
            updated_at: '2023-01-01T00:00:00Z' 
          },
          { 
            id: 3, 
            name: 'Books', 
            slug: 'books', 
            sort_order: 3, 
            is_active: true, 
            created_at: '2023-01-01T00:00:00Z', 
            updated_at: '2023-01-01T00:00:00Z' 
          }
        ];
        setCategories(mockCategories);
      } else {
        setCategories([]);
      }
    }
  }, []);

  const fetchProducts = useCallback(async (filters: any, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log('ProductListPage: Fetching products with filters:', filters, 'page:', page);
      
      // Try the regular products API first (this includes filtering and pagination)
      try {
        console.log('ProductListPage: Trying regular products API...');
        const params = new URLSearchParams();
        
        // Add filters to params
        Object.entries(filters).forEach(([key, value]: [string, any]) => {
          if (value && value !== '') {
            params.append(key, value.toString());
          }
        });
        
        params.append('page', page.toString());
        params.append('per_page', '12');

        const response = await api.get(`/products?${params.toString()}`);
        console.log('ProductListPage: Products API response:', response.data);
        
        if (response.data?.success) {
          const productsData = response.data.data?.data || response.data.data || [];
          console.log('ProductListPage: Successfully loaded from products API:', productsData.length);
          setProducts(Array.isArray(productsData) ? productsData : []);
          
          // Handle pagination data
          const pagination = response.data.data;
          if (pagination && typeof pagination === 'object' && 'current_page' in pagination) {
            setTotalPages(pagination.last_page || 1);
            setTotalProducts(pagination.total || productsData.length);
          } else {
            setTotalPages(1);
            setTotalProducts(productsData.length);
          }
          return; // Exit early if API works
        }
      } catch (productsApiError) {
        console.log('ProductListPage: Regular products API failed, trying featured products API...');
        
        // Fallback to featured products API
        try {
          console.log('ProductListPage: Trying featured products API...');
          const response = await api.get('/products/featured');
          
          if (response.data?.success && response.data?.data) {
            console.log('ProductListPage: Successfully loaded from featured API:', response.data.data.length);
            const productsData = response.data.data || [];
            setProducts(Array.isArray(productsData) ? productsData : []);
            setTotalPages(1);
            setTotalProducts(productsData.length);
            return; // Exit early if API works
          }
        } catch (featuredApiError) {
          console.log('ProductListPage: Featured products API also failed');
        }
      }
      
      // If both APIs fail, set empty products array
      console.log('ProductListPage: Both APIs failed, setting empty products');
      setProducts([]);
      setTotalPages(1);
      setTotalProducts(0);
      
    } catch (error: any) {
      console.error('ProductListPage: Error fetching products:', error);
      setProducts([]);
      setError(error.response?.data?.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchProducts(filters, 1);
  }, [fetchProducts]);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      // Convert to the expected Product format for cart
      const cartProduct = {
        id: product.id,
        name: product.name,
        slug: product.name.toLowerCase().replace(/\s+/g, '-'),
        description: product.description,
        short_description: product.description.substring(0, 100),
        price: product.price.toString(),
        sale_price: undefined,
        sku: `SKU-${product.id}`,
        stock: product.stock,
        images: product.images,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.name.toLowerCase().replace(/\s+/g, '-'),
          sort_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        brand: undefined,
        weight: undefined,
        specifications: {},
        features: [],
        tags: [],
        is_active: true,
        is_featured: false,
        average_rating: product.average_rating.toString(),
        review_count: product.review_count,
        meta_title: undefined,
        meta_description: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await addItem(cartProduct, 1);
      alert('Product added to cart!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Error adding product to cart');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`fas fa-star ${
          index < Math.round(rating) ? 'text-warning' : 'text-muted'
        }`}
      />
    ));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Get current filters from URL or use empty object
    const currentFilters = Object.fromEntries(new URLSearchParams(window.location.search));
    console.log('Page change - current filters from URL:', currentFilters);
    fetchProducts(currentFilters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    // Load initial products when component mounts, using URL parameters
    const initialFilters = Object.fromEntries(new URLSearchParams(window.location.search));
    console.log('Initial filters from URL:', initialFilters);
    
    // Call fetchProducts with the filters
    fetchProducts(initialFilters, 1);
  }, [fetchProducts]); // Include fetchProducts in dependency array

  // Debug: Log products state before render
  console.log('Rendering ProductListPage with products:', products, 'length:', products.length, 'loading:', loading, 'error:', error);

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Sidebar Filters */}
        <div className="col-lg-3 mb-4">
          <SearchFilters
            onFiltersChange={handleFiltersChange}
            categories={categories}
            loading={loading}
          />
        </div>

        {/* Products List */}
        <div className="col-lg-9">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Products</h2>
            <div className="text-muted">
              {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
            </div>
          </div>

          {loading ? (
            <div className="row g-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="col-lg-4 col-md-6">
                  <div className="card border shadow-sm rounded-3 h-100">
                    <div className="skeleton-loader" style={{ height: '250px' }}></div>
                    <div className="card-body">
                      <div className="skeleton-loader rounded mb-2" style={{ height: '20px', width: '80%' }}></div>
                      <div className="skeleton-loader rounded mb-2" style={{ height: '15px', width: '60%' }}></div>
                      <div className="skeleton-loader rounded mb-3" style={{ height: '15px', width: '40%' }}></div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="skeleton-loader rounded" style={{ height: '25px', width: '50px' }}></div>
                        <div className="skeleton-loader rounded" style={{ height: '20px', width: '80px' }}></div>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
                      <div className="skeleton-loader rounded" style={{ height: '38px' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => fetchProducts({}, 1)}
              >
                Retry
              </button>
            </div>
          ) : !Array.isArray(products) || products.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4>No products found</h4>
              <p className="text-muted">Try adjusting your search criteria</p>
              <div className="small text-muted mt-2">
                Debug: products.length = {products.length}, 
                isArray = {Array.isArray(products).toString()},
                products = {JSON.stringify(products).substring(0, 100)}...
              </div>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="row">
                {Array.isArray(products) && products.map((product) => (
                  <div key={product.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="position-relative">
                        <img
                          src={product.images[0] || '/placeholder-image.svg'}
                          className="card-img-top"
                          alt={product.name}
                          style={{ height: '250px', objectFit: 'cover' }}
                        />
                        <div className="position-absolute top-0 end-0 m-2">
                          <WishlistButton 
                            productId={product.id} 
                            className="btn-sm"
                            showText={false}
                          />
                        </div>
                      </div>
                      
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{product.name}</h5>
                        <p className="card-text text-muted small mb-2 d-flex align-items-center gap-1">
                          {resolveCategoryImage(product.category.image, product.category.display_image) ? (
                            <img
                              src={resolveCategoryImage(product.category.image, product.category.display_image)!}
                              alt={product.category.name}
                              style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '3px' }}
                            />
                          ) : (
                            <i className="bi bi-tag" style={{ fontSize: '14px' }}></i>
                          )}
                          {product.category.name}
                        </p>
                        <p className="card-text flex-grow-1">
                          {product.description.length > 100 
                            ? `${product.description.substring(0, 100)}...` 
                            : product.description
                          }
                        </p>
                        
                        <div className="mb-2">
                          {renderStars(parseFloat(product.average_rating))}
                          <small className="text-muted ms-2">
                            ({product.review_count})
                          </small>
                        </div>
                        
                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="h5 mb-0 text-primary">
                              ₹{product.price}
                            </span>
                            <small className="text-muted">
                              {product.stock > 0 ? (
                                <span className="text-success">
                                  <i className="fas fa-check me-1"></i>
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-danger">
                                  <i className="fas fa-times me-1"></i>
                                  Out of Stock
                                </span>
                              )}
                            </small>
                          </div>
                          
                          <div className="d-grid gap-2">
                            <Link
                              to={`/products/${product.id}`}
                              className="btn btn-outline-primary btn-sm"
                            >
                              View Details
                            </Link>
                            {product.stock > 0 && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddToCart(product)}
                              >
                                <i className="fas fa-shopping-cart me-1"></i>
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Products pagination" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: totalPages }, (_, index) => {
                      const page = index + 1;
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 2 && page <= currentPage + 2);

                      if (!showPage) {
                        if (page === currentPage - 3 || page === currentPage + 3) {
                          return (
                            <li key={page} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          );
                        }
                        return null;
                      }

                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;