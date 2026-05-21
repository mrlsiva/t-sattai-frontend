import React, { useState, useEffect, useRef } from 'react';
import {
  Row, Col, Card, Table, Button, Badge, Modal, Form,
  Pagination, InputGroup, Dropdown, Spinner, Alert, Image
} from 'react-bootstrap';
import { Product, Category } from '../../types';
import { productsApi } from '../../services/api';
import api from '../../utils/api';
import { resolveProductImage } from '../../utils/imageHelpers';

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

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Load additional products from localStorage
  const loadLocalProducts = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const resetImageState = () => {
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeNewImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const resolveImages = (): string[] => {
    if (existingImages.length > 0) return existingImages;
    if (formData.image_url) return [formData.image_url];
    return ['/placeholder-image.svg'];
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '', description: '', short_description: '',
      price: '', sale_price: '', sku: '', stock: '',
      category_id: '', image_url: '',
      is_active: true, is_featured: false,
    });
    resetImageState();
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
    resetImageState();
    // Load existing images
    const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    setExistingImages(imgs);
    setShowModal(true);
  };

  const buildFormData = (includeExisting: boolean) => {
    const data = new FormData();
    // Append all text fields — booleans must be "1"/"0" for Laravel validation
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        data.append(key, value ? '1' : '0');
      } else {
        data.append(key, String(value));
      }
    });
    // Append new image files
    imageFiles.forEach(file => data.append('images[]', file));
    // Append existing image URLs to keep (only for updates)
    if (includeExisting) {
      existingImages.forEach(url => data.append('existing_images[]', url));
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Use multipart when: new files selected, OR (editing and existing images were modified)
    const existingImageCount = editingProduct
      ? (Array.isArray(editingProduct.images) ? editingProduct.images.filter(Boolean).length : 0)
      : 0;
    const existingImagesChanged = editingProduct !== null && existingImages.length !== existingImageCount;
    const useMultipart = imageFiles.length > 0 || existingImagesChanged;

    // NOTE: Do NOT set Content-Type manually — Axios sets multipart/form-data
    // with the correct boundary automatically when the payload is FormData.
    const payload = useMultipart ? buildFormData(editingProduct !== null) : formData;

    try {
      console.log('AdminProducts: Submitting product to API:', formData);

      if (editingProduct) {
        try {
          // Laravel requires POST + _method=PUT for multipart file uploads
          const response = useMultipart
            ? await api.post(`/admin/products/${editingProduct.id}?_method=PUT`, payload)
            : await api.put(`/admin/products/${editingProduct.id}`, payload);
          
          if (response.data?.success) {
            setSuccess('Product updated successfully');
            setShowModal(false);
            loadProducts();
            return;
          }
          throw new Error(response.data?.message || 'Failed to update product');
        } catch (apiErr: any) {
          // Local fallback
          const images = resolveImages();
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
          const response = await api.post('/admin/products', payload);
          
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
          const images = resolveImages();
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

  const handleToggleStatus = async (product: Product) => {
    const newStatus = !product.is_active;
    const action = newStatus ? 'activate' : 'deactivate';

    try {
      try {
        const response = await api.patch(`/admin/products/${product.id}/toggle-status`, { is_active: newStatus });
        if (response.data?.success) {
          setSuccess(`Product ${action}d successfully`);
          loadProducts();
          return;
        }
        throw new Error(response.data?.message || `Failed to ${action} product`);
      } catch (apiError: any) {
        if (apiError.response?.status === 403) {
          setError('You do not have permission to perform this action.');
          return;
        }
        // Fallback: update locally if API is unavailable
        setProducts(prev =>
          prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p)
        );
        setSuccess(`Product ${action}d locally (API unavailable)`);
      }
    } catch (error: any) {
      setError(error.message || `Failed to ${action} product`);
    }
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
                            src={resolveProductImage(product.images?.[0])}
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
                              <i className="bi bi-pencil me-2"></i>Edit
                            </Dropdown.Item>
                            <Dropdown.Item href={`/products/${product.slug}`} target="_blank">
                              <i className="bi bi-eye me-2"></i>View
                            </Dropdown.Item>
                            <Dropdown.Item
                              className={product.is_active ? 'text-warning' : 'text-success'}
                              onClick={() => handleToggleStatus(product)}
                            >
                              {product.is_active ? (
                                <>
                                  <i className="bi bi-pause-circle me-2"></i>
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check-circle me-2"></i>
                                  Activate
                                </>
                              )}
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

            {/* Image Upload */}
            <Form.Group className="mb-3">
              <Form.Label>Product Images</Form.Label>

              {/* Existing images (edit mode) */}
              {existingImages.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted d-block mb-1">Current images</small>
                  <div className="d-flex flex-wrap gap-2">
                    {existingImages.map((src, idx) => (
                      <div key={idx} className="position-relative">
                        <Image
                          src={resolveProductImage(src)}
                          alt={`existing-${idx}`}
                          width={80}
                          height={80}
                          style={{ objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6' }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-image.svg'; }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                          style={{ width: '20px', height: '20px', fontSize: '10px', lineHeight: 1, borderRadius: '50%', transform: 'translate(50%,-50%)' }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New image previews */}
              {imagePreviews.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted d-block mb-1">New images to upload</small>
                  <div className="d-flex flex-wrap gap-2">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="position-relative">
                        <Image
                          src={src}
                          alt={`preview-${idx}`}
                          width={80}
                          height={80}
                          style={{ objectFit: 'cover', borderRadius: '6px', border: '2px solid #0d6efd' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                          style={{ width: '20px', height: '20px', fontSize: '10px', lineHeight: 1, borderRadius: '50%', transform: 'translate(50%,-50%)' }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File picker */}
              <div
                className="border border-2 border-dashed rounded p-3 text-center"
                style={{ cursor: 'pointer', borderColor: '#0d6efd44' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="bi bi-cloud-upload fs-3 text-primary d-block mb-1"></i>
                <small className="text-muted">
                  Click to upload images (JPG, PNG, WebP) — multiple allowed
                </small>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="d-none"
                  onChange={handleImageChange}
                />
              </div>
            </Form.Group>
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
