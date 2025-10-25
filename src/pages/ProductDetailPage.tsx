import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Product } from '../types';
import { productsApi } from '../services/api';
import config from '../config';

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
      console.log('Fetching product with ID:', productId);
      const response = await productsApi.getById(parseInt(productId!));
      console.log('Product API response:', response);
      
      if (response.success && response.data) {
        // Handle nested product structure - check if data contains a product property
        const productData = (response.data as any).product || response.data; 
        setProduct(productData);
        console.log('Product set successfully:', productData);
        console.log('Product price:', productData.price);
        console.log('Product name:', productData.name);
        console.log('Product category:', productData.category);
        console.log('Product stock:', productData.stock);
        console.log('Product images:', productData.images);
        console.log('Product sku:', productData.sku);
        console.log('All product keys:', Object.keys(productData));
      } else {
        setError('Product not found');
        console.log('Product not found in response');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setError('Failed to load product details');
      // Don't navigate on error, just show error in UI instead
      // if (error.response?.status === 404) {
      //   navigate('/products');
      // }
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
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading product details...</div>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h4>Oops! Something went wrong</h4>
          <p>{error || 'Product not found'}</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            <i className="fas fa-arrow-left me-2"></i>
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
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
                  style={{ width: '14px', height: '14px', objectFit: 'cover', borderRadius: '2px' }}
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
      <Row className="mb-5">
        {/* Product Images */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="position-relative">
                <img
                  src={product.images?.[selectedImageIndex] || product.images?.[0] || displayImage}
                  alt={product.name}
                  className="img-fluid w-100 rounded"
                  style={{ height: '500px', objectFit: 'cover' }}
                />
                {product.sale_price && (
                  <Badge 
                    bg="danger" 
                    className="position-absolute top-0 start-0 m-3 fs-6"
                  >
                    Sale!
                  </Badge>
                )}
                {product.is_featured && (
                  <Badge 
                    bg="warning" 
                    text="dark"
                    className="position-absolute top-0 end-0 m-3 fs-6"
                  >
                    Featured
                  </Badge>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="d-flex gap-2 p-3 overflow-auto">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className={`border rounded cursor-pointer ${
                        selectedImageIndex === index ? 'border-primary' : ''
                      }`}
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Product Information */}
        <Col lg={6}>
          <div className="h-100">
            <h1 className="h2 mb-3">{displayName}</h1>
            
            {/* Rating */}
            <div className="d-flex align-items-center mb-3">
              <div className="me-2">
                {renderStars(parseFloat(getProductValue(product, 'average_rating', 'rating') || '0'))}
              </div>
              <span className="text-muted">
                ({getProductValue(product, 'review_count', 'reviews_count') || 0} review{(getProductValue(product, 'review_count', 'reviews_count') || 0) !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Price */}
            <div className="mb-3">
              {displaySalePrice ? (
                <div>
                  <h3 className="text-danger mb-1">
                    {formatPrice(displaySalePrice)}
                  </h3>
                  <p className="text-muted text-decoration-line-through mb-0">
                    {formatPrice(displayPrice)}
                  </p>
                  <small className="text-success">
                    Save {formatPrice((parseFloat(displayPrice?.toString() || '0') - parseFloat(displaySalePrice?.toString() || '0')).toString())}
                  </small>
                </div>
              ) : (
                <h3 className="text-primary mb-0">
                  {formatPrice(displayPrice)}
                </h3>
              )}
            </div>

            {/* Short Description */}
            {getProductValue(product, 'short_description', 'description_short') && (
              <p className="text-muted mb-4">{getProductValue(product, 'short_description', 'description_short')}</p>
            )}

            {/* Stock Status */}
            <div className="mb-4">
              <Badge 
                bg={displayStock > 0 ? 'success' : 'danger'}
                className="fs-6 p-2"
              >
                {displayStock > 0 
                  ? `${displayStock} in stock` 
                  : 'Out of stock'
                }
              </Badge>
              {displayStock > 0 && displayStock <= 5 && (
                <Badge bg="warning" text="dark" className="ms-2 fs-6 p-2">
                  Low Stock
                </Badge>
              )}
            </div>
            </div>

            {/* Quantity and Actions */}
            {displayStock > 0 && (
              <div className="mb-4">
                <Row className="g-3">
                  {/* Quantity Selector */}
                  <Col xs={12} sm={6} md={4}>
                    <label htmlFor="quantity" className="form-label fw-semibold">
                      Quantity:
                    </label>
                    <div className="input-group">
                      <Button
                        variant="outline-secondary"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <i className="fas fa-minus"></i>
                      </Button>
                      <input
                        type="number"
                        id="quantity"
                        className="form-control text-center"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(displayStock, parseInt(e.target.value) || 1)))}
                        min="1"
                        max={displayStock}
                        style={{ maxWidth: '80px' }}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                        disabled={quantity >= displayStock}
                      >
                        <i className="fas fa-plus"></i>
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-grid gap-2 d-md-flex mb-4">
              {displayStock > 0 && (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-fill"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
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
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shopping-cart me-2"></i>
                        Add to Cart
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="success"
                    size="lg"
                    className="flex-fill"
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                  >
                    <i className="fas fa-bolt me-2"></i>
                    Buy Now
                  </Button>
                </>
              )}
              
              <Button
                variant={isInWishlist(product.id) ? "danger" : "outline-danger"}
                size="lg"
                onClick={handleWishlistToggle}
              >
                <i className={`fas fa-heart me-2`}></i>
                {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>

            {/* Product Meta */}
            <div className="border-top pt-3">
              <Row className="text-muted small">
                <Col xs={6}>
                  <div className="mb-2">
                    <strong>SKU:</strong> {displaySku}
                  </div>
                  <div className="mb-2">
                    <strong>Category:</strong> 
                    <span className="ms-1">
                      {displayCategoryImage && (
                        <img 
                          src={displayCategoryImage} 
                          alt={displayCategory}
                          className="me-1"
                          style={{ width: '16px', height: '16px', objectFit: 'cover', borderRadius: '2px' }}
                        />
                      )}
                      {displayCategory}
                    </span>
                  </div>
                </Col>
                <Col xs={6}>
                  {getProductValue(product, 'brand') && (
                    <div className="mb-2">
                      <strong>Brand:</strong> {getProductValue(product, 'brand')}
                    </div>
                  )}
                  {getProductValue(product, 'weight') && (
                    <div className="mb-2">
                      <strong>Weight:</strong> {getProductValue(product, 'weight')}
                    </div>
                  )}
                </Col>
              </Row>
              
              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-3">
                  <strong className="text-muted small">Tags:</strong>
                  <div className="mt-1">
                    {product.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        bg="light" 
                        text="dark" 
                        className="me-1 mb-1"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </Col>
      </Row>

      {/* Product Details Tabs */}
      <Card className="mb-5">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'description')}
            className="mb-3"
          >
            <Tab eventKey="description" title="Description">
              <div className="py-3">
                <h5>Product Description</h5>
                <p className="text-muted lh-lg">
                  {getProductValue(product, 'description', 'long_description') || 'No description available for this product.'}
                </p>
              </div>
            </Tab>

            <Tab eventKey="specifications" title="Specifications">
              <div className="py-3">
                <h5>Specifications</h5>
                {getProductValue(product, 'specifications') && Object.keys(getProductValue(product, 'specifications')).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <tbody>
                        {Object.entries(getProductValue(product, 'specifications')).map(([key, value]) => (
                          <tr key={key}>
                            <td className="fw-semibold" style={{ width: '30%' }}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </td>
                            <td>{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No specifications available for this product.</p>
                )}
              </div>
            </Tab>

            <Tab eventKey="reviews" title={`Reviews (${product.review_count || 0})`}>
              <div className="py-3">
                <h5>Customer Reviews</h5>
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-comments fa-3x mb-3"></i>
                  <p>Reviews feature coming soon!</p>
                </div>
              </div>
            </Tab>

            <Tab eventKey="shipping" title="Shipping & Returns">
              <div className="py-3">
                <h5>Shipping Information</h5>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <h6><i className="fas fa-shipping-fast text-primary me-2"></i>Fast Shipping</h6>
                      <p className="text-muted">Free shipping on orders over ₹2000. Standard delivery in 3-5 business days.</p>
                    </div>
                    <div className="mb-3">
                      <h6><i className="fas fa-undo text-success me-2"></i>Easy Returns</h6>
                      <p className="text-muted">30-day return policy. Items must be in original condition.</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <h6><i className="fas fa-shield-alt text-info me-2"></i>Secure Payment</h6>
                      <p className="text-muted">Your payment information is processed securely via Stripe.</p>
                    </div>
                    <div className="mb-3">
                      <h6><i className="fas fa-headset text-warning me-2"></i>Customer Support</h6>
                      <p className="text-muted">24/7 customer support available via email and chat.</p>
                    </div>
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
          <h3 className="mb-4">Related Products</h3>
          <Row>
            {relatedProducts.slice(0, 4).map((relatedProduct) => (
              <Col key={relatedProduct.id} lg={3} md={4} sm={6} className="mb-4">
                <Card className="h-100 shadow-sm border-0 product-card">
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={relatedProduct.images?.[0] || '/api/placeholder/300/200'}
                      alt={relatedProduct.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                      className="cursor-pointer"
                      onClick={() => navigate(`/products/${relatedProduct.id}`)}
                    />
                    {relatedProduct.sale_price && (
                      <Badge 
                        bg="danger" 
                        className="position-absolute top-0 start-0 m-2"
                      >
                        Sale
                      </Badge>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <h6 className="card-title text-truncate" title={relatedProduct.name}>
                      {relatedProduct.name}
                    </h6>
                    <div className="mb-2">
                      {renderStars(parseFloat(relatedProduct.average_rating || '0'))}
                      <small className="text-muted ms-1">
                        ({relatedProduct.review_count || 0})
                      </small>
                    </div>
                    <div className="mt-auto">
                      {relatedProduct.sale_price ? (
                        <div>
                          <span className="fw-bold text-danger">
                            {formatPrice(relatedProduct.sale_price)}
                          </span>
                          <small className="text-muted text-decoration-line-through ms-2">
                            {formatPrice(relatedProduct.price)}
                          </small>
                        </div>
                      ) : (
                        <span className="fw-bold text-primary">
                          {formatPrice(relatedProduct.price)}
                        </span>
                      )}
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-transparent border-0 pt-0">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      onClick={() => navigate(`/products/${relatedProduct.id}`)}
                    >
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