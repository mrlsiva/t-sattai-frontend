import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Product } from '../types';
import { productsApi } from '../services/api';
import config from '../config';
import '../styles/productDetail.css';

const ProductDetailPage: React.FC = () => {
  console.log('ProductDetailPage component is rendering');
  const { productId } = useParams<{ productId: string }>();
  console.log('Product ID from URL params:', productId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchRelatedProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== FETCHING PRODUCT ===');
      console.log('Product ID:', productId);
      console.log('API Base URL:', config.api.baseURL);
      console.log('Full URL:', `${config.api.baseURL}/products/${productId}`);
      
      const response = await productsApi.getById(parseInt(productId!));
      console.log('Product API response:', response);
      
      if (response.success && response.data) {
        // Handle nested product structure - check if data contains a product property
        const productData = (response.data as any).product || response.data; 
        
        // Validate that we have essential product data
        if (!productData || !productData.id) {
          console.error('Invalid product data structure:', productData);
          setError('Invalid product data received from server');
          return;
        }
        
        setProduct(productData);
        console.log('✅ Product loaded successfully:', productData.name);
      } else {
        console.error('❌ Product not found in response:', response);
        setError('Product not found in database');
      }
    } catch (error: any) {
      console.error('❌ Error fetching product:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Show specific error message if available
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setError('Cannot connect to server. Please check your internet connection or try the local backend.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 404) {
        setError('Product not found. It may have been removed or does not exist.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.message) {
        setError(`Failed to load product: ${error.message}`);
      } else {
        setError('Failed to load product details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      // For now, we'll use a simple approach since we don't have the getRelatedProducts API
      const response = await productsApi.getAll();
      console.log('Related products API response:', response);
      
      if (response.success && response.data) {
        // Handle different response structures
        let products: any = response.data;
        
        // If data is paginated, get the actual products array
        if (products.data && Array.isArray(products.data)) {
          products = products.data;
        }
        
        // Ensure products is an array before filtering
        if (Array.isArray(products)) {
          // Filter out current product and get first 4 products
          const filtered = products.filter((p: Product) => p.id.toString() !== productId).slice(0, 4);
          setRelatedProducts(filtered);
        } else {
          console.warn('Products data is not an array:', products);
          setRelatedProducts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      // Don't set error state for related products, just leave empty
      setRelatedProducts([]);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      await addItem(product, quantity);
      console.log('Product added to cart successfully!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      setError('Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    await handleAddToCart();
    navigate('/cart');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`fas fa-star ${
          index < Math.round(rating) ? 'text-warning' : 'text-muted'
        }`}
        style={{ fontSize: '0.9rem' }}
      />
    ));
  };

  // Helper function to safely get nested values
  const getProductValue = (product: any, ...paths: string[]) => {
    if (!product) return null;
    
    for (const path of paths) {
      const value = path.split('.').reduce((obj, key) => obj?.[key], product);
      
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price || price === null || price === undefined) return '₹0.00';
    
    // Handle different price formats from API
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numericPrice)) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(numericPrice);
  };

  // Get display values using the helper function
  const displayPrice = getProductValue(product, 'price', 'sale_price', 'unit_price') || 0;
  const displaySalePrice = getProductValue(product, 'sale_price', 'discounted_price');
  const displayStock = getProductValue(product, 'stock', 'stock_quantity', 'quantity') || 0;
  const displaySku = getProductValue(product, 'sku', 'code', 'product_code') || 'N/A';
  const displayCategory = getProductValue(product, 'category.name', 'category_name', 'category') || 'N/A';
  const displayCategoryImage = getProductValue(product, 'category.image') || 
    (displayCategory !== 'N/A' ? `${config.images.categoryPlaceholderBase}${displayCategory.charAt(0).toUpperCase()}` : null);
  const displayImage = getProductValue(product, 'images.0', 'image', 'image_url', 'featured_image') || config.images.placeholder;
  const displayName = getProductValue(product, 'name', 'title', 'product_name') || 'Product Name';

  // Debug logging for display values
  if (product) {
    console.log('=== DISPLAY VALUES DEBUG ===');
    console.log('displayName:', displayName);
    console.log('displayPrice:', displayPrice);
    console.log('displayImage:', displayImage);
    console.log('raw product.name:', product.name);
    console.log('raw product.price:', product.price);
    console.log('raw product.image:', (product as any).image);
    console.log('=== END DEBUG ===');
  }

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="mb-5 g-4">
          {/* Image Skeleton */}
          <Col lg={6}>
            <Card className="border shadow-sm rounded-3">
              <Card.Body className="p-0">
                <div className="skeleton-loader rounded-3" style={{ height: '500px' }}></div>
                <div className="p-3 bg-light">
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="skeleton-loader rounded" style={{ width: '80px', height: '80px' }}></div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Product Info Skeleton */}
          <Col lg={6}>
            <div className="skeleton-loader rounded mb-3" style={{ height: '40px', width: '70%' }}></div>
            
            <div className="p-3 bg-light rounded-3 mb-3">
              <div className="skeleton-loader rounded" style={{ height: '20px', width: '40%' }}></div>
            </div>

            <Card className="border shadow-sm mb-4 rounded-3">
              <Card.Body className="p-4">
                <div className="skeleton-loader rounded mb-2" style={{ height: '50px', width: '60%' }}></div>
                <div className="skeleton-loader rounded" style={{ height: '20px', width: '40%' }}></div>
              </Card.Body>
            </Card>

            <div className="mb-4">
              <div className="skeleton-loader rounded" style={{ height: '60px' }}></div>
            </div>

            <div className="mb-4">
              <div className="skeleton-loader rounded" style={{ height: '30px', width: '50%' }}></div>
            </div>

            <Card className="border shadow-sm mb-4 rounded-3">
              <Card.Body className="p-4">
                <div className="skeleton-loader rounded mb-3" style={{ height: '60px' }}></div>
                <div className="skeleton-loader rounded" style={{ height: '50px' }}></div>
              </Card.Body>
            </Card>

            <Row className="g-3 mb-4">
              <Col xs={12} sm={6}>
                <div className="skeleton-loader rounded" style={{ height: '50px' }}></div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="skeleton-loader rounded" style={{ height: '50px' }}></div>
              </Col>
            </Row>

            <Card className="border shadow-sm rounded-3">
              <Card.Body className="p-4">
                <div className="skeleton-loader rounded mb-3" style={{ height: '20px', width: '60%' }}></div>
                <Row className="g-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Col xs={6} key={i}>
                      <div className="skeleton-loader rounded" style={{ height: '40px' }}></div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs Skeleton */}
        <Card className="mb-5 border shadow-sm rounded-3">
          <Card.Body className="p-4">
            <div className="d-flex gap-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-loader rounded" style={{ height: '40px', width: '120px' }}></div>
              ))}
            </div>
            <div className="skeleton-loader rounded mb-2" style={{ height: '20px', width: '80%' }}></div>
            <div className="skeleton-loader rounded mb-2" style={{ height: '20px', width: '90%' }}></div>
            <div className="skeleton-loader rounded" style={{ height: '20px', width: '70%' }}></div>
          </Card.Body>
        </Card>

        {/* Related Products Skeleton */}
        <div className="mb-5">
          <div className="skeleton-loader rounded mb-4" style={{ height: '30px', width: '200px' }}></div>
          <Row className="g-4">
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} lg={3} md={6}>
                <Card className="border shadow-sm rounded-3">
                  <div className="skeleton-loader" style={{ height: '220px' }}></div>
                  <Card.Body className="p-3">
                    <div className="skeleton-loader rounded mb-2" style={{ height: '20px', width: '80%' }}></div>
                    <div className="skeleton-loader rounded mb-2" style={{ height: '15px', width: '50%' }}></div>
                    <div className="skeleton-loader rounded" style={{ height: '30px', width: '60%' }}></div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-5">
        <Card className="border shadow-sm rounded-3 text-center">
          <Card.Body className="p-5">
            <div className="mb-4">
              <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
            </div>
            <h3 className="fw-bold mb-3">Oops! Something went wrong</h3>
            <p className="text-muted mb-4">{error || 'Product not found'}</p>
            
            {error?.includes('Cannot connect') && (
              <Alert variant="info" className="text-start mb-4">
                <strong>💡 Tip:</strong> If you're in development, switch to local backend in your .env file:
                <code className="d-block mt-2 p-2 bg-light rounded">
                  REACT_APP_API_URL=http://127.0.0.1:8000/api
                </code>
              </Alert>
            )}
            
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => {
                  setError(null);
                  fetchProduct();
                }}
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
              <Button 
                variant="outline-primary" 
                size="lg"
                onClick={() => navigate('/products')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Products
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb bg-light rounded-3 p-3 border">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0 text-decoration-none" onClick={() => navigate('/')}>
              <i className="fas fa-home me-1"></i>Home
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0 text-decoration-none" onClick={() => navigate('/products')}>
              Products
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button 
              variant="link" 
              className="p-0 text-decoration-none d-flex align-items-center" 
              onClick={() => navigate(`/products?category=${getProductValue(product, 'category.id') || ''}`)}
            >
              {displayCategoryImage && (
                <img 
                  src={displayCategoryImage} 
                  alt={displayCategory}
                  className="me-1"
                  style={{ width: '16px', height: '16px', objectFit: 'cover', borderRadius: '3px' }}
                />
              )}
              {displayCategory}
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Product Section */}
      <Row className="mb-5 g-4">
        {/* Product Images */}
        <Col lg={6}>
          <Card className="border shadow-sm rounded-3 overflow-hidden" style={{ position: 'sticky', top: '20px' }}>
            <Card.Body className="p-0">
              <div className="position-relative bg-light">
                <img
                  src={product.images?.[selectedImageIndex] || product.images?.[0] || displayImage}
                  alt={product.name}
                  className="img-fluid w-100"
                  style={{ height: '500px', objectFit: 'contain', padding: '20px' }}
                />
                <div className="position-absolute top-0 start-0 m-3 d-flex flex-column gap-2">
                  {product.sale_price && (
                    <Badge 
                      bg="danger" 
                      className="px-3 py-2"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <i className="fas fa-tag me-1"></i>SALE
                    </Badge>
                  )}
                  {product.is_featured && (
                    <Badge 
                      bg="warning" 
                      text="dark"
                      className="px-3 py-2"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <i className="fas fa-star me-1"></i>FEATURED
                    </Badge>
                  )}
                </div>
                {displayStock > 0 && displayStock <= 5 && (
                  <div className="position-absolute top-0 end-0 m-3">
                    <Badge 
                      bg="warning" 
                      text="dark" 
                      className="px-3 py-2"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <i className="fas fa-exclamation-triangle me-1"></i>Only {displayStock} Left!
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="p-3 bg-light">
                  <div className="d-flex gap-2 overflow-auto">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`rounded-3 overflow-hidden ${
                          selectedImageIndex === index ? 'border-3 border-primary' : 'border'
                        }`}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          transform: selectedImageIndex === index ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Product Information */}
        <Col lg={6}>
          <div className="h-100">
            {/* Product Title */}
            <h1 className="display-5 fw-bold mb-3" style={{ color: '#2d3436' }}>{displayName}</h1>
            
            {/* Rating and Reviews */}
            <div className="d-flex align-items-center mb-4 p-3 bg-light rounded-3">
              <div className="me-3">
                {renderStars(parseFloat(getProductValue(product, 'average_rating', 'rating') || '0'))}
              </div>
              <span className="text-muted fs-6">
                <strong>{parseFloat(getProductValue(product, 'average_rating', 'rating') || '0').toFixed(1)}</strong> ({getProductValue(product, 'review_count', 'reviews_count') || 0} review{(getProductValue(product, 'review_count', 'reviews_count') || 0) !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Price Section */}
            <Card className="border shadow-sm mb-4 rounded-3 bg-primary text-white">
              <Card.Body className="p-4">
                {displaySalePrice ? (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <small className="text-white-50 d-block mb-1">Sale Price</small>
                        <h2 className="text-white fw-bold mb-0">
                          {formatPrice(displaySalePrice)}
                        </h2>
                      </div>
                      <Badge bg="danger" className="px-3 py-2">
                        SAVE {formatPrice((parseFloat(displayPrice?.toString() || '0') - parseFloat(displaySalePrice?.toString() || '0')).toString())}
                      </Badge>
                    </div>
                    <p className="text-white-50 text-decoration-line-through mb-0">
                      Regular Price: {formatPrice(displayPrice)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <small className="text-white-50 d-block mb-1">Price</small>
                    <h2 className="text-white fw-bold mb-0">
                      {formatPrice(displayPrice)}
                    </h2>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Short Description */}
            {getProductValue(product, 'short_description', 'description_short') && (
              <div className="mb-4 p-4 bg-light rounded-3">
                <p className="mb-0 text-muted lh-lg">{getProductValue(product, 'short_description', 'description_short')}</p>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2">
                <i className={`fas ${displayStock > 0 ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} fs-5`}></i>
                <span className="fw-bold" style={{ color: displayStock > 0 ? '#00b894' : '#d63031' }}>
                  {displayStock > 0 
                    ? `In Stock (${displayStock} available)` 
                    : 'Out of Stock'
                  }
                </span>
              </div>
            </div>

            {/* Quantity and Actions */}
            {displayStock > 0 && (
              <Card className="border shadow-sm mb-4 rounded-3">
                <Card.Body className="p-4">
                  <Row className="g-3 align-items-end">
                    {/* Quantity Selector */}
                    <Col xs={12} sm={4}>
                      <label htmlFor="quantity" className="form-label fw-semibold text-muted mb-2">
                        <i className="fas fa-sort-numeric-up me-2"></i>Quantity
                      </label>
                      <div className="input-group input-group-lg">
                        <Button
                          variant="outline-primary"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </Button>
                        <input
                          type="number"
                          id="quantity"
                          className="form-control text-center fw-bold"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(displayStock, parseInt(e.target.value) || 1)))}
                          min="1"
                          max={displayStock}
                          style={{ maxWidth: '100px' }}
                        />
                        <Button
                          variant="outline-primary"
                          onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                          disabled={quantity >= displayStock}
                        >
                          <i className="fas fa-plus"></i>
                        </Button>
                      </div>
                    </Col>
                    
                    {/* Add to Cart Button */}
                    <Col xs={12} sm={8}>
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-100 fw-bold"
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        style={{ padding: '12px' }}
                      >
                        {addingToCart ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Adding to Cart...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-shopping-cart me-2"></i>
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Action Buttons Row */}
            <Row className="g-3 mb-4">
              {displayStock > 0 && (
                <Col xs={12} sm={6}>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-100 fw-bold"
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                  >
                    <i className="fas fa-bolt me-2"></i>
                    Buy Now
                  </Button>
                </Col>
              )}
              
              <Col xs={12} sm={displayStock > 0 ? 6 : 12}>
                <Button
                  variant={isInWishlist(product.id) ? "danger" : "outline-danger"}
                  size="lg"
                  className="w-100 fw-bold"
                  onClick={handleWishlistToggle}
                >
                  <i className={`fas fa-heart me-2`}></i>
                  {isInWishlist(product.id) ? 'In Wishlist' : 'Add to Wishlist'}
                </Button>
              </Col>
            </Row>

            {/* Product Meta Information */}
            <Card className="border shadow-sm rounded-3">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3 text-muted">
                  <i className="fas fa-info-circle me-2"></i>Product Information
                </h6>
                <Row className="g-3">
                  <Col xs={6}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-barcode text-primary me-2"></i>
                      <div>
                        <small className="text-muted d-block">SKU</small>
                        <strong>{displaySku}</strong>
                      </div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-layer-group text-success me-2"></i>
                      <div>
                        <small className="text-muted d-block">Category</small>
                        <strong className="d-flex align-items-center">
                          {displayCategoryImage && (
                            <img 
                              src={displayCategoryImage} 
                              alt={displayCategory}
                              className="me-1"
                              style={{ width: '16px', height: '16px', objectFit: 'cover', borderRadius: '2px' }}
                            />
                          )}
                          {displayCategory}
                        </strong>
                      </div>
                    </div>
                  </Col>
                  {getProductValue(product, 'brand') && (
                    <Col xs={6}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-copyright text-info me-2"></i>
                        <div>
                          <small className="text-muted d-block">Brand</small>
                          <strong>{getProductValue(product, 'brand')}</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  {getProductValue(product, 'weight') && (
                    <Col xs={6}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-weight-hanging text-warning me-2"></i>
                        <div>
                          <small className="text-muted d-block">Weight</small>
                          <strong>{getProductValue(product, 'weight')}</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
                
                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-4 pt-3 border-top">
                    <small className="text-muted d-block mb-2">
                      <i className="fas fa-tags me-1"></i>Tags
                    </small>
                    <div className="d-flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          bg="light" 
                          text="dark" 
                          className="px-3 py-2 rounded-pill"
                          style={{ fontSize: '0.85rem' }}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Product Details Tabs */}
      <Card className="mb-5 border shadow-sm rounded-3">
        <Card.Body className="p-4">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'description')}
            className="mb-4 nav-pills"
            variant="pills"
          >
            <Tab 
              eventKey="description" 
              title={
                <span>
                  <i className="fas fa-align-left me-2"></i>Description
                </span>
              }
            >
              <div className="py-3">
                <h4 className="fw-bold mb-4" style={{ color: '#2d3436' }}>
                  <i className="fas fa-file-alt text-primary me-2"></i>
                  Product Description
                </h4>
                <p className="text-muted lh-lg fs-6">
                  {getProductValue(product, 'description', 'long_description') || 'No description available for this product.'}
                </p>
              </div>
            </Tab>

            <Tab 
              eventKey="specifications" 
              title={
                <span>
                  <i className="fas fa-list-ul me-2"></i>Specifications
                </span>
              }
            >
              <div className="py-3">
                <h4 className="fw-bold mb-4" style={{ color: '#2d3436' }}>
                  <i className="fas fa-cogs text-primary me-2"></i>
                  Technical Specifications
                </h4>
                {getProductValue(product, 'specifications') && Object.keys(getProductValue(product, 'specifications')).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <tbody>
                        {Object.entries(getProductValue(product, 'specifications')).map(([key, value], index) => (
                          <tr key={key} className={index % 2 === 0 ? 'bg-light' : ''}>
                            <td className="fw-semibold py-3" style={{ width: '35%', color: '#636e72' }}>
                              <i className="fas fa-check-circle text-success me-2"></i>
                              {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                            </td>
                            <td className="py-3" style={{ color: '#2d3436' }}>{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No specifications available for this product.</p>
                  </div>
                )}
              </div>
            </Tab>

            <Tab 
              eventKey="reviews" 
              title={
                <span>
                  <i className="fas fa-star me-2"></i>Reviews ({product.review_count || 0})
                </span>
              }
            >
              <div className="py-3">
                <h4 className="fw-bold mb-4" style={{ color: '#2d3436' }}>
                  <i className="fas fa-comments text-primary me-2"></i>
                  Customer Reviews
                </h4>
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="fas fa-comments fa-4x text-primary mb-3" style={{ opacity: 0.3 }}></i>
                  </div>
                  <h5 className="fw-bold mb-3">Reviews Coming Soon!</h5>
                  <p className="text-muted">We're working on bringing you customer reviews and ratings.</p>
                  <Button variant="outline-primary" className="rounded-pill px-4">
                    <i className="fas fa-bell me-2"></i>Notify Me
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab 
              eventKey="shipping" 
              title={
                <span>
                  <i className="fas fa-shipping-fast me-2"></i>Shipping
                </span>
              }
            >
              <div className="py-3">
                <h4 className="fw-bold mb-4" style={{ color: '#2d3436' }}>
                  <i className="fas fa-truck text-primary me-2"></i>
                  Shipping & Returns
                </h4>
                <Row className="g-4">
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-primary text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-start">
                          <div className="bg-white bg-opacity-25 rounded-circle p-3 me-3">
                            <i className="fas fa-shipping-fast fs-4"></i>
                          </div>
                          <div>
                            <h5 className="fw-bold mb-2">Fast Shipping</h5>
                            <p className="mb-0">Free shipping on orders over ₹2000. Standard delivery in 3-5 business days across India.</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-success text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-start">
                          <div className="bg-white bg-opacity-25 rounded-circle p-3 me-3">
                            <i className="fas fa-undo fs-4"></i>
                          </div>
                          <div>
                            <h5 className="fw-bold mb-2">Easy Returns</h5>
                            <p className="mb-0">30-day hassle-free return policy. Items must be in original condition with tags.</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-info text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-start">
                          <div className="bg-white bg-opacity-25 rounded-circle p-3 me-3">
                            <i className="fas fa-shield-alt fs-4"></i>
                          </div>
                          <div>
                            <h5 className="fw-bold mb-2">Secure Payment</h5>
                            <p className="mb-0">Your payment information is encrypted and processed securely via Stripe.</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-dark text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-start">
                          <div className="bg-white bg-opacity-25 rounded-circle p-3 me-3">
                            <i className="fas fa-headset fs-4"></i>
                          </div>
                          <div>
                            <h5 className="fw-bold mb-2">24/7 Support</h5>
                            <p className="mb-0">Our customer support team is available round the clock via email and chat.</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h3 className="fw-bold mb-1" style={{ color: '#2d3436' }}>
                <i className="fas fa-th-large text-primary me-2"></i>
                You May Also Like
              </h3>
              <p className="text-muted mb-0">Discover similar products</p>
            </div>
            <Button 
              variant="outline-primary" 
              className="rounded-pill"
              onClick={() => navigate('/products')}
            >
              View All <i className="fas fa-arrow-right ms-2"></i>
            </Button>
          </div>
          <Row className="g-4">
            {relatedProducts.slice(0, 4).map((relatedProduct) => (
              <Col key={relatedProduct.id} lg={3} md={6} sm={6} xs={12}>
                <Card 
                  className="h-100 border shadow-sm product-card rounded-3 overflow-hidden"
                  style={{ 
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="position-relative" style={{ overflow: 'hidden' }}>
                    <div 
                      className="bg-light"
                      style={{ 
                        height: '220px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/products/${relatedProduct.id}`)}
                    >
                      <Card.Img
                        variant="top"
                        src={relatedProduct.images?.[0] || '/api/placeholder/300/200'}
                        alt={relatedProduct.name}
                        style={{ 
                          height: '200px', 
                          width: '100%',
                          objectFit: 'contain',
                          padding: '10px'
                        }}
                      />
                    </div>
                    {relatedProduct.sale_price && (
                      <Badge 
                        bg="danger" 
                        className="position-absolute top-0 start-0 m-2 px-2 py-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <i className="fas fa-tag me-1"></i>SALE
                      </Badge>
                    )}
                    {relatedProduct.is_featured && (
                      <Badge 
                        bg="warning" 
                        text="dark"
                        className="position-absolute top-0 end-0 m-2 px-2 py-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <i className="fas fa-star me-1"></i>
                      </Badge>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column p-3">
                    <h6 
                      className="card-title mb-2 fw-bold" 
                      title={relatedProduct.name}
                      style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#2d3436'
                      }}
                    >
                      {relatedProduct.name}
                    </h6>
                    <div className="mb-2">
                      <div className="d-flex align-items-center">
                        {renderStars(parseFloat(relatedProduct.average_rating || '0'))}
                        <small className="text-muted ms-2">
                          ({relatedProduct.review_count || 0})
                        </small>
                      </div>
                    </div>
                    <div className="mt-auto">
                      {relatedProduct.sale_price ? (
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="fw-bold text-danger fs-5">
                              {formatPrice(relatedProduct.sale_price)}
                            </div>
                            <small className="text-muted text-decoration-line-through">
                              {formatPrice(relatedProduct.price)}
                            </small>
                          </div>
                          <Badge bg="success" className="px-2 py-1">
                            Save ₹{(parseFloat(relatedProduct.price) - parseFloat(relatedProduct.sale_price)).toFixed(0)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="fw-bold text-primary fs-5">
                          {formatPrice(relatedProduct.price)}
                        </div>
                      )}
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-transparent border-0 p-3 pt-0">
                    <Button
                      variant="outline-primary"
                      className="w-100 fw-semibold"
                      onClick={() => navigate(`/products/${relatedProduct.id}`)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      View Details
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
};

export default ProductDetailPage;