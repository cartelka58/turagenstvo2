import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useServices } from '../contexts/ServicesContext';
import ProtectedRoute from '../common/ProtectedRoute';

const Dashboard = () => {
  const { user } = useAuth();
  const { getTotalItems, items } = useCart();
  const { services } = useServices();
  const navigate = useNavigate();
  const [userBookings, setUserBookings] = useState([]);

  // Загрузка бронирований пользователя
  const fetchUserBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bookings/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user, services]);

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
      icon: '📋',
      title: 'Мои бронирования',
      description: `Активных бронирований: ${userBookings.length}`,
      action: () => navigate('/bookings'),
      color: '#f59e0b'
    },
    {
      icon: '⭐',
      title: 'Избранное',
      description: 'Сохраненные туры',
      action: () => alert('Раздел в разработке'),
      color: '#8b5cf6'
    }
  ];

  const features = [
    { 
      icon: '🚀', 
      title: 'Быстрое бронирование', 
      desc: 'Забронируйте тур за 2 минуты' 
    },
    { 
      icon: '🛡️', 
      title: 'Гарантия лучшей цены', 
      desc: 'Нашли дешевле? Вернем разницу!' 
    },
    { 
      icon: '📞', 
      title: 'Поддержка 24/7', 
      desc: 'Помощь в любое время суток' 
    },
    { 
      icon: '✈️', 
      title: 'Выгодные предложения', 
      desc: 'Скидки до 40% на раннее бронирование' 
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
            <div className="user-stats">
              <div className="user-stat">
                <span className="stat-number">{userBookings.length}</span>
                <span className="stat-label">Бронирований</span>
              </div>
              <div className="user-stat">
                <span className="stat-number">{getTotalItems()}</span>
                <span className="stat-label">В корзине</span>
              </div>
              <div className="user-stat">
                <span className="stat-number">{services.length}</span>
                <span className="stat-label">Доступных туров</span>
              </div>
            </div>
          </div>
          {/* Удален блок welcome-visual с плавающими элементами */}
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

        {/* Активные бронирования */}
        {userBookings.length > 0 && (
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Активные бронирования</h2>
              <button className="see-all" onClick={() => navigate('/bookings')}>
                Все бронирования →
              </button>
            </div>
            <div className="bookings-grid">
              {userBookings.slice(0, 3).map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h4>{booking.tour_name}</h4>
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status === 'confirmed' ? '✅ Подтверждено' : 
                      booking.status === 'pending' ? '⏳ Ожидание' : 
                      booking.status === 'cancelled' ? '❌ Отменено' : '✅ Завершено'}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="booking-info">
                      <span>📅 Дата: {new Date(booking.created_at).toLocaleDateString('ru-RU')}</span>
                      <span>👥 Участники: {booking.participants}</span>
                      <span>💰 Сумма: {booking.total_price?.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Преимущества */}
        <section className="dashboard-section">
          <h2>Почему выбирают нас</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Спецпредложения */}
        <section className="dashboard-section">
          <div className="promo-banner">
            <div className="promo-content">
              <h3>🎉 Скидка 20% на первый заказ!</h3>
              <p>Введите промокод WELCOME20 при оформлении</p>
              <small>Действует для новых пользователей</small>
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