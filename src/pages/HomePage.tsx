import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Carousel, Card, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Product, Category } from '../types';
import { productsApi, categoriesApi, handleApiError } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import config from '../config';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('HomePage: Loading data...');
      
      // Load categories first
      try {
        const categoriesResponse = await categoriesApi.getCategories();
        console.log('HomePage: Categories response:', categoriesResponse);
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data || []);
        }
      } catch (categoriesError) {
        console.error('HomePage: Categories error:', categoriesError);
      }
      
      // Load featured products with better error handling
      try {
        console.log('HomePage: Fetching featured products...');
        const productsResponse = await productsApi.getFeaturedProducts();
        console.log('HomePage: Featured products response:', productsResponse);
        
        if (productsResponse.success && productsResponse.data) {
          console.log('HomePage: Successfully loaded featured products:', productsResponse.data.length);
          setFeaturedProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
        } else {
          console.log('HomePage: Featured products API failed, trying direct API call...');
          
          // Fallback to direct API call
          try {
            const directResponse = await fetch(`${config.api.baseURL}/products/featured`);
            const directData = await directResponse.json();
            console.log('HomePage: Direct API response:', directData);
            
            if (directData.success && directData.data) {
              console.log('HomePage: Successfully loaded from direct API:', directData.data.length);
              setFeaturedProducts(Array.isArray(directData.data) ? directData.data : []);
            } else {
              console.log('HomePage: No featured products found, setting empty array');
              setFeaturedProducts([]);
            }
          } catch (directError) {
            console.error('HomePage: Direct API call also failed:', directError);
            setFeaturedProducts([]);
          }
        }
      } catch (productsError) {
        console.error('HomePage: Products API error:', productsError);
        setError('Failed to load featured products');
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('HomePage: General error:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleAddToWishlist = async (product: Product) => {
    try {
      await addToWishlist(product);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Carousel */}
      <Carousel className="mb-5">
        <Carousel.Item>
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{ 
              height: '500px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Container>
              <Row className="align-items-center">
                <Col lg={6}>
                  <h1 className="display-4 fw-bold mb-4">Welcome to EcomStore</h1>
                  <p className="lead mb-4">
                    Discover amazing products at unbeatable prices. Shop with confidence 
                    and enjoy fast, secure delivery right to your doorstep.
                  </p>
                  <Button 
                    size="lg" 
                    variant="light" 
                    className="me-3"
                    onClick={() => navigate('/products')}
                  >
                    Shop Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline-light"
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                  </Button>
                </Col>
                <Col lg={6} className="text-center">
                  <i className="bi bi-bag-check" style={{ fontSize: '8rem', opacity: '0.8' }}></i>
                </Col>
              </Row>
            </Container>
          </div>
        </Carousel.Item>
        
        <Carousel.Item>
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{ 
              height: '500px', 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}
          >
            <Container>
              <Row className="align-items-center">
                <Col lg={6}>
                  <h1 className="display-4 fw-bold mb-4">Free Shipping</h1>
                  <p className="lead mb-4">
                    Enjoy free shipping on all orders above $50. Fast and reliable 
                    delivery service to ensure your products reach you quickly.
                  </p>
                  <Button 
                    size="lg" 
                    variant="light"
                    onClick={() => navigate('/products')}
                  >
                    Start Shopping
                  </Button>
                </Col>
                <Col lg={6} className="text-center">
                  <i className="bi bi-truck" style={{ fontSize: '8rem', opacity: '0.8' }}></i>
                </Col>
              </Row>
            </Container>
          </div>
        </Carousel.Item>
        
        <Carousel.Item>
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{ 
              height: '500px', 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}
          >
            <Container>
              <Row className="align-items-center">
                <Col lg={6}>
                  <h1 className="display-4 fw-bold mb-4">Secure Payments</h1>
                  <p className="lead mb-4">
                    Shop with confidence using our secure payment system. We support 
                    multiple payment methods including cards, UPI, and digital wallets.
                  </p>
                  <Button 
                    size="lg" 
                    variant="light"
                    onClick={() => navigate('/products')}
                  >
                    Explore Products
                  </Button>
                </Col>
                <Col lg={6} className="text-center">
                  <i className="bi bi-shield-check" style={{ fontSize: '8rem', opacity: '0.8' }}></i>
                </Col>
              </Row>
            </Container>
          </div>
        </Carousel.Item>
      </Carousel>

      <Container>
        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="mb-5">
            <Row className="mb-4">
              <Col>
                <h2 className="text-center fw-bold">Shop by Category</h2>
                <p className="text-center text-muted">Browse our wide range of product categories</p>
              </Col>
            </Row>
            <Row>
              {categories.slice(0, 6).map((category) => (
                <Col key={category.id} lg={2} md={4} sm={6} className="mb-4">
                  <Card 
                    as={Link} 
                    to={`/products/category/${category.id}`}
                    className="h-100 text-decoration-none border-0 shadow-sm category-card"
                    style={{ transition: 'transform 0.3s ease' }}
                  >
                    <Card.Body className="text-center p-4">
                      <div 
                        className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{ width: '60px', height: '60px' }}
                      >
                        <i className="bi bi-grid text-primary fs-3"></i>
                      </div>
                      <Card.Title className="small fw-semibold text-dark">{category.name}</Card.Title>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="mb-5">
          <Row className="mb-4">
            <Col>
              <h2 className="text-center fw-bold">Featured Products</h2>
              <p className="text-center text-muted">Discover our most popular and trending items</p>
              {/* Debug info */}
              <div className="text-center">
                <small className="text-muted">
                  Debug: Found {featuredProducts.length} featured products
                  {error && ` | Error: ${error}`}
                </small>
              </div>
            </Col>
          </Row>
          
          {featuredProducts.length === 0 && !loading ? (
            <Row>
              <Col className="text-center py-5">
                <i className="bi bi-box-seam fs-1 text-muted d-block mb-3"></i>
                <h4 className="text-muted">No featured products available</h4>
                <p className="text-muted">Check back later for featured items</p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/products')}
                >
                  Browse All Products
                </Button>
              </Col>
            </Row>
          ) : (
            <Row>
              {featuredProducts.slice(0, 8).map((product) => (
                <Col key={product.id} lg={3} md={4} sm={6} className="mb-4">
                  <Card className="h-100 shadow-sm product-card">
                    <div className="position-relative">
                      <Card.Img 
                        variant="top" 
                        src={product.images[0] || '/placeholder-image.jpg'} 
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      {product.sale_price && (
                        <Badge 
                          bg="danger" 
                          className="position-absolute top-0 start-0 m-2"
                        >
                          Sale
                        </Badge>
                      )}
                      <div className="position-absolute top-0 end-0 m-2">
                        <Button
                          variant={isInWishlist(product.id) ? "danger" : "outline-light"}
                          size="sm"
                          className="rounded-circle"
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToWishlist(product);
                          }}
                        >
                          <i className="bi bi-heart"></i>
                        </Button>
                      </div>
                    </div>
                    
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="small fw-semibold text-truncate">
                        {product.name}
                      </Card.Title>
                      
                      <div className="mb-2">
                        <div className="d-flex align-items-center">
                          <div className="text-warning me-1">
                            {[...Array(5)].map((_, i) => (
                              <i 
                                key={i} 
                                className={`bi bi-star${i < Math.floor(parseFloat(product.average_rating)) ? '-fill' : ''}`}
                                style={{ fontSize: '0.8rem' }}
                              ></i>
                            ))}
                          </div>
                          <small className="text-muted">({product.review_count})</small>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        {product.sale_price ? (
                          <>
                            <span className="fw-bold text-primary">${product.sale_price}</span>
                            <span className="text-muted text-decoration-line-through ms-2">
                              ${product.price}
                            </span>
                          </>
                        ) : (
                          <span className="fw-bold text-primary">${product.price}</span>
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        <div className="d-grid gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product);
                            }}
                            disabled={product.stock === 0}
                          >
                            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          
          {featuredProducts.length > 0 && (
            <Row>
              <Col className="text-center">
                <Button onClick={() => navigate('/products')} variant="outline-primary" size="lg">
                  View All Products
                </Button>
              </Col>
            </Row>
          )}
        </section>

        {/* Features Section */}
        <section className="py-5 bg-light rounded">
          <Container>
            <Row>
              <Col lg={3} md={6} className="mb-4 text-center">
                <div className="mb-3">
                  <i className="bi bi-truck text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold">Free Shipping</h5>
                <p className="text-muted small">Free shipping on orders over $50</p>
              </Col>
              
              <Col lg={3} md={6} className="mb-4 text-center">
                <div className="mb-3">
                  <i className="bi bi-arrow-clockwise text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold">Easy Returns</h5>
                <p className="text-muted small">30-day return policy</p>
              </Col>
              
              <Col lg={3} md={6} className="mb-4 text-center">
                <div className="mb-3">
                  <i className="bi bi-shield-check text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold">Secure Payment</h5>
                <p className="text-muted small">100% secure payment processing</p>
              </Col>
              
              <Col lg={3} md={6} className="mb-4 text-center">
                <div className="mb-3">
                  <i className="bi bi-headset text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold">24/7 Support</h5>
                <p className="text-muted small">Round-the-clock customer support</p>
              </Col>
            </Row>
          </Container>
        </section>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
      </Container>

      <style>{`
        .category-card:hover {
          transform: translateY(-5px);
        }
        
        .product-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </>
  );
};

export default HomePage;