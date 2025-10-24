import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
  categories: Array<{ id: number; name: string }>;
  loading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFiltersChange,
  categories = [],
  loading = false
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'name',
    sortOrder: searchParams.get('sortOrder') || 'asc'
  });

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
    
    // Notify parent component
    onFiltersChange(filters);
  }, [filters, onFiltersChange, setSearchParams]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    navigate('/products');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the filter change
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-filter me-2"></i>
          Filters & Search
        </h5>
      </div>
      <div className="card-body">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="mb-3">
          <label className="form-label">Search Products</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              disabled={loading}
            />
            <button className="btn btn-outline-primary" type="submit" disabled={loading}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>

        {/* Category Filter */}
        <div className="mb-3">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            disabled={loading}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="mb-3">
          <label className="form-label">Price Range</label>
          <div className="row g-2">
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
            <div className="col-auto d-flex align-items-center">
              <span>to</span>
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mb-3">
          <label className="form-label">Sort By</label>
          <div className="row g-2">
            <div className="col">
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                disabled={loading}
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="created_at">Newest</option>
                <option value="average_rating">Rating</option>
              </select>
            </div>
            <div className="col">
              <select
                className="form-select"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                disabled={loading}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        <button
          className="btn btn-outline-secondary w-100"
          onClick={handleClearFilters}
          disabled={loading}
        >
          <i className="fas fa-times me-2"></i>
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;