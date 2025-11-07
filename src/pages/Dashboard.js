import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ProtectedRoute from '../common/ProtectedRoute';

const Dashboard = () => {
  const { user } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: '🌍',
      title: 'Найти туры',
      description: 'Исследуйте наши лучшие предложения',
      action: () => navigate('/products'),
      color: '#3b82f6'
    },
    {
      icon: '🛒',
      title: 'Корзина',
      description: `Товаров в корзине: ${getTotalItems()}`,
      action: () => navigate('/cart'),
      color: '#10b981'
    },
    {
      icon: '⭐',
      title: 'Избранное',
      description: 'Сохраненные туры',
      action: () => alert('Раздел в разработке'),
      color: '#f59e0b'
    },
    {
      icon: '📞',
      title: 'Поддержка',
      description: 'Помощь и консультации',
      action: () => alert('Свяжитесь с нами: +7 (999) 123-45-67'),
      color: '#8b5cf6'
    }
  ];

  const recentTours = [
    {
      name: "Тур в Турцию",
      price: 45000,
      image: "/images/turkey.jpg",
      viewed: "2 часа назад"
    },
    {
      name: "Отдых в Египте", 
      price: 52000,
      image: "/images/egypt.webp",
      viewed: "Вчера"
    },
    {
      name: "Экскурсия по Европе",
      price: 78000,
      image: "/images/europe.jpg",
      viewed: "3 дня назад"
    }
  ];

  return (
    <ProtectedRoute>
      <div className="dashboard-page">
        {/* Приветствие */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Добро пожаловать, {user?.name}! 👋</h1>
            <p>Готовы к новым приключениям? Исследуйте лучшие туры со скидками до 30%</p>
          </div>
          <div className="welcome-stats">
            <div className="stat-card">
              <span className="stat-icon">🎯</span>
              <div className="stat-info">
                <span className="stat-number">18</span>
                <span className="stat-label">Доступных туров</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⭐</span>
              <div className="stat-info">
                <span className="stat-number">4.8</span>
                <span className="stat-label">Рейтинг сервиса</span>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <section className="dashboard-section">
          <h2>Быстрые действия</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-card"
                onClick={action.action}
                style={{ '--action-color': action.color }}
              >
                <span className="action-icon">{action.icon}</span>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <span className="action-arrow">→</span>
              </button>
            ))}
          </div>
        </section>

        {/* Недавно просмотренные */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Недавно просмотренные</h2>
            <button className="see-all" onClick={() => navigate('/products')}>
              Смотреть все →
            </button>
          </div>
          <div className="recent-tours">
            {recentTours.map((tour, index) => (
              <div key={index} className="recent-tour-card">
                <div className="tour-image">
                  <img src={tour.image} alt={tour.name} />
                </div>
                <div className="tour-info">
                  <h4>{tour.name}</h4>
                  <p className="tour-price">{tour.price.toLocaleString()} ₽</p>
                  <span className="viewed-time">{tour.viewed}</span>
                </div>
                <button 
                  className="view-again"
                  onClick={() => navigate('/products')}
                >
                  Посмотреть
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Спецпредложения */}
        <section className="dashboard-section">
          <h2>Специальные предложения</h2>
          <div className="promo-banner">
            <div className="promo-content">
              <h3>🎉 Скидка 20% на первый заказ!</h3>
              <p>Введите промокод WELCOME20 при оформлении</p>
            </div>
            <button 
              className="promo-button"
              onClick={() => navigate('/products')}
            >
              Воспользоваться
            </button>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;