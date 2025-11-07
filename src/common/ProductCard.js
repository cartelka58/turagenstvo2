import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
        <div className="product-overlay">
          <button className="add-button" onClick={handleAddToCart}>
            <span>+</span>
            Добавить в корзину
          </button>
        </div>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-meta">
          <span className="product-duration">⏱️ 7-14 дней</span>
          <span className="product-rating">⭐ 4.8</span>
        </div>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <div className="product-price">
            <span className="price-amount">{product.price.toLocaleString()} ₽</span>
            <span className="price-person">за человека</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;