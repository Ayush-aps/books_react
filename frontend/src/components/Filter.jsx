/**
 * Filter Component
 * Sidebar filter for books browsing
 */

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Card from './Card';
import Input from './Input';
import Button from './Button';
import { fadeInUp } from '../utils/animations';

const Filter = ({ filters, onFilterChange, genres = [], onClearFilters }) => {
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Show searching indicator for search field
    if (name === 'search') {
      setIsSearching(true);
      
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Set timeout to hide indicator after debounce period
      searchTimeoutRef.current = setTimeout(() => {
        setIsSearching(false);
      }, 600);
    }
    
    onFilterChange({ [name]: value });
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const activeFilterCount = Object.keys(filters).filter(key => filters[key]).length;

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card elevated padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="heading-4">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="text-xs text-text-tertiary mt-1">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-accent-brown hover:text-accent-brown/80 font-medium transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-6">        {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-text-primary mb-2">
              Search
            </label>
            <div className="relative">
              <Input
                type="text"
                id="search"
                name="search"
                value={filters.search || ''}
                onChange={handleInputChange}
                placeholder="Title or Author..."
                floatingLabel={false}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                iconPosition="left"
              />
              {/* Clear Search Button */}
              {filters.search && !isSearching && (
                <button
                  onClick={() => handleInputChange({ target: { name: 'search', value: '' } })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {/* Searching Indicator */}
              {isSearching && filters.search && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <svg className="animate-spin h-4 w-4 text-accent-brown" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Genre */}
          {genres.length > 0 && (
            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-text-primary mb-2">
                Genre
              </label>
              <select
                id="genre"
                name="genre"
                value={filters.genre || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-brown focus:border-transparent bg-white text-text-primary transition-all"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Condition */}
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-text-primary mb-2">
              Condition
            </label>
            <select
              id="condition"
              name="condition"
              value={filters.condition || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-brown focus:border-transparent bg-white text-text-primary transition-all"
            >
              <option value="">All Conditions</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Price Range
            </label>
            <div className="flex gap-3">
              <Input
                type="number"
                name="minPrice"
                value={filters.minPrice || ''}
                onChange={handleInputChange}
                placeholder="Min"
                min="0"
              />
              <span className="text-text-tertiary self-center">—</span>
              <Input
                type="number"
                name="maxPrice"
                value={filters.maxPrice || ''}
                onChange={handleInputChange}
                placeholder="Max"
                min="0"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-text-primary mb-2">
              Sort By
            </label>
            <select
              id="sort"
              name="sort"
              value={filters.sort || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-brown focus:border-transparent bg-white text-text-primary transition-all"
            >
              <option value="">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Apply Filters Button - Mobile Only */}
          <div className="lg:hidden pt-4">
            <Button variant="primary" size="md" fullWidth>
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default Filter;
