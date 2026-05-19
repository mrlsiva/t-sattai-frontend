import React, { useState, useEffect, useRef } from 'react';
import {
  Row, Col, Card, Table, Button, Badge, Modal, Form,
  Pagination, InputGroup, Dropdown, Spinner, Alert
} from 'react-bootstrap';
import { Product, Category } from '../../types';
import { productsApi, handleApiError } from '../../services/api';
import api from '../../utils/api';

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Electronics', slug: 'electronics', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
  { id: 2, name: 'Clothing', slug: 'clothing', sort_order: 2, is_active: true, created_at: '', updated_at: '' },
  { id: 3, name: 'Home & Garden', slug: 'home-garden', sort_order: 3, is_active: true, created_at: '', updated_at: '' },
];

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Image state (separate from formData since File is not JSON-serialisable)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    sale_price: '',
    sku: '',
    stock: '',
    category_id: '',
    image_url: '',
    is_active: true,
    is_featured: false,
  });

  // ─── localStorage helpers ────────────────────────────────────────────────
  const loadLocalProducts = (): Product[] => {
    try {
      const raw = localStorage.getItem('adminProducts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalProducts = (list: Product[]) => {
    try { localStorage.setItem('adminProducts', JSON.stringify(list)); } catch {}
  };

  // ─── Load categories from API ────────────────────────────────────────────
  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      const data = response.data?.data || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setCategories(list.length > 0 ? list : FALLBACK_CATEGORIES);
    } catch {
      try {
        const response = await api.get('/admin/categories');
        const data = response.data?.data || response.data || [];
        const list = Array.isArray(data) ? data : [];
        setCategories(list.length > 0 ? list : FALLBACK_CATEGORIES);
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      }
    }
  };

  // ─── Load products ───────────────────────────────────────────────────────
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [currentPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        params.append('page', currentPage.toString());
        params.append('per_page', '10');

        const response = await api.get(`/admin/products?${params.toString()}`);
        if (response.data?.success && response.data?.data) {
          const productsData = response.data.data?.data || response.data.data || [];
          const apiProducts = Array.isArray(productsData) ? productsData : [];
          const localProducts = loadLocalProducts();
          setProducts([...apiProducts, ...localProducts]);
          return;
        }
      } catch {
        try {
          const response = await api.get('/products/featured');
          if (response.data?.success && response.data?.data) {
            const apiProducts = Array.isArray(response.data.data) ? response.data.data : [];
            try {
              const allResp = await api.get('/products');
              if (allResp.data?.success && allResp.data?.data) {
                const allData = allResp.data.data?.data || allResp.data.data || [];
                const combined = [...apiProducts];
                allData.forEach((p: Product) => {
                  if (!combined.some(x => x.id === p.id)) combined.push(p);
                });
                setProducts([...combined, ...loadLocalProducts()]);
                return;
              }
            } catch {}
            setProducts([...apiProducts, ...loadLocalProducts()]);
            return;
          }
        } catch {
          try {
            const response = await productsApi.getAll({ page: currentPage, search: searchTerm });
            if (response.success && response.data) {
              const apiProducts = Array.isArray(response.data) ? response.data : [];
              setProducts([...apiProducts, ...loadLocalProducts()]);
              return;
            }
          } catch {}
        }
      }

      // Fallback mock data
      const mockProducts: Product[] = [
        {
          id: 1, name: 'Sample Laptop', slug: 'sample-laptop',
          description: 'High-performance laptop for work and gaming',
          short_description: 'High-performance laptop',
          price: '999.99', sale_price: '899.99', sku: 'LAPTOP-001', stock: 15,
          images: ['/placeholder-image.svg'],
          category: { id: 1, name: 'Electronics', slug: 'electronics', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
          brand: 'TechBrand', is_active: true, is_featured: true,
          average_rating: '4.5', review_count: 23,
          created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2, name: 'Wireless Headphones', slug: 'wireless-headphones',
          description: 'Premium noise-cancelling wireless headphones',
          short_description: 'Premium wireless headphones',
          price: '299.99', sku: 'HEADPHONES-001', stock: 8,
          images: ['/placeholder-image.svg'],
          category: { id: 1, name: 'Electronics', slug: 'electronics', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
          brand: 'AudioBrand', is_active: true, is_featured: true,
          average_rating: '4.2', review_count: 15,
          created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 3, name: 'Smart Watch', slug: 'smart-watch',
          description: 'Feature-rich smartwatch with health tracking',
          short_description: 'Feature-rich smartwatch',
          price: '399.99', sku: 'WATCH-001', stock: 12,
          images: ['/placeholder-image.svg'],
          category: { id: 1, name: 'Electronics', slug: 'electronics', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
          brand: 'WatchBrand', is_active: true, is_featured: true,
          average_rating: '4.7', review_count: 31,
          created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      setProducts([...mockProducts, ...loadLocalProducts()]);
    } catch (err: any) {
      setError('Error loading products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Image helpers ───────────────────────────────────────────────────────
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, image_url: '' })); // clear URL when file chosen
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    if (url) {
      setImagePreview(url);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Converts a File to base64 data URL for local-storage fallback
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ─── Modal open helpers ──────────────────────────────────────────────────
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '', description: '', short_description: '',
      price: '', sale_price: '', sku: '', stock: '',
      category_id: '', image_url: '',
      is_active: true, is_featured: false,
    });
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    const existingImage = product.images?.[0] || '';
    setFormData({
      name: product.name,
      description: product.description,
      short_description: product.short_description || '',
      price: product.price,
      sale_price: product.sale_price || '',
      sku: product.sku,
      stock: product.stock.toString(),
      category_id: product.category.id.toString(),
      image_url: '',
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setImageFile(null);
    setImagePreview(existingImage);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowModal(true);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Determine the final images array to send / store locally
    const resolveImages = async (): Promise<string[]> => {
      if (imageFile) {
        // Try sending the file via multipart; for local fallback use data URL
        return [await fileToDataUrl(imageFile)];
      }
      if (formData.image_url.trim()) return [formData.image_url.trim()];
      if (editingProduct) return editingProduct.images || ['/placeholder-image.svg'];
      return ['/placeholder-image.svg'];
    };

    // Build multipart FormData for file uploads
    const buildFormData = (images: string[]) => {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('short_description', formData.short_description);
      fd.append('price', formData.price);
      if (formData.sale_price) fd.append('sale_price', formData.sale_price);
      fd.append('sku', formData.sku);
      fd.append('stock', formData.stock);
      fd.append('category_id', formData.category_id);
      fd.append('is_active', formData.is_active ? '1' : '0');
      fd.append('is_featured', formData.is_featured ? '1' : '0');
      if (imageFile) {
        fd.append('images[]', imageFile);
      } else {
        images.forEach(img => fd.append('images[]', img));
      }
      return fd;
    };

    try {
      if (editingProduct) {
        try {
          let response;
          if (imageFile) {
            const fd = buildFormData([]);
            fd.append('_method', 'PUT');
            response = await api.post(`/admin/products/${editingProduct.id}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } else {
            const payload: any = { ...formData };
            if (formData.image_url.trim()) payload.images = [formData.image_url.trim()];
            delete payload.image_url;
            response = await api.put(`/admin/products/${editingProduct.id}`, payload);
          }

          if (response.data?.success) {
            setSuccess('Product updated successfully');
            setShowModal(false);
            loadProducts();
            return;
          }
          throw new Error(response.data?.message || 'Failed to update product');
        } catch (apiErr: any) {
          // Local fallback
          const images = await resolveImages();
          const updatedProducts = products.map(p =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  name: formData.name,
                  description: formData.description,
                  short_description: formData.short_description,
                  price: formData.price,
                  sale_price: formData.sale_price || undefined,
                  sku: formData.sku,
                  stock: parseInt(formData.stock),
                  images,
                  is_active: formData.is_active,
                  is_featured: formData.is_featured,
                  updated_at: new Date().toISOString(),
                }
              : p
          );
          setProducts(updatedProducts);
          setSuccess('Product updated locally (API unavailable)');
          setShowModal(false);
        }
      } else {
        try {
          let response;
          if (imageFile) {
            const fd = buildFormData([]);
            response = await api.post('/admin/products', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } else {
            const payload: any = { ...formData };
            if (formData.image_url.trim()) payload.images = [formData.image_url.trim()];
            delete payload.image_url;
            response = await api.post('/admin/products', payload);
          }

          if (response.data?.success) {
            setSuccess('Product created successfully');
            setShowModal(false);
            loadProducts();
            return;
          }
          throw new Error(response.data?.message || 'Failed to create product');
        } catch (apiErr: any) {
          if (apiErr.response?.status === 422) {
            const errors = apiErr.response.data?.errors;
            setError(`Validation error: ${Object.values(errors || {}).flat().join(', ')}`);
            return;
          }
          if (apiErr.response?.status === 403) {
            setError('You do not have permission to create products.');
            return;
          }

          // Local fallback
          const images = await resolveImages();
          const categoryObj = categories.find(c => c.id.toString() === formData.category_id);
          const newProduct: Product = {
            id: Date.now(),
            name: formData.name,
            slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
            description: formData.description,
            short_description: formData.short_description,
            price: formData.price,
            sale_price: formData.sale_price || undefined,
            sku: formData.sku,
            stock: parseInt(formData.stock),
            images,
            category: categoryObj ?? {
              id: parseInt(formData.category_id) || 0,
              name: 'Unknown',
              slug: 'unknown',
              sort_order: 0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            brand: undefined,
            is_active: formData.is_active,
            is_featured: formData.is_featured,
            average_rating: '0',
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const localProducts = loadLocalProducts();
          saveLocalProducts([...localProducts, newProduct]);
          setProducts(prev => [...prev, newProduct]);
          setSuccess('Product created locally (API unavailable)');
          setShowModal(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────
  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      try {
        const response = await api.delete(`/admin/products/${productId}`);
        if (response.data?.success) {
          setSuccess('Product deleted successfully');
          loadProducts();
          return;
        }
        throw new Error(response.data?.message || 'Failed to delete');
      } catch (apiErr: any) {
        if (apiErr.response?.status === 403) {
          setError('You do not have permission to delete products.');
          return;
        }
        const updated = products.filter(p => p.id !== productId);
        setProducts(updated);
        const updatedLocal = loadLocalProducts().filter((p: Product) => p.id !== productId);
        saveLocalProducts(updatedLocal);
        setSuccess('Product deleted locally (API unavailable)');
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error while deleting');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const getStatusBadge = (product: Product) => {
    if (!product.is_active) return <Badge bg="secondary">Inactive</Badge>;
    if (product.stock <= 0) return <Badge bg="danger">Out of Stock</Badge>;
    if (product.stock <= 10) return <Badge bg="warning">Low Stock</Badge>;
    return <Badge bg="success">In Stock</Badge>;
  };

  // ─── Render ──────────────────────────────────────────────────────────────
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

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
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
                            src={product.images?.[0] || '/placeholder-image.svg'}
                            alt={product.name}
                            className="rounded me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-image.svg'; }}
                          />
                          <div>
                            <div className="fw-bold">{product.name}</div>
                            <small className="text-muted">{product.short_description}</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>
                        {product.sale_price ? (
                          <>
                            <span className="fw-bold">₹{product.sale_price}</span>
                            <br />
                            <small className="text-muted text-decoration-line-through">₹{product.price}</small>
                          </>
                        ) : (
                          <span className="fw-bold">₹{product.price}</span>
                        )}
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
                              <i className="bi bi-pencil me-2"></i>Edit
                            </Dropdown.Item>
                            <Dropdown.Item href={`/products/${product.slug}`} target="_blank">
                              <i className="bi bi-eye me-2"></i>View
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item className="text-danger" onClick={() => handleDeleteProduct(product.id)}>
                              <i className="bi bi-trash me-2"></i>Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <i className="bi bi-box-seam fs-1 d-block mb-2"></i>
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>

        <Card.Footer className="bg-transparent">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {Array.isArray(products) ? products.length : 0} products
            </small>
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              />
              <Pagination.Item active>{currentPage}</Pagination.Item>
              <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} />
            </Pagination>
          </div>
        </Card.Footer>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>

            {/* ── Product Image ─────────────────────────────────────── */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Product Image</Form.Label>

              {/* Preview */}
              {imagePreview && (
                <div className="mb-2 position-relative d-inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="rounded border"
                    style={{ width: '120px', height: '120px', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-image.svg'; }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0"
                    style={{ padding: '0 4px', lineHeight: '1.2' }}
                    onClick={clearImage}
                    title="Remove image"
                  >
                    ×
                  </Button>
                </div>
              )}

              {/* File upload */}
              <div className="mb-2">
                <Form.Control
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                />
                <Form.Text className="text-muted">
                  Upload JPG, PNG, SVG, or WEBP (max 2 MB)
                </Form.Text>
              </div>

              {/* URL fallback */}
              <div>
                <Form.Label className="small text-muted mb-1">Or paste an image URL:</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com/product.jpg"
                  value={formData.image_url}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                />
              </div>
            </Form.Group>

            {/* ── Basic info ───────────────────────────────────────── */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
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
                  <Form.Label>SKU <span className="text-danger">*</span></Form.Label>
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
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Form.Group>

            {/* ── Pricing & Stock ──────────────────────────────────── */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sale Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* ── Category & Options ───────────────────────────────── */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
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
                    className="mb-1"
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
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
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
