import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { fetchCategories } from '../api';
import { readCollection } from '../utils/collections';
import './SearchFilters.css';

const SearchFilters = ({ filters, onFiltersChange, onClearAll }) => {
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchCategories();
        if (res.ok) {
          setCategories(readCollection(res));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    })();
  }, []);

  const handleCategoryChange = (category) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? '' : category,
    });
    setShowCategoryDropdown(false);
  };

  const handlePriceRangeChange = (min, max) => {
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
    setShowPriceDropdown(false);
  };

  const handleRatingChange = (rating) => {
    onFiltersChange({
      ...filters,
      minRating: filters.minRating === rating ? 0 : rating,
    });
  };

  const handleDeliveryTimeChange = (days) => {
    onFiltersChange({
      ...filters,
      maxDeliveryDays: filters.maxDeliveryDays === days ? null : days,
    });
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== null && v !== undefined && v !== '' && v !== 0
  ).length;

  return (
    <div className="search-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        {activeFilterCount > 0 && (
          <button className="clear-all-btn" onClick={onClearAll}>
            Clear All ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <label className="filter-label">Category</label>
        <div className="filter-dropdown-wrapper">
          <button
            className="filter-dropdown-toggle"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <span>{filters.category || 'All Categories'}</span>
            <ChevronDown size={18} />
          </button>
          {showCategoryDropdown && (
            <div className="filter-dropdown">
              <button
                className={`filter-option ${!filters.category ? 'active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-option ${filters.category === cat.name ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <label className="filter-label">Price Range</label>
        <div className="filter-dropdown-wrapper">
          <button
            className="filter-dropdown-toggle"
            onClick={() => setShowPriceDropdown(!showPriceDropdown)}
          >
            <span>
              {filters.minPrice || filters.maxPrice
                ? `₱${filters.minPrice || 0} - ₱${filters.maxPrice || '∞'}`
                : 'All Prices'}
            </span>
            <ChevronDown size={18} />
          </button>
          {showPriceDropdown && (
            <div className="filter-dropdown">
              <button
                className={`filter-option ${!filters.minPrice && !filters.maxPrice ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange(0, null)}
              >
                All Prices
              </button>
              <button
                className={`filter-option ${filters.minPrice === 0 && filters.maxPrice === 5000 ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange(0, 5000)}
              >
                Under ₱5,000
              </button>
              <button
                className={`filter-option ${filters.minPrice === 5000 && filters.maxPrice === 15000 ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange(5000, 15000)}
              >
                ₱5,000 - ₱15,000
              </button>
              <button
                className={`filter-option ${filters.minPrice === 15000 && filters.maxPrice === 50000 ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange(15000, 50000)}
              >
                ₱15,000 - ₱50,000
              </button>
              <button
                className={`filter-option ${filters.minPrice === 50000 && !filters.maxPrice ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange(50000, null)}
              >
                Over ₱50,000
              </button>
            </div>
          )}
        </div>
        {(filters.minPrice || filters.maxPrice) && (
          <button
            className="filter-remove-btn"
            onClick={() => handlePriceRangeChange(0, null)}
          >
            <X size={16} /> Clear price
          </button>
        )}
      </div>

      {/* Minimum Rating Filter */}
      <div className="filter-section">
        <label className="filter-label">Minimum Rating</label>
        <div className="filter-buttons">
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <button
              key={rating}
              className={`rating-button ${filters.minRating === rating ? 'active' : ''}`}
              onClick={() => handleRatingChange(rating)}
            >
              {rating === 0 ? 'Any' : `${rating}★+`}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Time Filter */}
      <div className="filter-section">
        <label className="filter-label">Delivery Time</label>
        <div className="filter-buttons">
          {[1, 3, 7, 14, null].map((days) => (
            <button
              key={days || 'any'}
              className={`delivery-button ${filters.maxDeliveryDays === days ? 'active' : ''}`}
              onClick={() => handleDeliveryTimeChange(days)}
            >
              {days === null ? 'Any' : `${days} day${days !== 1 ? 's' : ''}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
