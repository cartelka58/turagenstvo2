import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleImageError = (e) => {
    // Если картинка не загружается, используем заглушку
    e.target.src = '/images/default-tour.jpg';
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.image_url || '/images/default-tour.jpg'} 
          alt={product.name}
          onError={handleImageError}
        />
        <div className="product-overlay">
          <button className="add-button" onClick={handleAddToCart}>
            <span>+</span>
            Добавить в корзину
          </button>
        </div>
        {product.is_discounted && (
          <div className="discount-badge">-{product.discount_percentage}%</div>
        )}
        {product.is_popular && (
          <div className="popular-badge">Популярный</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-meta">
          <span className="product-duration">⏱️ {product.duration_days || '7-14'} дней</span>
          <span className="product-rating">⭐ 4.8</span>
          <span className="product-destination">🏙️ {product.destination}</span>
        </div>
        <p className="product-description">{product.short_description || product.description}</p>
        <div className="product-footer">
          <div className="product-price">
            {product.is_discounted ? (
              <>
                <span className="price-amount discounted">{product.price?.toLocaleString('ru-RU')} ₽</span>
                <span className="original-price">{product.original_price?.toLocaleString('ru-RU')} ₽</span>
              </>
            ) : (
              <span className="price-amount">{product.price?.toLocaleString('ru-RU')} ₽</span>
            )}
            <span className="price-person">за человека</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;