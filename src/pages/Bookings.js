import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../common/ProtectedRoute';

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Подтверждено', color: '#10b981', icon: '✅' };
      case 'pending':
        return { text: 'Ожидание', color: '#f59e0b', icon: '⏳' };
      case 'cancelled':
        return { text: 'Отменено', color: '#ef4444', icon: '❌' };
      case 'completed':
        return { text: 'Завершено', color: '#3b82f6', icon: '✅' };
      default:
        return { text: status, color: '#6b7280', icon: '❓' };
    }
  };

  if (loading) {
    return (
      <div className="bookings-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка бронирований...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="bookings-page">
        <div className="page-header">
          <h1>Мои бронирования</h1>
          <p>Управление вашими турами и бронированиями</p>
        </div>
        {bookings.length === 0 ? (
          <div className="empty-bookings">
            <div className="empty-icon">📋</div>
            <h2>Бронирований пока нет</h2>
            <p>Начните планировать свое путешествие - выберите тур и забронируйте его!</p>
            <button 
              onClick={() => window.location.href = '/products'}
              className="cta-button"
            >
              Найти туры
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => {
              const statusInfo = getStatusInfo(booking.status);
              return (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>{booking.tour_name}</h3>
                    <span 
                      className="booking-status"
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      {statusInfo.icon} {statusInfo.text}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="detail-label">📅 Дата бронирования:</span>
                      <span>{new Date(booking.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">👥 Участники:</span>
                      <span>{booking.participants} человек</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">💰 Общая стоимость:</span>
                      <span className="booking-price">{booking.total_price?.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📞 Контактные данные:</span>
                      <span>{user.phone || 'Не указан'}</span>
                    </div>
                  </div>
                  <div className="booking-actions">
                    {booking.status === 'pending' && (
                      <button className="btn-cancel">
                        Отменить бронирование
                      </button>
                    )}
                    <button className="btn-details">
                      Подробнее о туре
                    </button>
                    <button className="btn-support">
                      Связаться с поддержкой
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Статистика бронирований */}
        {bookings.length > 0 && (
          <div className="bookings-stats">
            <div className="stat-card">
              <span className="stat-number">{bookings.length}</span>
              <span className="stat-label">Всего бронирований</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {bookings.filter(b => b.status === 'confirmed').length}
              </span>
              <span className="stat-label">Подтвержденных</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {bookings.filter(b => b.status === 'completed').length}
              </span>
              <span className="stat-label">Завершенных</span>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Bookings;