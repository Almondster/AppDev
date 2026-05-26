import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Heart, Star, Clock, X, Save, Trash2 } from 'lucide-react';
import { fetchServices } from '../api';
import { readCollection } from '../utils/collections';
import SearchFilters from '../components/SearchFilters';
import { trackSearchQuery } from '../utils/recommendations';
import '../styles/MarketplacePage.css';

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: null,
    minRating: 0,
    maxDeliveryDays: null,
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [favoriteServices, setFavoriteServices] = useState([]);
  const suggestionsRef = useRef(null);

  const applyLocalFilters = useCallback((items) => {
    return items.filter((service) => {
      if (filters.minRating > 0 && (Number(service.rating || 0)) < filters.minRating) {
        return false;
      }
      if (
        filters.maxDeliveryDays &&
        (service.delivery_days || 0) > filters.maxDeliveryDays
      ) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const applySorting = useCallback((items) => {
    const sorted = [...items];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (Number(b.rating || 0)) - (Number(a.rating || 0)));
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return sorted;
  }, [sortBy]);

  // Load saved searches and favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('createch_saved_searches');
    if (saved) setSavedSearches(JSON.parse(saved));

    const favorites = localStorage.getItem('createch_favorite_services');
    if (favorites) setFavoriteServices(JSON.parse(favorites));
  }, []);

  // Fetch services on filter or query change
  useEffect(() => {
    const fetchFilteredServices = async () => {
      setLoading(true);
      
      // Track search query and filters
      if (searchQuery.trim()) {
        trackSearchQuery(searchQuery, filters);
      }
      
      try {
        const params = {
          search: searchQuery,
          category: filters.category || undefined,
          min_price: filters.minPrice || undefined,
          max_price: filters.maxPrice || undefined,
        };
        const res = await fetchServices(params);
        if (res.ok) {
          let items = readCollection(res);
          items = applyLocalFilters(items);
          items = applySorting(items);
          setServices(items);
          generateSuggestions(items);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchFilteredServices, 300);
    return () => clearTimeout(debounce);
  }, [applyLocalFilters, applySorting, filters, searchQuery]);

  const generateSuggestions = (items) => {
    const suggestionSet = new Set();
    items.forEach((service) => {
      if (service.title) suggestionSet.add(service.title);
      if (service.category) suggestionSet.add(service.category);
    });
    setSuggestions(Array.from(suggestionSet).slice(0, 8));
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;

    const newSavedSearch = {
      id: Date.now(),
      name: saveSearchName,
      query: searchQuery,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSavedSearch];
    setSavedSearches(updated);
    localStorage.setItem('createch_saved_searches', JSON.stringify(updated));
    setSaveSearchName('');
    setShowSaveSearch(false);
  };

  const handleLoadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
  };

  const handleDeleteSavedSearch = (id) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('createch_saved_searches', JSON.stringify(updated));
  };

  const toggleFavorite = (serviceId) => {
    const updated = favoriteServices.includes(serviceId)
      ? favoriteServices.filter((id) => id !== serviceId)
      : [...favoriteServices, serviceId];
    setFavoriteServices(updated);
    localStorage.setItem('createch_favorite_services', JSON.stringify(updated));
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      minPrice: 0,
      maxPrice: null,
      minRating: 0,
      maxDeliveryDays: null,
    });
    setSearchQuery('');
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="marketplace-page">
      <div className="marketplace-header">
        <h1>Discover Services</h1>
        <p>Find the perfect service for your needs</p>
      </div>

      <div className="search-bar-container">
        <div className="search-bar-wrapper" ref={suggestionsRef}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-bar"
            placeholder="Search services, categories, or creators..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery && setShowSuggestions(true)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
            >
              <X size={18} />
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              <div className="suggestions-header">
                <span className="suggestions-label">Suggestions</span>
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Search size={16} />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="save-search-btn"
          onClick={() => setShowSaveSearch(!showSaveSearch)}
          title="Save this search"
        >
          <Save size={18} />
        </button>
      </div>

      {showSaveSearch && (
        <div className="save-search-form">
          <input
            type="text"
            placeholder="Name this search..."
            value={saveSearchName}
            onChange={(e) => setSaveSearchName(e.target.value)}
            maxLength={50}
          />
          <button onClick={handleSaveSearch} className="save-btn">
            Save
          </button>
          <button
            onClick={() => setShowSaveSearch(false)}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      )}

      {savedSearches.length > 0 && (
        <div className="saved-searches">
          <h3>Saved Searches</h3>
          <div className="saved-searches-list">
            {savedSearches.map((search) => (
              <div key={search.id} className="saved-search-item">
                <button
                  className="saved-search-btn"
                  onClick={() => handleLoadSavedSearch(search)}
                >
                  <Search size={16} />
                  <span>{search.name}</span>
                </button>
                <button
                  className="delete-saved-btn"
                  onClick={() => handleDeleteSavedSearch(search.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="marketplace-content">
        <aside className="marketplace-sidebar">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearAll={handleClearFilters}
          />
        </aside>

        <main className="marketplace-main">
          <div className="results-toolbar">
            <div className="results-info">
              <span className="result-count">{services.length} services found</span>
            </div>
            <div className="sort-controls">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="relevance">Relevance</option>
                <option value="recent">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Finding services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>No services found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={handleClearFilters} className="reset-btn">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service) => (
                <div key={service.id} className="service-card">
                  <div className="service-image-container">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="service-image"
                      />
                    ) : (
                      <div className="service-image-placeholder">No image</div>
                    )}
                    <button
                      className={`favorite-btn ${
                        favoriteServices.includes(service.id) ? 'active' : ''
                      }`}
                      onClick={() => toggleFavorite(service.id)}
                    >
                      <Heart
                        size={20}
                        fill={favoriteServices.includes(service.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  <div className="service-content">
                    <div className="service-category">
                      <span className="category-badge">{service.category}</span>
                    </div>
                    <h3 className="service-title">{service.title}</h3>
                    <p className="service-description">{service.description}</p>

                    <div className="service-meta">
                      <div className="rating-info">
                        <Star size={16} fill="#fbbf24" color="#fbbf24" />
                        <span className="rating-value">
                          {(Number(service.rating || 0)).toFixed(1)}
                        </span>
                      </div>
                      <div className="delivery-info">
                        <Clock size={16} />
                        <span>{service.delivery_days || 7} days</span>
                      </div>
                    </div>

                    <div className="service-footer">
                      <div className="service-price">
                        <span className="price-label">From</span>
                        <span className="price-value">₱{service.price || 0}</span>
                      </div>
                      <a href={`/services/${service.id}`} className="view-btn">
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MarketplacePage;
