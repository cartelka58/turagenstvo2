import React from 'react';
import { useServices } from '../contexts/ServicesContext';

const CategoryFilter = () => {
  const { categories, selectedCategories, toggleCategory, services } = useServices();

  // Функция для подсчета количества туров по категории
  const getToursCountByCategory = (categoryId) => {
    return services.filter(service => service.category_id === categoryId).length;
  };

  return (
    <div className="filter-section">
      <h3>Категории</h3>
      <div className="categories-list">
        {categories.map(category => {
          const toursCount = getToursCountByCategory(category.id);
          return (
            <label key={category.id} className="category-checkbox">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              <span className="checkmark"></span>
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span className="category-count">({toursCount})</span>
            </label>
          );
        })}
      </div>
      
      {selectedCategories.length > 0 && (
        <button 
          onClick={() => {
            selectedCategories.forEach(catId => toggleCategory(catId));
          }}
          className="clear-categories-btn"
        >
          Сбросить категории
        </button>
      )}
    </div>
  );
};

export default CategoryFilter;