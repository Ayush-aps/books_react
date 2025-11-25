/**
 * Filter Component
 * Sidebar filter for books browsing
 */

import { motion } from 'framer-motion';
import Card from './Card';
import Input from './Input';
import Button from './Button';
import { fadeInUp } from '../utils/animations';

const Filter = ({ filters, onFilterChange, genres = [], onClearFilters }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

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
            <Input
              type="text"
              id="search"
              name="search"
              value={filters.search || ''}
              onChange={handleInputChange}
              placeholder="Title or Author..."
            />
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
