import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Table, Button, Badge, Modal, Form, 
  Pagination, InputGroup, Dropdown, Spinner, Alert 
} from 'react-bootstrap';
import { Product } from '../../types';
import { productsApi } from '../../services/api';
import api from '../../utils/api';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    sale_price: '',
    sku: '',
    stock: '',
    category_id: '',
    is_active: true,
    is_featured: false,
  });

  // Load additional products from localStorage
  const loadLocalProducts = () => {
    try {
      const localProducts = localStorage.getItem('adminProducts');
      return localProducts ? JSON.parse(localProducts) : [];
    } catch (error) {
      console.error('Error loading local products:', error);
      return [];
    }
  };

  // Save additional products to localStorage
  const saveLocalProducts = (additionalProducts: Product[]) => {
    try {
      localStorage.setItem('adminProducts', JSON.stringify(additionalProducts));
    } catch (error) {
      console.error('Error saving local products:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from admin products endpoint first (shows all products including inactive)
      try {
        console.log('AdminProducts: Trying admin products API...');
        const params = new URLSearchParams();
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        params.append('page', currentPage.toString());
        params.append('per_page', '10');
        
        const response = await api.get(`/admin/products?${params.toString()}`);
        
        if (response.data?.success && response.data?.data) {
          console.log('AdminProducts: Successfully loaded from admin API:', response.data.data);
          const productsData = response.data.data?.data || response.data.data || [];
          const apiProducts = Array.isArray(productsData) ? productsData : [];
          
          // Combine API products with locally added products
          const localProducts = loadLocalProducts();
          const allProducts = [...apiProducts, ...localProducts];
          console.log('AdminProducts: Admin API products:', apiProducts.length, 'Local products:', localProducts.length);
          
          setProducts(allProducts);
          setError(null);
          return; // Exit early if API works
        }
      } catch (adminApiError) {
        console.log('AdminProducts: Admin API failed, trying featured products API...');
        
        // Try to fetch from the same API that HomePage uses successfully
        try {
          console.log('AdminProducts: Trying getFeaturedProducts API...');
          const response = await api.get('/products/featured');
          
          if (response.data?.success && response.data?.data) {
            console.log('AdminProducts: Successfully loaded from featured API:', response.data.data.length);
            const productsData = response.data.data || [];
            const apiProducts = Array.isArray(productsData) ? productsData : [];
            
            // For admin, we can also try to get all products (not just featured)
            try {
              console.log('AdminProducts: Also trying to get all products...');
              const allProductsResponse = await api.get('/products');
              if (allProductsResponse.data?.success && allProductsResponse.data?.data) {
                const allProductsData = allProductsResponse.data.data?.data || allProductsResponse.data.data || [];
                console.log('AdminProducts: Successfully loaded all products:', allProductsData.length);
                
                // Combine featured and all products, removing duplicates
                const combinedProducts = [...apiProducts];
                allProductsData.forEach((product: Product) => {
                  if (!combinedProducts.some(p => p.id === product.id)) {
                    combinedProducts.push(product);
                  }
                });
                
                // Combine with locally added products
                const localProducts = loadLocalProducts();
                const allProducts = [...combinedProducts, ...localProducts];
                console.log('AdminProducts: API products:', combinedProducts.length, 'Local products:', localProducts.length);
                
                setProducts(allProducts);
                setError(null);
                return; // Exit early if API works
              }
            } catch (allProductsError) {
              console.log('AdminProducts: All products API failed, using featured only');
            }
            
            // Fallback to featured products only
            const localProducts = loadLocalProducts();
            const allProducts = [...apiProducts, ...localProducts];
            console.log('AdminProducts: API products:', apiProducts.length, 'Local products:', localProducts.length);
            
            setProducts(allProducts);
            setError(null);
            return; // Exit early if API works
          }
        } catch (featuredApiError) {
          console.log('AdminProducts: Featured API failed, trying regular products API...');
          
          // Try regular products API as fallback
          try {
            const response = await productsApi.getAll({
              page: currentPage,
              search: searchTerm,
            });
            
            if (response.success && response.data) {
              console.log('AdminProducts: Successfully loaded from regular API:', response.data.length);
              const productsData = response.data || [];
              const apiProducts = Array.isArray(productsData) ? productsData : [];
              
              // Combine API products with locally added products
              const localProducts = loadLocalProducts();
              const allProducts = [...apiProducts, ...localProducts];
              console.log('AdminProducts: API products:', apiProducts.length, 'Local products:', localProducts.length);
              
              setProducts(allProducts);
              setError(null);
              return; // Exit early if API works
            }
          } catch (regularApiError) {
            console.log('AdminProducts: All APIs failed, using mock data');
          }
        }
      }
      
      // Fallback to mock data if API fails
      console.log('AdminProducts: Using mock data');
      
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Sample Laptop',
          slug: 'sample-laptop',
          description: 'High-performance laptop for work and gaming',
          short_description: 'High-performance laptop',
          price: '999.99',
          sale_price: '899.99',
          sku: 'LAPTOP-001',
          stock: 15,
          images: ['/placeholder-image.svg'],
          category: {
            id: 1,
            name: 'Electronics',
            slug: 'electronics',
            sort_order: 1,
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          },
          brand: 'TechBrand',
          is_active: true,
          is_featured: true,
          average_rating: '4.5',
          review_count: 23,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Wireless Headphones',
          slug: 'wireless-headphones',
          description: 'Premium noise-cancelling wireless headphones',
          short_description: 'Premium wireless headphones',
          price: '299.99',
          sku: 'HEADPHONES-001',
          stock: 8,
          images: ['/placeholder-image.svg'],
          category: {
            id: 1,
            name: 'Electronics',
            slug: 'electronics',
            sort_order: 1,
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          },
          brand: 'AudioBrand',
          is_active: true,
          is_featured: true,
          average_rating: '4.2',
          review_count: 15,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Smart Watch',
          slug: 'smart-watch',
          description: 'Feature-rich smartwatch with health tracking',
          short_description: 'Feature-rich smartwatch',
          price: '399.99',
          sku: 'WATCH-001',
          stock: 12,
          images: ['/placeholder-image.svg'],
          category: {
            id: 1,
            name: 'Electronics',
            slug: 'electronics',
            sort_order: 1,
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          },
          brand: 'WatchBrand',
          is_active: true,
          is_featured: true,
          average_rating: '4.7',
          review_count: 31,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];
      
      console.log('AdminProducts: Setting mock products:', mockProducts.length);
      
      // Combine with locally added products
      const localProducts = loadLocalProducts();
      console.log('AdminProducts: Loaded local products:', localProducts.length);
      
      const allProducts = [...mockProducts, ...localProducts];
      console.log('AdminProducts: Total products:', allProducts.length);
      
      setProducts(allProducts);
      setError(null);
      
    } catch (error: any) {
      console.error('AdminProducts: Error loading products:', error);
      setError('Error loading products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      short_description: '',
      price: '',
      sale_price: '',
      sku: '',
      stock: '',
      category_id: '',
      is_active: true,
      is_featured: false,
    });
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      short_description: product.short_description || '',
      price: product.price,
      sale_price: product.sale_price || '',
      sku: product.sku,
      stock: product.stock.toString(),
      category_id: product.category.id.toString(),
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      console.log('AdminProducts: Submitting product to API:', formData);
      
      if (editingProduct) {
        // Update existing product via API
        try {
          const response = await api.put(`/admin/products/${editingProduct.id}`, formData);
          
          if (response.data?.success) {
            console.log('AdminProducts: Product updated successfully via API');
            setSuccess('Product updated successfully');
            setShowModal(false);
            loadProducts(); // Reload products from API
          } else {
            throw new Error(response.data?.message || 'Failed to update product');
          }
        } catch (apiError: any) {
          console.error('AdminProducts: API update failed:', apiError);
          
          // Fallback to local update if API fails
          const updatedProducts = products.map(product => 
            product.id === editingProduct.id ? {
              ...product,
              name: formData.name,
              description: formData.description,
              short_description: formData.short_description,
              price: formData.price,
              sale_price: formData.sale_price || undefined,
              sku: formData.sku,
              stock: parseInt(formData.stock),
              is_active: formData.is_active,
              is_featured: formData.is_featured,
              updated_at: new Date().toISOString()
            } : product
          );
          setProducts(updatedProducts);
          setSuccess('Product updated locally (API unavailable)');
          setShowModal(false);
        }
      } else {
        // Create new product via API
        try {
          const response = await api.post('/admin/products', formData);
          
          if (response.data?.success) {
            console.log('AdminProducts: Product created successfully via API:', response.data.data);
            setSuccess('Product created successfully');
            setShowModal(false);
            loadProducts(); // Reload products from API
          } else {
            throw new Error(response.data?.message || 'Failed to create product');
          }
        } catch (apiError: any) {
          console.error('AdminProducts: API creation failed:', apiError);
          
          // Show specific error message if it's a validation error
          if (apiError.response?.status === 422) {
            const errors = apiError.response.data?.errors;
            const errorMessages = Object.values(errors || {}).flat().join(', ');
            setError(`Validation error: ${errorMessages}`);
            return;
          }
          
          if (apiError.response?.status === 403) {
            setError('You do not have permission to create products. Please ensure you are logged in as an admin.');
            return;
          }
          
          // Fallback to local creation if API fails for other reasons
          console.log('AdminProducts: API failed, falling back to local storage');
          
          const newProduct: Product = {
            id: Date.now(), // Simple ID generation for demo
            name: formData.name,
            slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
            description: formData.description,
            short_description: formData.short_description,
            price: formData.price,
            sale_price: formData.sale_price || undefined,
            sku: formData.sku,
            stock: parseInt(formData.stock),
            images: ['/placeholder-image.svg'],
            category: {
              id: parseInt(formData.category_id),
              name: formData.category_id === '1' ? 'Electronics' : formData.category_id === '2' ? 'Clothing' : 'Home & Garden',
              slug: 'category-slug',
              sort_order: 1,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            brand: 'Demo Brand',
            is_active: formData.is_active,
            is_featured: formData.is_featured,
            average_rating: '0',
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Add to local storage as fallback
          const localProducts = loadLocalProducts();
          const updatedLocalProducts = [...localProducts, newProduct];
          saveLocalProducts(updatedLocalProducts);
          
          setProducts(prevProducts => [...prevProducts, newProduct]);
          setSuccess('Product created locally (API unavailable)');
          setShowModal(false);
        }
      }
    } catch (error: any) {
      console.error('AdminProducts: Unexpected error:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        console.log('AdminProducts: Deleting product via API:', productId);
        
        // Try to delete via API first
        try {
          const response = await api.delete(`/admin/products/${productId}`);
          
          if (response.data?.success) {
            console.log('AdminProducts: Product deleted successfully via API');
            setSuccess('Product deleted successfully');
            loadProducts(); // Reload products from API
          } else {
            throw new Error(response.data?.message || 'Failed to delete product');
          }
        } catch (apiError: any) {
          console.error('AdminProducts: API deletion failed:', apiError);
          
          if (apiError.response?.status === 403) {
            setError('You do not have permission to delete products. Please ensure you are logged in as an admin.');
            return;
          }
          
          // Fallback to local deletion if API fails
          console.log('AdminProducts: API failed, falling back to local deletion');
          
          // Remove product from local state
          const updatedProducts = products.filter(product => product.id !== productId);
          setProducts(updatedProducts);
          
          // Also remove from localStorage if it's a locally added product
          const localProducts = loadLocalProducts();
          const updatedLocalProducts = localProducts.filter((product: Product) => product.id !== productId);
          saveLocalProducts(updatedLocalProducts);
          
          setSuccess('Product deleted locally (API unavailable)');
        }
      } catch (error: any) {
        console.error('AdminProducts: Unexpected error during deletion:', error);
        setError(error.message || 'An unexpected error occurred while deleting the product');
      }
    }
  };

  const getStatusBadge = (product: Product) => {
    if (!product.is_active) return <Badge bg="secondary">Inactive</Badge>;
    if (product.stock <= 0) return <Badge bg="danger">Out of Stock</Badge>;
    if (product.stock <= 10) return <Badge bg="warning">Low Stock</Badge>;
    return <Badge bg="success">In Stock</Badge>;
  };

  // Debug: Log products state before render
  console.log('AdminProducts: Rendering with products:', products, 'length:', products.length, 'loading:', loading, 'error:', error);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Products</h1>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => {
              localStorage.removeItem('adminProducts');
              loadProducts();
              setSuccess('Local products cleared');
            }}
          >
            <i className="bi bi-trash me-2"></i>
            Clear Local
          </Button>
          <Button variant="primary" onClick={handleAddProduct}>
            <i className="bi bi-plus-circle me-2"></i>
            Add Product
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Search and Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={6}>
                <InputGroup>
                  <Form.Control
                    type="search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="outline-secondary">
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select>
                  <option>All Categories</option>
                  <option>Electronics</option>
                  <option>Clothing</option>
                  <option>Home & Garden</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Out of Stock</option>
                </Form.Select>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={Array.isArray(product.images) ? product.images[0] : ''}
                            alt={product.name}
                            className="rounded me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-bold">{product.name}</div>
                            <small className="text-muted">{product.short_description}</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>
                        <div>
                          {product.sale_price && (
                            <>
                              <span className="fw-bold">₹{product.sale_price}</span>
                              <br />
                              <small className="text-muted text-decoration-line-through">
                                ₹{product.price}
                              </small>
                            </>
                          )}
                          {!product.sale_price && (
                            <span className="fw-bold">₹{product.price}</span>
                          )}
                        </div>
                      </td>
                      <td>{product.stock}</td>
                      <td>{getStatusBadge(product)}</td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            Actions
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleEditProduct(product)}>
                              <i className="bi bi-pencil me-2"></i>
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item href={`/products/${product.slug}`} target="_blank">
                              <i className="bi bi-eye me-2"></i>
                              View
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              className="text-danger"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <i className="bi bi-trash me-2"></i>
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="text-muted">
                        <i className="bi bi-box-seam fs-1 d-block mb-2"></i>
                        No products found
                        <div className="small mt-2">
                          Debug: products.length = {products.length}, 
                          isArray = {Array.isArray(products).toString()}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
        
        {/* Pagination */}
        <Card.Footer className="bg-transparent">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {Array.isArray(products) ? products.length : 0} products
            </small>
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev disabled={currentPage === 1} />
              <Pagination.Item active>{currentPage}</Pagination.Item>
              <Pagination.Next />
            </Pagination>
          </div>
        </Card.Footer>
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>SKU</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Short Description</Form.Label>
              <Form.Control
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sale Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="1">Electronics</option>
                    <option value="2">Clothing</option>
                    <option value="3">Home & Garden</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-block">Options</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProducts;