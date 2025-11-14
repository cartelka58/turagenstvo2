import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const BookingManagement = () => {
  const { user, getAuthHeaders } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    user_id: '',
    tour_id: '',
    travelers_count: 1,
    total_price: '',
    final_price: '',
    booking_date: new Date().toISOString().split('T')[0],
    departure_date: '',
    return_date: '',
    status_id: 4
  });

  // Статусы бронирований
  const bookingStatuses = [
    { id: 4, name: 'pending', label: '⏳ Ожидание', color: '#f59e0b' },
    { id: 5, name: 'confirmed', label: '✅ Подтверждено', color: '#10b981' },
    { id: 6, name: 'cancelled', label: '❌ Отменено', color: '#ef4444' },
    { id: 7, name: 'completed', label: '✅ Завершено', color: '#3b82f6' }
  ];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/bookings', {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data.bookings);
      } else {
        setError(data.message || 'Ошибка загрузки бронирований');
      }
    } catch (error) {
      setError('Ошибка соединения с сервером');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users?limit=100', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTours = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tours');
      const data = await response.json();
      if (data.success) {
        setTours(data.data);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role_name === 'admin')) {
      fetchBookings();
      fetchUsers();
      fetchTours();
    }
  }, [user]);

  const resetBookingForm = () => {
    setBookingForm({
      user_id: '',
      tour_id: '',
      travelers_count: 1,
      total_price: '',
      final_price: '',
      booking_date: new Date().toISOString().split('T')[0],
      departure_date: '',
      return_date: '',
      status_id: 4
    });
    setEditingBooking(null);
    setShowBookingForm(false);
  };

  const calculateReturnDate = (departureDate, tourId) => {
    if (!departureDate || !tourId) return '';
    
    const tour = tours.find(t => t.id === parseInt(tourId));
    if (!tour || !tour.duration_days) return '';
    
    const departure = new Date(departureDate);
    const returnDate = new Date(departure);
    returnDate.setDate(departure.getDate() + tour.duration_days);
    
    return returnDate.toISOString().split('T')[0];
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      if (!bookingForm.departure_date || !bookingForm.return_date) {
        setError('Дата отправления и дата возвращения обязательны');
        return;
      }

      const formData = {
        ...bookingForm,
        travelers_count: parseInt(bookingForm.travelers_count),
        total_price: parseFloat(bookingForm.total_price),
        final_price: parseFloat(bookingForm.total_price),
        booking_date: bookingForm.booking_date || new Date().toISOString(),
        departure_date: bookingForm.departure_date,
        return_date: bookingForm.return_date
      };

      const response = await fetch('http://localhost:5000/api/admin/bookings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Бронирование успешно создано!');
        resetBookingForm();
        fetchBookings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при создании бронирования');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...bookingForm,
        travelers_count: parseInt(bookingForm.travelers_count),
        total_price: parseFloat(bookingForm.total_price),
        final_price: parseFloat(bookingForm.total_price),
        departure_date: bookingForm.departure_date,
        return_date: bookingForm.return_date
      };

      const response = await fetch(`http://localhost:5000/api/admin/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Бронирование успешно обновлено!');
        resetBookingForm();
        fetchBookings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при обновлении бронирования');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Бронирование успешно удалено!');
        setShowDeleteConfirm(null);
        fetchBookings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при удалении бронирования');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setBookingForm({
      user_id: booking.user_id,
      tour_id: booking.tour_id,
      travelers_count: booking.travelers_count,
      total_price: booking.total_price,
      final_price: booking.final_price || booking.total_price,
      booking_date: booking.booking_date ? booking.booking_date.split('T')[0] : new Date().toISOString().split('T')[0],
      departure_date: booking.departure_date ? booking.departure_date.split('T')[0] : '',
      return_date: booking.return_date ? booking.return_date.split('T')[0] : '',
      status_id: booking.status_id || 4
    });
    setShowBookingForm(true);
  };

  const handleStatusChange = async (bookingId, newStatusId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status_id: newStatusId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Статус бронирования успешно обновлен!');
        setShowStatusMenu(null);
        fetchBookings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при обновлении статуса');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.tour_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      booking.status_id?.toString() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const calculateTotalPrice = (tourId, travelers_count) => {
    const tour = tours.find(t => t.id === parseInt(tourId));
    if (tour && travelers_count) {
      return tour.price * parseInt(travelers_count);
    }
    return 0;
  };

  useEffect(() => {
    if (bookingForm.tour_id && bookingForm.travelers_count) {
      const total = calculateTotalPrice(bookingForm.tour_id, bookingForm.travelers_count);
      setBookingForm(prev => ({ 
        ...prev, 
        total_price: total,
        final_price: total
      }));
    }
  }, [bookingForm.tour_id, bookingForm.travelers_count]);

  useEffect(() => {
    if (bookingForm.departure_date && bookingForm.tour_id) {
      const returnDate = calculateReturnDate(bookingForm.departure_date, bookingForm.tour_id);
      setBookingForm(prev => ({ ...prev, return_date: returnDate }));
    }
  }, [bookingForm.departure_date, bookingForm.tour_id]);

  if (!user || (user.role !== 'admin' && user.role_name !== 'admin')) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>🚫 Доступ запрещен</h2>
          <p>У вас нет прав для доступа к этой странице</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status_id === 4).length,
    confirmed: bookings.filter(b => b.status_id === 5).length,
    completed: bookings.filter(b => b.status_id === 7).length,
    cancelled: bookings.filter(b => b.status_id === 6).length
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>📋 Управление бронированиями</h1>
        <p>Создание, редактирование и управление бронированиями туров</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
          <button className="alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Всего бронирований</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Ожидание</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{stats.confirmed}</div>
            <div className="stat-label">Подтверждено</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-info">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Завершено</div>
          </div>
        </div>
      </div>

      <div className="admin-controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по клиенту, туру или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            {bookingStatuses.map(status => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="controls-right">
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetBookingForm();
              setShowBookingForm(true);
            }}
          >
            <span className="btn-icon">+</span>
            Добавить бронирование
          </button>
        </div>
      </div>

      {showBookingForm && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>{editingBooking ? '✏️ Редактировать бронирование' : '📋 Создать бронирование'}</h3>
              <button className="modal-close" onClick={resetBookingForm}>×</button>
            </div>
            
            <form onSubmit={editingBooking ? handleUpdateBooking : handleCreateBooking} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Клиент *</label>
                  <select
                    value={bookingForm.user_id}
                    onChange={(e) => setBookingForm({...bookingForm, user_id: e.target.value})}
                    required
                  >
                    <option value="">Выберите клиента</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Тур *</label>
                  <select
                    value={bookingForm.tour_id}
                    onChange={(e) => setBookingForm({...bookingForm, tour_id: e.target.value})}
                    required
                  >
                    <option value="">Выберите тур</option>
                    {tours.map(tour => (
                      <option key={tour.id} value={tour.id}>
                        {tour.name} - {tour.price?.toLocaleString('ru-RU')} ₽
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Количество участников *</label>
                  <input
                    type="number"
                    value={bookingForm.travelers_count}
                    onChange={(e) => setBookingForm({...bookingForm, travelers_count: e.target.value})}
                    required
                    min="1"
                    max="50"
                  />
                </div>
                
                <div className="form-group">
                  <label>Общая стоимость (₽)</label>
                  <input
                    type="number"
                    value={bookingForm.total_price}
                    onChange={(e) => setBookingForm({...bookingForm, total_price: e.target.value})}
                    required
                    readOnly={!!bookingForm.tour_id && !!bookingForm.travelers_count}
                    className={bookingForm.tour_id && bookingForm.travelers_count ? 'readonly-field' : ''}
                  />
                  {bookingForm.tour_id && bookingForm.travelers_count && (
                    <small className="form-hint">Рассчитывается автоматически</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Дата бронирования</label>
                  <input
                    type="date"
                    value={bookingForm.booking_date}
                    onChange={(e) => setBookingForm({...bookingForm, booking_date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Дата отправления *</label>
                  <input
                    type="date"
                    value={bookingForm.departure_date}
                    onChange={(e) => setBookingForm({...bookingForm, departure_date: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Дата возвращения *</label>
                  <input
                    type="date"
                    value={bookingForm.return_date}
                    onChange={(e) => setBookingForm({...bookingForm, return_date: e.target.value})}
                    required
                    readOnly={!!bookingForm.departure_date && !!bookingForm.tour_id}
                    className={bookingForm.departure_date && bookingForm.tour_id ? 'readonly-field' : ''}
                  />
                  {bookingForm.departure_date && bookingForm.tour_id && (
                    <small className="form-hint">Рассчитывается автоматически на основе длительности тура</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Статус</label>
                  <select
                    value={bookingForm.status_id}
                    onChange={(e) => setBookingForm({...bookingForm, status_id: parseInt(e.target.value)})}
                  >
                    {bookingStatuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {bookingForm.tour_id && (
                <div className="booking-summary">
                  <h4>Сводка бронирования</h4>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Тур:</span>
                      <span>{tours.find(t => t.id === parseInt(bookingForm.tour_id))?.name}</span>
                    </div>
                    <div className="summary-row">
                      <span>Длительность:</span>
                      <span>{tours.find(t => t.id === parseInt(bookingForm.tour_id))?.duration_days} дней</span>
                    </div>
                    <div className="summary-row">
                      <span>Цена за человека:</span>
                      <span>{tours.find(t => t.id === parseInt(bookingForm.tour_id))?.price?.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="summary-row">
                      <span>Количество участников:</span>
                      <span>{bookingForm.travelers_count}</span>
                    </div>
                    {bookingForm.departure_date && (
                      <div className="summary-row">
                        <span>Даты поездки:</span>
                        <span>
                          {new Date(bookingForm.departure_date).toLocaleDateString('ru-RU')} - {new Date(bookingForm.return_date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    )}
                    <div className="summary-row total">
                      <span>Итого:</span>
                      <span>{bookingForm.total_price?.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetBookingForm}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBooking ? '💾 Сохранить изменения' : '➕ Создать бронирование'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>🗑️ Подтверждение удаления</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-form">
              <p>Вы уверены, что хотите удалить бронирование #{showDeleteConfirm.id}?</p>
              <div className="booking-info">
                <p><strong>Клиент:</strong> {showDeleteConfirm.user_name}</p>
                <p><strong>Тур:</strong> {showDeleteConfirm.tour_name}</p>
                <p><strong>Стоимость:</strong> {showDeleteConfirm.total_price?.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Отмена
                </button>
                <button 
                  type="button" 
                  className="btn btn-error" 
                  onClick={() => handleDeleteBooking(showDeleteConfirm.id)}
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Загрузка бронирований...</p>
          </div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Клиент</th>
                  <th>Тур</th>
                  <th>Участники</th>
                  <th>Стоимость</th>
                  <th>Дата бронирования</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => {
                  const statusInfo = bookingStatuses.find(s => s.id === booking.status_id) || bookingStatuses[0];
                  return (
                    <tr key={booking.id} className={booking.id === editingBooking?.id ? 'editing' : ''}>
                      <td className="user-id">#{booking.id}</td>
                      
                      <td className="user-info">
                        <div className="user-avatar">
                          {booking.user_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{booking.user_name}</div>
                          <div className="user-email">{booking.user_email}</div>
                          {booking.user_phone && (
                            <div className="user-phone">📞 {booking.user_phone}</div>
                          )}
                        </div>
                      </td>
                      
                      <td>
                        <div className="tour-info">
                          <div className="tour-image-small">
                            <img 
                              src={booking.tour_image || '/images/default-tour.jpg'} 
                              alt={booking.tour_name}
                              style={{ width: '60px', height: '40px', objectFit: 'cover' }}
                            />
                          </div>
                          <div className="tour-details">
                            <div className="tour-name">{booking.tour_name}</div>
                            <div className="tour-meta">⏱️ {booking.duration_days || 7} дней</div>
                            <div className="tour-price">{booking.tour_price?.toLocaleString('ru-RU')} ₽/чел</div>
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <span className="participants-count">
                          👥 {booking.travelers_count}
                        </span>
                      </td>
                      
                      <td>
                        <div className="price-info">
                          <span className="booking-price">
                            {booking.total_price?.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </td>
                      
                      <td className="date-cell">
                        {new Date(booking.created_at).toLocaleDateString('ru-RU')}
                        <div className="date-time">
                          {new Date(booking.created_at).toLocaleTimeString('ru-RU')}
                        </div>
                      </td>
                      
                      <td>
                        <div className="status-dropdown">
                          <button 
                            className="status-button"
                            style={{ 
                              background: statusInfo.color + '20',
                              color: statusInfo.color,
                              border: `1px solid ${statusInfo.color}`
                            }}
                            onClick={() => setShowStatusMenu(showStatusMenu === booking.id ? null : booking.id)}
                          >
                            {statusInfo.label}
                            <span className="dropdown-arrow">▼</span>
                          </button>
                          
                          {showStatusMenu === booking.id && (
                            <div className="status-menu">
                              {bookingStatuses.map(status => (
                                <button
                                  key={status.id}
                                  className="status-option"
                                  onClick={() => handleStatusChange(booking.id, status.id)}
                                  style={{
                                    background: status.id === booking.status_id ? status.color + '20' : 'transparent',
                                    color: status.color
                                  }}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-action btn-edit"
                            onClick={() => handleEditBooking(booking)}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          
                          <button 
                            className="btn-action btn-delete"
                            onClick={() => setShowDeleteConfirm(booking)}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredBookings.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Бронирования не найдены</h3>
                <p>Попробуйте изменить параметры поиска или фильтрации</p>
                {bookings.length === 0 && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowBookingForm(true)}
                  >
                    Создать первое бронирование
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {filteredBookings.length > 0 && (
        <div className="table-footer">
          <div className="table-info">
            Показано {filteredBookings.length} из {bookings.length} бронирований
          </div>
        </div>
      )}

      <style jsx>{`
        .status-dropdown {
          position: relative;
          display: inline-block;
        }

        .status-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          min-width: 150px;
          justify-content: space-between;
        }

        .status-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }

        .dropdown-arrow {
          font-size: 0.75rem;
          transition: transform 0.2s;
        }

        .status-dropdown:hover .dropdown-arrow {
          transform: rotate(180deg);
        }

        .status-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 10;
          margin-top: 0.25rem;
          overflow: hidden;
        }

        .status-option {
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.875rem;
          text-align: left;
          transition: var(--transition);
          border-bottom: 1px solid var(--border);
        }

        .status-option:last-child {
          border-bottom: none;
        }

        .status-option:hover {
          background: var(--surface);
        }

        .tour-image-small img {
          border-radius: var(--radius-sm);
        }

        .booking-info {
          background: var(--surface);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin: 1rem 0;
        }

        .booking-info p {
          margin: 0.5rem 0;
        }

        .readonly-field {
          background-color: var(--surface);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default BookingManagement;