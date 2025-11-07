import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
  const { getTotalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <NavLink to="/" className="brand-link">
            <span className="brand-icon">✈️</span>
            Мир Путешествий
          </NavLink>
        </div>
        
        <div className="nav-links">
          <NavLink to="/" end className="nav-link">
            <span className="link-icon">🏠</span>
            Главная
          </NavLink>
          <NavLink to="/products" className="nav-link">
            <span className="link-icon">🌍</span>
            Туры
          </NavLink>
          
          {/* Ссылка на Dashboard для авторизованных пользователей */}
          {isAuthenticated && (
            <NavLink to="/dashboard" className="nav-link">
              <span className="link-icon">🚀</span>
              Личный кабинет
            </NavLink>
          )}
          
          <NavLink to="/cart" className="nav-link cart-link">
            <span className="link-icon">🛒</span>
            Корзина
            {getTotalItems() > 0 && (
              <span className="cart-badge">{getTotalItems()}</span>
            )}
          </NavLink>
          
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-greeting">Привет, {user.name}!</span>
              <button onClick={handleLogout} className="logout-button">
                Выйти
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                <span className="link-icon">🔐</span>
                Войти
              </NavLink>
              <NavLink to="/register" className="nav-link">
                <span className="link-icon">📝</span>
                Регистрация
              </NavLink>
            </>
          )}
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navigation;