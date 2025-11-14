import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useServices } from '../contexts/ServicesContext';
import ProductCard from '../common/ProductCard';
import CategoryFilter from '../components/CategoryFilter';

const Products = () => {
  const { addToCart } = useCart();
  const { services, categories, selectedCategories, isLoading, error, toggleCategory, clearAllCategories } = useServices();
  const [showSuccess, setShowSuccess] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const navigate = useNavigate();

  // Отладочная информация
  useEffect(() => {
    console.log('🔄 Products component rendered');
    console.log('📊 Total services:', services.length);
    console.log('🎯 Selected categories:', selectedCategories);
    console.log('📋 All categories:', categories);
  }, [services, selectedCategories, categories]);

  const handleAddToCart = (product) => {
    addToCart(product);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // Фильтрация и сортировка
  const filteredAndSortedServices = services
    .filter(service => {
      const serviceCategoryId = service.category_id?.toString();
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(serviceCategoryId);
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.short_description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1];
      
      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'duration':
          return (a.duration_days || 0) - (b.duration_days || 0);
        case 'popular':
          return (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const popularTours = services.filter(tour => tour.is_popular).slice(0, 3);
  const discountedTours = services.filter(tour => tour.is_discounted).slice(0, 3);

  const handleClearAllFilters = () => {
    clearAllCategories();
    setSearchTerm('');
    setPriceRange([0, 1000000]);
    setSortBy('name');
  };

  if (isLoading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка туров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page">
        <div className="error-container">
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Наши туры</h1>
        <p>
          {filteredAndSortedServices.length > 0 
            ? `Найдено ${filteredAndSortedServices.length} туров`
            : 'Туры не найдены'
          }
        </p>
      </div>

      {showSuccess && (
        <div className="success-notification">
          <div className="notification-content">
            <span className="notification-icon">✅</span>
            <span>Тур добавлен в корзину!</span>
            <button 
              onClick={() => navigate('/cart')} 
              className="notification-button"
            >
              Перейти в корзину
            </button>
          </div>
        </div>
      )}

      {/* Отладочная информация */}
      <div className="debug-info">
        <div>Выбрано категорий: {selectedCategories.length}</div>
        <div>Всего туров: {services.length}</div>
        <div>Отфильтровано: {filteredAndSortedServices.length}</div>
      </div>

      {/* Популярные туры */}
      {popularTours.length > 0 && (
        <section className="featured-section">
          <h2>🔥 Популярные туры</h2>
          <div className="featured-tours">
            {popularTours.map(tour => (
              <div key={tour.id} className="featured-tour-card">
                <div className="featured-tour-image">
                  <img src={tour.image_url || '/images/default-tour.jpg'} alt={tour.name} />
                  <div className="popular-badge">Популярный</div>
                </div>
                <div className="featured-tour-info">
                  <h3>{tour.name}</h3>
                  <p>{tour.short_description}</p>
                  <div className="tour-features">
                    <span>⏱️ {tour.duration_days} дней</span>
                    <span>⭐ {tour.rating || 4.8}</span>
                    <span>🏙️ {tour.destination}</span>
                  </div>
                  <div className="featured-tour-price">
                    {tour.is_discounted ? (
                      <>
                        <span className="original-price">{tour.original_price?.toLocaleString('ru-RU')} ₽</span>
                        <span className="current-price">{tour.price?.toLocaleString('ru-RU')} ₽</span>
                      </>
                    ) : (
                      <span className="current-price">{tour.price?.toLocaleString('ru-RU')} ₽</span>
                    )}
                  </div>
                  <div className="featured-tour-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => handleAddToCart(tour)}
                    >
                      Добавить в корзину
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate(`/tour/${tour.id}`)}
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="products-container">
        {/* Фильтры */}
        <aside className="filters-sidebar">
          <div className="filter-section">
            <h3>Поиск</h3>
            <input
              type="text"
              placeholder="Поиск туров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <CategoryFilter />

          <div className="filter-section">
            <h3>Цена</h3>
            <div className="price-filter">
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="price-slider"
              />
              <div className="price-labels">
                <span>0 ₽</span>
                <span>до {priceRange[1].toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h3>Сортировка</h3>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">По названию</option>
              <option value="price-low">Сначала дешевые</option>
              <option value="price-high">Сначала дорогие</option>
              <option value="duration">По длительности</option>
              <option value="popular">Популярные</option>
            </select>
          </div>

          {/* Акционные туры */}
          {discountedTours.length > 0 && (
            <div className="discounts-sidebar">
              <h4>🎁 Акционные предложения</h4>
              {discountedTours.map(tour => (
                <div key={tour.id} className="discount-item">
                  <img src={tour.image_url || '/images/default-tour.jpg'} alt={tour.name} />
                  <div className="discount-info">
                    <span className="discount-name">{tour.name}</span>
                    <span className="discount-price">{tour.price?.toLocaleString('ru-RU')} ₽</span>
                    <span className="discount-percent">-{tour.discount_percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Кнопка сброса всех фильтров */}
          {(selectedCategories.length > 0 || searchTerm || priceRange[1] < 1000000) && (
            <button 
              onClick={handleClearAllFilters}
              className="clear-all-filters-btn"
            >
              🗑️ Сбросить все фильтры
            </button>
          )}
        </aside>

        {/* Основной контент */}
        <main className="products-main">
          {selectedCategories.length > 0 && (
            <div className="active-filters">
              <span>Активные фильтры: </span>
              {selectedCategories.map(catId => {
                const category = categories.find(c => c.id === catId);
                return category ? (
                  <span key={catId} className="active-filter-tag">
                    {category.icon} {category.name}
                    <button 
                      onClick={() => toggleCategory(catId)}
                      className="remove-filter"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
              <button 
                onClick={clearAllCategories}
                className="clear-filters"
              >
                Очистить категории
              </button>
            </div>
          )}

          <div className="products-grid">
            {filteredAndSortedServices.map(tour => (
              <ProductCard 
                key={tour.id} 
                product={tour} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {filteredAndSortedServices.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Туры не найдены</h3>
              <p>Попробуйте изменить параметры фильтрации или выбрать другие категории</p>
              <button 
                onClick={handleClearAllFilters}
                className="cta-button"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;