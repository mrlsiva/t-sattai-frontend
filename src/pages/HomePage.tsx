import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Carousel, Card, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Product, Category } from '../types';
import { productsApi, categoriesApi, handleApiError } from '../services/api';
import { resolveCategoryImage, resolveProductImage } from '../utils/imageHelpers';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

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
      
      // Load categories first
      try {
        const categoriesResponse = await categoriesApi.getAll();
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data || []);
        }
      } catch (categoriesError) {
        // Categories failed but continue loading products
      }
      
      // Load featured products with fallback to all products
      try {
        const productsResponse = await productsApi.getFeatured();

        if (productsResponse.success && productsResponse.data && Array.isArray(productsResponse.data) && productsResponse.data.length > 0) {
          setFeaturedProducts(productsResponse.data);
        } else {
          throw new Error('No featured products');
        }
      } catch (featuredError) {
        // Fallback: load all products and use first 8 as featured
        try {
          const allProductsResponse = await productsApi.getAll();
          if (allProductsResponse.success && allProductsResponse.data) {
            const products = Array.isArray(allProductsResponse.data)
              ? allProductsResponse.data
              : (allProductsResponse.data as any).data || [];
            setFeaturedProducts(products.slice(0, 8));
          } else {
            setFeaturedProducts([]);
          }
        } catch (allError) {
          setFeaturedProducts([]);
        }
      }
    } catch (error) {
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
              background: 'linear-gradient(135deg, var(--brand-brown) 0%, var(--brand-gold) 100%)',
              color: 'white'
            }}
          >
            <Container>
              <Row className="align-items-center">
                <Col lg={6}>
                  <h1 className="display-4 fw-bold mb-4">🌴 VEMBAR KARUPATTI</h1>
                  <p className="lead mb-4 text-brand-cream">
                    Experience the pure sweetness from nature with our authentic Karupatti jaggery. 
                    Traditional South Indian craftsmanship bringing you the finest quality natural sweeteners.
                  </p>
                  <Button 
                    size="lg" 
                    variant="light" 
                    className="me-3 btn-brand"
                    onClick={() => navigate('/products')}
                  >
                    Shop Karupatti
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline-light"
                    onClick={() => navigate('/about')}
                  >
                    Our Story
                  </Button>
                </Col>
                <Col lg={6} className="text-center">
                  <div style={{ fontSize: '8rem', opacity: '0.8' }}>🌴</div>
                  <div className="mt-3" style={{ fontSize: '2rem', opacity: '0.7' }}>Pure • Natural • Traditional</div>
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
              background: 'linear-gradient(135deg, var(--brand-green) 0%, var(--brand-brown) 100%)',
              color: 'white'
            }}
          >
            <Container>
              <Row className="align-items-center">
                <Col lg={6}>
                  <h1 className="display-4 fw-bold mb-4">🚚 Free Delivery</h1>
                  <p className="lead mb-4">
                    Fresh Karupatti delivered to your doorstep with care. We ensure 
                    premium quality packaging to preserve the natural goodness.
                  </p>
                  <Button 
                    size="lg" 
                    variant="light"
                    className="btn-brand"
                    onClick={() => navigate('/products')}
                  >
                    Order Fresh Karupatti
                  </Button>
                </Col>
                <Col lg={6} className="text-center">
                  <div style={{ fontSize: '8rem', opacity: '0.8' }}>🏺</div>
                  <div className="mt-3" style={{ fontSize: '1.5rem', opacity: '0.7' }}>Handcrafted • Fresh • Delivered</div>
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
              background: 'linear-gradient(135deg, var(--brand-gold) 0%, var(--brand-green) 100%)',
              color: 'white'
            }}
          >
            <Container>
              <Row className="align-items-center">
                <Col lg={6}>
                  <h1 className="display-4 fw-bold mb-4">🔒 Pure & Authentic</h1>
                  <p className="lead mb-4">
                    Trust in our traditional methods and authentic recipes passed down through generations. 
                    Every batch is made with pure coconut palm sap - no additives, just nature's sweetness.
                  </p>
                  <Button 
                    size="lg" 
                    variant="light"
                    className="btn-brand"
                    onClick={() => navigate('/products')}
                  >
                    Discover Purity
                  </Button>
                </Col>
                <Col lg={6} className="text-center">
                  <div style={{ fontSize: '8rem', opacity: '0.8' }}>🌴</div>
                  <div className="mt-3" style={{ fontSize: '1.5rem', opacity: '0.7' }}>Traditional • Authentic • Pure</div>
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
                <h2 className="text-center fw-bold text-brand-brown">🌴 Product Categories</h2>
                <p className="text-center text-muted">Explore our range of traditional South Indian specialties</p>
              </Col>
            </Row>
            <Row>
              {categories.slice(0, 6).map((category) => (
                <Col key={category.id} lg={2} md={4} sm={6} className="mb-4">
                  <Card
                    as={Link}
                    to={`/products/category/${category.id}`}
                    className="h-100 text-decoration-none border-0 shadow-sm category-card overflow-hidden"
                    style={{ transition: 'transform 0.3s ease' }}
                  >
                    {resolveCategoryImage(category.image, category.display_image) ? (
                      <div style={{ height: '120px', overflow: 'hidden' }}>
                        <img
                          src={resolveCategoryImage(category.image, category.display_image)!}
                          alt={category.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                        style={{ height: '120px' }}
                      >
                        <i className="bi bi-grid text-primary" style={{ fontSize: '2.5rem' }}></i>
                      </div>
                    )}
                    <Card.Body className="text-center py-2 px-3">
                      <Card.Title className="small fw-semibold text-dark mb-0">{category.name}</Card.Title>
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
              <h2 className="text-center fw-bold text-brand-brown">🏺 Premium Karupatti Collection</h2>
              <p className="text-center text-muted">Handcrafted traditional jaggery made from pure coconut palm sap</p>
            </Col>
          </Row>
          
          {featuredProducts.length === 0 && !loading ? (
            <Row>
              <Col className="text-center py-5">
                <div style={{ fontSize: '4rem' }} className="text-brand-gold mb-3">🌴</div>
                <h4 className="text-brand-brown">No Karupatti products available</h4>
                <p className="text-muted">Our traditional jaggery collection is being prepared</p>
                <Button 
                  variant="primary" 
                  className="btn-brand"
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
                        src={resolveProductImage(product.images[0])}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder-image.svg';
                        }}
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
                            <span className="fw-bold text-primary">₹{product.sale_price}</span>
                            <span className="text-muted text-decoration-line-through ms-2">
                              ₹{product.price}
                            </span>
                          </>
                        ) : (
                          <span className="fw-bold text-primary">₹{product.price}</span>
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
                  <div style={{ fontSize: '3rem' }} className="text-brand-brown">🚚</div>
                </div>
                <h5 className="fw-bold text-brand-brown">Fresh Delivery</h5>
                <p className="text-muted small">Direct from our traditional kitchen to your home</p>
              </Col>
              
              <Col lg={3} md={6} className="mb-4 text-center">
                <div className="mb-3">
                  <div style={{ fontSize: '3rem' }} className="text-brand-green">🌿</div>
                </div>
                <h5 className="fw-bold text-brand-brown">100% Natural</h5>
                <p className="text-muted small">No chemicals, preservatives or artificial additives</p>
              </Col>
              
              <Col lg={3} md={6} className="mb-4 text-center">
                <div className="mb-3">
                  <div style={{ fontSize: '3rem' }} className="text-brand-gold">🏺</div>
                </div>
                <h5 className="fw-bold text-brand-brown">Traditional Method</h5>
                <p className="text-muted small">Time-honored techniques passed down generations</p>
              </Col>
              
              <Col lg={3} md={6} className="mb-4 text-center">
                <div className="mb-3">
                  <div style={{ fontSize: '3rem' }} className="text-brand-brown">🌴</div>
                </div>
                <h5 className="fw-bold text-brand-brown">Pure Coconut Palm</h5>
                <p className="text-muted small">Made exclusively from fresh coconut palm sap</p>
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