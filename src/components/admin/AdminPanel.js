import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Проверка прав администратора
  const isAdmin = user && (user.role === 'admin' || user.role_name === 'admin');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchDashboardStats();
  }, [isAdmin, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Ошибка сервера');
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Ошибка загрузки статистики');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>🚫 Доступ запрещен</h2>
          <p>У вас нет прав для доступа к этой странице</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            На главную
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка админ панели...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛠️ Панель администратора</h1>
        <p>Добро пожаловать, {user?.name}! Управление системой бронирования туров</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Дашборд
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => navigate('/admin/users')}
        >
          👥 Пользователи
        </button>
        <button 
          className={`tab-button ${activeTab === 'tours' ? 'active' : ''}`}
          onClick={() => navigate('/admin/tours')}
        >
          🏔️ Туры
        </button>
        <button 
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => navigate('/admin/bookings')}
        >
          📋 Бронирования
        </button>
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => navigate('/admin/categories')}
        >
          📂 Категории
        </button>
        <button 
          className={`tab-button ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => navigate('/admin/coupons')}
        >
          🎫 Купоны
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && stats && (
          <div className="dashboard-content">
            <h2>Общая статистика системы</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.users?.total_users || 0}</div>
                  <div className="stat-label">Всего пользователей</div>
                  <div className="stat-subinfo">
                    <span className="stat-badge admin">{stats.users?.admin_users || 0} админов</span>
                    <span className="stat-badge active">{stats.users?.active_users || 0} активных</span>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏔️</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.tours?.total_tours || 0}</div>
                  <div className="stat-label">Всего туров</div>
                  <div className="stat-subinfo">
                    <span className="stat-badge popular">{stats.tours?.popular_tours || 0} популярных</span>
                    <span className="stat-badge discount">{stats.tours?.discounted_tours || 0} со скидкой</span>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.bookings?.total_bookings || 0}</div>
                  <div className="stat-label">Всего бронирований</div>
                  <div className="stat-subinfo">
                    <span className="stat-badge confirmed">{stats.bookings?.confirmed_bookings || 0} подтвержденных</span>
                    <span className="stat-badge pending">{stats.bookings?.pending_bookings || 0} ожидает</span>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-number">
                    {stats.bookings?.total_revenue 
                      ? Math.round(stats.bookings.total_revenue).toLocaleString('ru-RU')
                      : '0'
                    }
                  </div>
                  <div className="stat-label">Общий доход</div>
                  <div className="stat-subinfo">
                    <span className="stat-badge">За 30 дней</span>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎫</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.coupons?.total_coupons || 0}</div>
                  <div className="stat-label">Всего купонов</div>
                  <div className="stat-subinfo">
                    <span className="stat-badge active">{stats.coupons?.active_coupons || 0} активных</span>
                    <span className="stat-badge personal">{stats.coupons?.personal_coupons || 0} персональных</span>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.coupons?.total_uses || 0}</div>
                  <div className="stat-label">Использований купонов</div>
                  <div className="stat-subinfo">
                    <span className="stat-badge">Всего</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика по бронированиям */}
            <div className="stats-section">
              <h3>📈 Статистика бронирований</h3>
              <div className="stats-row">
                <div className="mini-stat">
                  <div className="mini-stat-icon">⏳</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.bookings?.pending_bookings || 0}</div>
                    <div className="mini-stat-label">Ожидание</div>
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-icon">✅</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.bookings?.confirmed_bookings || 0}</div>
                    <div className="mini-stat-label">Подтверждено</div>
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-icon">✅</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.bookings?.completed_bookings || 0}</div>
                    <div className="mini-stat-label">Завершено</div>
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-icon">❌</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.bookings?.cancelled_bookings || 0}</div>
                    <div className="mini-stat-label">Отменено</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика по купонам */}
            <div className="stats-section">
              <h3>🎫 Статистика купонов</h3>
              <div className="stats-row">
                <div className="mini-stat">
                  <div className="mini-stat-icon">🟢</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.coupons?.active_coupons || 0}</div>
                    <div className="mini-stat-label">Активных</div>
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-icon">🔴</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.coupons?.inactive_coupons || 0}</div>
                    <div className="mini-stat-label">Неактивных</div>
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-icon">👤</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.coupons?.personal_coupons || 0}</div>
                    <div className="mini-stat-label">Персональных</div>
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-icon">🔄</div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-number">{stats.coupons?.total_uses || 0}</div>
                    <div className="mini-stat-label">Использований</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="dashboard-section">
                <h3>📈 Последние пользователи</h3>
                <div className="recent-list">
                  {stats.recentUsers && stats.recentUsers.length > 0 ? (
                    stats.recentUsers.map(user => (
                      <div key={user.id} className="recent-item">
                        <div className="recent-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="recent-info">
                          <div className="recent-name">{user.name}</div>
                          <div className="recent-email">{user.email}</div>
                          <div className="recent-date">
                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                        <div className={`recent-badge ${user.role_name === 'admin' ? 'admin' : 'user'}`}>
                          {user.role_name === 'admin' ? '👑 Админ' : '👤 Пользователь'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>Нет данных о пользователях</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="dashboard-section">
                <h3>🔥 Популярные туры</h3>
                <div className="recent-list">
                  {stats.popularTours && stats.popularTours.length > 0 ? (
                    stats.popularTours.map(tour => (
                      <div key={tour.id} className="recent-item">
                        <div className="tour-image-small">
                          {tour.category_name?.includes('Пляж') ? '🏖️' : 
                           tour.category_name?.includes('Гор') ? '⛰️' : '🏔️'}
                        </div>
                        <div className="recent-info">
                          <div className="recent-name">{tour.name}</div>
                          <div className="recent-price">
                            {tour.price?.toLocaleString('ru-RU')} ₽
                          </div>
                          <div className="tour-badges">
                            {tour.is_popular && <span className="badge-small popular">Популярный</span>}
                            {tour.is_discounted && <span className="badge-small discount">Скидка</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>Нет популярных туров</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>⚡ Быстрые действия</h3>
              <div className="actions-grid">
                <button 
                  className="action-card"
                  onClick={() => navigate('/admin/users')}
                >
                  <span className="action-icon">👥</span>
                  <span className="action-title">Управление пользователями</span>
                  <span className="action-desc">Добавление, редактирование, блокировка</span>
                </button>
                <button 
                  className="action-card"
                  onClick={() => navigate('/admin/tours')}
                >
                  <span className="action-icon">🏔️</span>
                  <span className="action-title">Управление турами</span>
                  <span className="action-desc">Создание и редактирование туров</span>
                </button>
                <button 
                  className="action-card"
                  onClick={() => navigate('/admin/bookings')}
                >
                  <span className="action-icon">📋</span>
                  <span className="action-title">Управление бронированиями</span>
                  <span className="action-desc">Просмотр и управление бронированиями</span>
                </button>
                <button 
                  className="action-card"
                  onClick={() => navigate('/admin/categories')}
                >
                  <span className="action-icon">📂</span>
                  <span className="action-title">Управление категориями</span>
                  <span className="action-desc">Создание и редактирование категорий</span>
                </button>
                <button 
                  className="action-card"
                  onClick={() => navigate('/admin/coupons')}
                >
                  <span className="action-icon">🎫</span>
                  <span className="action-title">Управление купонами</span>
                  <span className="action-desc">Создание и управление скидочными купонами</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;