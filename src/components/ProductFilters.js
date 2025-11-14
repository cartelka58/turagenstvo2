import React from 'react';
import { useServices } from '../contexts/ServicesContext';

const ProductFilters = () => {
  const { categories, selectedCategories, toggleCategory } = useServices();

  return (
    <div className="filter-section">
      <h3>Категории</h3>
      <div className="categories-list">
        {categories.map(category => (
          <label key={category.id} className="category-checkbox">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
            />
            <span className="checkmark"></span>
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ProductFilters;