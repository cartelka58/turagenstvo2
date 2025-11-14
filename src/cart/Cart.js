import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const { items, removeFromCart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleRemove = (productId) => {
    removeFromCart(productId);
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    alert('Заказ успешно оформлен!');
    clearCart();
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-icon">🛒</div>
        <h2>Корзина пуста</h2>
        <p>Начните добавлять туры, чтобы увидеть их здесь</p>
        <button onClick={handleContinueShopping} className="cta-button">
          Найти туры
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Корзина</h1>
        <span className="cart-count">{items.length} {items.length === 1 ? 'тур' : 'тура'}</span>
      </div>
      <div className="cart-content">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-image">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="item-details">
                <h4 className="item-name">{item.name}</h4>
                <div className="item-meta">
                  <span className="item-quantity">Количество: {item.quantity}</span>
                  <span className="item-price">{item.price.toLocaleString()} ₽</span>
                </div>
                <div className="item-total">
                  Итого: {(item.price * item.quantity).toLocaleString()} ₽
                </div>
              </div>
              <button 
                className="remove-button"
                onClick={() => handleRemove(item.id)}
                title="Удалить из корзины"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <div className="summary-card">
            <h3>Итог заказа</h3>
            <div className="summary-row">
              <span>Туры:</span>
              <span>{getTotalPrice().toLocaleString()} ₽</span>
            </div>
            <div className="summary-row">
              <span>Скидка:</span>
              <span className="discount">-5 000 ₽</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>К оплате:</span>
              <span className="total-amount">{(getTotalPrice() - 5000).toLocaleString()} ₽</span>
            </div>
            <button className="checkout-button" onClick={handleCheckout}>
              {isAuthenticated ? 'Перейти к оформлению' : 'Войти для оформления'}
            </button>
          </div>
        </div>
      </div>
      <div className="cart-actions">
        <button onClick={handleContinueShopping} className="continue-shopping">
          ← Продолжить покупки
        </button>
      </div>
    </div>
  );
};

export default Cart;