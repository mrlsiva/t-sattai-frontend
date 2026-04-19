import React, { useState, useEffect, useRef } from 'react';
import {
  Row, Col, Card, Table, Button, Badge, Modal, Form,
  Alert, InputGroup, Spinner, Image
} from 'react-bootstrap';
import { Category } from '../../types';
import { categoriesApi } from '../../services/api';
import api from '../../utils/api';
import { resolveCategoryImage } from '../../utils/imageHelpers';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: '',
    is_active: true,
  });

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // Reload when search term changes

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('AdminCategories: Loading categories...');
      
      // Try to fetch categories from admin API first (shows all categories including inactive)
      try {
        console.log('AdminCategories: Trying admin categories API...');
        const params = new URLSearchParams();
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        const response = await api.get(`/admin/categories?${params.toString()}`);
        console.log('AdminCategories: Admin categories API response:', response);
        
        if (response.data?.success && response.data?.data) {
          console.log('AdminCategories: Successfully loaded from admin API:', response.data.data.length);
          setCategories(Array.isArray(response.data.data) ? response.data.data : []);
          return; // Exit early if API works
        }
      } catch (adminApiError) {
        console.log('AdminCategories: Admin API failed, trying regular categories API...');
        
        // Fallback to regular categories API
        try {
          const response = await categoriesApi.getAll();
          console.log('AdminCategories: Regular categories API response:', response);
          
          if (response.success && response.data) {
            console.log('AdminCategories: Successfully loaded from regular API:', response.data.length);
            setCategories(Array.isArray(response.data) ? response.data : []);
            return; // Exit early if API works
          }
        } catch (regularApiError) {
          console.error('AdminCategories: Regular API also failed:', regularApiError);
        }
      }
      
      // Fallback to mock data if both APIs fail
      console.log('AdminCategories: Both APIs failed, using mock data');
      setCategories(getMockCategories());
    } catch (error: any) {
      console.error('AdminCategories: Error loading categories:', error);
      setError('Error loading categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getMockCategories = (): Category[] => {
    return [
      {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        sort_order: 1,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        sort_order: 2,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and garden supplies',
        sort_order: 3,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 4,
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Sports equipment and outdoor gear',
        sort_order: 4,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 5,
        name: 'Books',
        slug: 'books',
        description: 'Books and literature',
        sort_order: 5,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ];
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      sort_order: '',
      is_active: true,
    });
    resetImageState();
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order.toString(),
      is_active: category.is_active,
    });
    resetImageState();
    setExistingImage(resolveCategoryImage(category.image, category.display_image));
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const buildCategoryPayload = () => {
    if (!imageFile) return formData;
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // Laravel boolean validation requires "1"/"0", not "true"/"false"
      if (typeof value === 'boolean') {
        data.append(key, value ? '1' : '0');
      } else {
        data.append(key, String(value));
      }
    });
    data.append('image', imageFile);
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const useMultipart = imageFile !== null;
    const payload = buildCategoryPayload();

    try {
      console.log('AdminCategories: Submitting category:', formData);

      if (editingCategory) {
        // Update existing category
        try {
          const response = useMultipart
            ? await api.post(`/admin/categories/${editingCategory.id}?_method=PUT`, payload)
            : await api.put(`/admin/categories/${editingCategory.id}`, payload);
          
          if (response.data?.success) {
            console.log('AdminCategories: Category updated successfully via API');
            setSuccess('Category updated successfully');
            setShowModal(false);
            loadCategories(); // Reload categories from API
          } else {
            throw new Error(response.data?.message || 'Failed to update category');
          }
        } catch (apiError: any) {
          console.error('AdminCategories: API update failed:', apiError);
          
          if (apiError.response?.status === 422) {
            const errors = apiError.response.data?.errors;
            const errorMessages = Object.values(errors || {}).flat().join(', ');
            setError(`Validation error: ${errorMessages}`);
            return;
          }
          
          if (apiError.response?.status === 403) {
            setError('You do not have permission to update categories. Please ensure you are logged in as an admin.');
            return;
          }
          
          // Fallback to local update if API fails
          const updatedCategories = categories.map(category => 
            category.id === editingCategory.id ? {
              ...category,
              name: formData.name,
              slug: formData.slug,
              description: formData.description,
              sort_order: parseInt(formData.sort_order) || 1,
              is_active: formData.is_active,
              updated_at: new Date().toISOString()
            } : category
          );
          setCategories(updatedCategories);
          setSuccess('Category updated locally (API unavailable)');
          setShowModal(false);
        }
      } else {
        // Create new category
        try {
          const response = await api.post('/admin/categories', payload);
          
          if (response.data?.success) {
            console.log('AdminCategories: Category created successfully via API:', response.data.data);
            setSuccess('Category created successfully');
            setShowModal(false);
            loadCategories(); // Reload categories from API
          } else {
            throw new Error(response.data?.message || 'Failed to create category');
          }
        } catch (apiError: any) {
          console.error('AdminCategories: API creation failed:', apiError);
          
          if (apiError.response?.status === 422) {
            const errors = apiError.response.data?.errors;
            const errorMessages = Object.values(errors || {}).flat().join(', ');
            setError(`Validation error: ${errorMessages}`);
            return;
          }
          
          if (apiError.response?.status === 403) {
            setError('You do not have permission to create categories. Please ensure you are logged in as an admin.');
            return;
          }
          
          // Fallback to local creation if API fails
          console.log('AdminCategories: API failed, falling back to local storage');
          
          const newCategory: Category = {
            id: Date.now(), // Simple ID generation for demo
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            sort_order: parseInt(formData.sort_order) || 1,
            is_active: formData.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setCategories(prevCategories => [...prevCategories, newCategory]);
          setSuccess('Category created locally (API unavailable)');
          setShowModal(false);
        }
      }
    } catch (error: any) {
      console.error('AdminCategories: Unexpected error:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        console.log('AdminCategories: Deleting category via API:', categoryId);
        
        // Try to delete via API first
        try {
          const response = await api.delete(`/admin/categories/${categoryId}`);
          
          if (response.data?.success) {
            console.log('AdminCategories: Category deleted successfully via API');
            setSuccess('Category deleted successfully');
            loadCategories(); // Reload categories from API
          } else {
            throw new Error(response.data?.message || 'Failed to delete category');
          }
        } catch (apiError: any) {
          console.error('AdminCategories: API deletion failed:', apiError);
          
          if (apiError.response?.status === 403) {
            setError('You do not have permission to delete categories. Please ensure you are logged in as an admin.');
            return;
          }
          
          if (apiError.response?.status === 409) {
            setError('Cannot delete category because it has associated products. Please remove products from this category first.');
            return;
          }
          
          // Fallback to local deletion if API fails
          console.log('AdminCategories: API failed, falling back to local deletion');
          
          const updatedCategories = categories.filter(category => category.id !== categoryId);
          setCategories(updatedCategories);
          setSuccess('Category deleted locally (API unavailable)');
        }
      } catch (error: any) {
        console.error('AdminCategories: Unexpected error during deletion:', error);
        setError(error.message || 'An unexpected error occurred while deleting the category');
      }
    }
  };

  const getStatusBadge = (category: Category) => {
    return category.is_active ? 
      <Badge bg="success">Active</Badge> : 
      <Badge bg="secondary">Inactive</Badge>;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Categories Management</h1>
        <Button variant="primary" onClick={handleAddCategory}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Category
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Search */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline-secondary">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <small className="text-muted">
                {filteredCategories.length} of {categories.length} categories
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Categories Table */}
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
                  <th>Image</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((category) => (
                    <tr key={category.id}>
                      <td>
                        {resolveCategoryImage(category.image, category.display_image) ? (
                          <img
                            src={resolveCategoryImage(category.image, category.display_image)!}
                            alt={category.name}
                            width={48}
                            height={48}
                            style={{ objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6' }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center bg-light rounded"
                            style={{ width: 48, height: 48 }}
                          >
                            <i className="bi bi-image text-muted"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold">{category.name}</div>
                      </td>
                      <td>
                        <code className="small bg-light px-2 py-1 rounded">{category.slug}</code>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {category.description || '-'}
                        </div>
                      </td>
                      <td>{category.sort_order}</td>
                      <td>{getStatusBadge(category)}</td>
                      <td>
                        <small className="text-muted">
                          {new Date(category.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="text-muted">
                        <i className="bi bi-folder2-open fs-1 d-block mb-2"></i>
                        {searchTerm ? 'No categories match your search' : 'No categories found'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="Enter category name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Slug <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                    placeholder="category-slug"
                  />
                  <Form.Text className="text-muted">
                    URL-friendly version of the name. Auto-generated from name.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the category"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                    placeholder="1"
                  />
                  <Form.Text className="text-muted">
                    Lower numbers appear first in category lists.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-block">Status</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Form.Text className="text-muted">
                    Only active categories are visible to customers.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            {/* Category Image */}
            <Form.Group className="mb-3">
              <Form.Label>Category Image</Form.Label>

              {/* Current image (edit mode) */}
              {existingImage && !imagePreview && (
                <div className="mb-2 d-flex align-items-center gap-3">
                  <Image
                    src={existingImage}
                    alt="Current"
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }}
                  />
                  <div>
                    <small className="text-muted d-block">Current image</small>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="mt-1"
                      type="button"
                      onClick={() => setExistingImage(null)}
                    >
                      <i className="bi bi-trash me-1"></i>Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* New image preview */}
              {imagePreview && (
                <div className="mb-2 d-flex align-items-center gap-3">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: '8px', border: '2px solid #0d6efd' }}
                  />
                  <div>
                    <small className="text-muted d-block">New image</small>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="mt-1"
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <i className="bi bi-x-circle me-1"></i>Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload area */}
              <div
                className="border border-2 border-dashed rounded p-3 text-center"
                style={{ cursor: 'pointer', borderColor: '#0d6efd44' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="bi bi-cloud-upload fs-3 text-primary d-block mb-1"></i>
                <small className="text-muted">
                  Click to upload category image (JPG, PNG, WebP)
                </small>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="d-none"
                  onChange={handleImageChange}
                />
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCategories;