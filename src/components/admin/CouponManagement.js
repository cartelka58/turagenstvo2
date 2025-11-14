import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CouponManagement = () => {
  const { user, getAuthHeaders } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    usage_limit: 1,
    is_active: true,
    for_specific_user: false,
    user_id: ''
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/admin/coupons?search=${searchTerm}&status=${statusFilter}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCoupons(data.data.coupons);
      } else {
        setError(data.message || 'Ошибка загрузки купонов');
      }
    } catch (error) {
      setError('Ошибка соединения с сервером');
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users?limit=1000', {
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

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role_name === 'admin')) {
      fetchCoupons();
      fetchUsers();
    }
  }, [user, searchTerm, statusFilter]);

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      usage_limit: 1,
      is_active: true,
      for_specific_user: false,
      user_id: ''
    });
    setEditingCoupon(null);
    setShowCouponForm(false);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/coupons', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(couponForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Купон успешно создан!');
        resetCouponForm();
        fetchCoupons();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при создании купона');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/admin/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(couponForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Купон успешно обновлен!');
        resetCouponForm();
        fetchCoupons();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при обновлении купона');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот купон?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Купон успешно удален!');
        fetchCoupons();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при удалении купона');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || '',
      max_discount_amount: coupon.max_discount_amount || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : new Date().toISOString().split('T')[0],
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
      for_specific_user: coupon.for_specific_user,
      user_id: coupon.user_id || ''
    });
    setShowCouponForm(true);
  };

  const handleToggleCouponStatus = async (couponId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Купон успешно ${!currentStatus ? 'активирован' : 'деактивирован'}!`);
        fetchCoupons();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при обновлении статуса');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm(prev => ({ ...prev, code: result }));
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
    
    if (!coupon.is_active) return { status: 'inactive', label: 'Неактивен', color: '#6b7280' };
    if (validUntil && validUntil < now) return { status: 'expired', label: 'Истек', color: '#ef4444' };
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) return { status: 'used', label: 'Использован', color: '#f59e0b' };
    return { status: 'active', label: 'Активен', color: '#10b981' };
  };

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => getCouponStatus(c).status === 'active').length,
    expired: coupons.filter(c => getCouponStatus(c).status === 'expired').length,
    personal: coupons.filter(c => c.for_specific_user).length
  };

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

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🎫 Управление купонами</h1>
        <p>Создание и управление скидочными купонами для пользователей</p>
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
          <div className="stat-icon">🎫</div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Всего купонов</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">Активных</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <div className="stat-number">{stats.expired}</div>
            <div className="stat-label">Истекших</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <div className="stat-number">{stats.personal}</div>
            <div className="stat-label">Персональных</div>
          </div>
        </div>
      </div>

      <div className="admin-controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по коду или описанию..."
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
            <option value="active">Активные</option>
            <option value="expired">Истекшие</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>

        <div className="controls-right">
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetCouponForm();
              setShowCouponForm(true);
            }}
          >
            <span className="btn-icon">+</span>
            Создать купон
          </button>
        </div>
      </div>

      {showCouponForm && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>{editingCoupon ? '✏️ Редактировать купон' : '🎫 Создать купон'}</h3>
              <button className="modal-close" onClick={resetCouponForm}>×</button>
            </div>
            
            <form onSubmit={editingCoupon ? handleUpdateCoupon : handleCreateCoupon} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Код купона *</label>
                  <div className="code-input-group">
                    <input
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                      required
                      placeholder="SUMMER2024"
                      className="code-input"
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={generateCouponCode}
                    >
                      Сгенерировать
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({...couponForm, description: e.target.value})}
                    placeholder="Описание купона (будет видно пользователю)"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Тип скидки *</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({...couponForm, discount_type: e.target.value})}
                    required
                  >
                    <option value="percentage">Процентная (%)</option>
                    <option value="fixed">Фиксированная (₽)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>
                    {couponForm.discount_type === 'percentage' ? 'Процент скидки *' : 'Сумма скидки * (₽)'}
                  </label>
                  <input
                    type="number"
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({...couponForm, discount_value: e.target.value})}
                    required
                    min="1"
                    max={couponForm.discount_type === 'percentage' ? '100' : '100000'}
                    placeholder={couponForm.discount_type === 'percentage' ? '10' : '1000'}
                  />
                </div>

                <div className="form-group">
                  <label>Минимальная сумма заказа (₽)</label>
                  <input
                    type="number"
                    value={couponForm.min_order_amount}
                    onChange={(e) => setCouponForm({...couponForm, min_order_amount: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>

                {couponForm.discount_type === 'percentage' && (
                  <div className="form-group">
                    <label>Максимальная сумма скидки (₽)</label>
                    <input
                      type="number"
                      value={couponForm.max_discount_amount}
                      onChange={(e) => setCouponForm({...couponForm, max_discount_amount: e.target.value})}
                      placeholder="Не ограничено"
                      min="0"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Лимит использований</label>
                  <input
                    type="number"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm({...couponForm, usage_limit: e.target.value})}
                    required
                    min="0"
                    placeholder="0"
                  />
                  <small className="form-hint">0 = безлимитно</small>
                </div>

                <div className="form-group">
                  <label>Дата начала</label>
                  <input
                    type="date"
                    value={couponForm.valid_from}
                    onChange={(e) => setCouponForm({...couponForm, valid_from: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Дата окончания</label>
                  <input
                    type="date"
                    value={couponForm.valid_until}
                    onChange={(e) => setCouponForm({...couponForm, valid_until: e.target.value})}
                    placeholder="Без срока"
                  />
                  <small className="form-hint">Оставьте пустым для бессрочного купона</small>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={couponForm.for_specific_user}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setCouponForm({
                          ...couponForm,
                          for_specific_user: isChecked,
                          user_id: isChecked ? couponForm.user_id : ''
                        });
                      }}
                    />
                    Персональный купон для пользователя
                  </label>
                </div>

                {couponForm.for_specific_user && (
                  <div className="form-group">
                    <label>Пользователь *</label>
                    <select
                      value={couponForm.user_id}
                      onChange={(e) => setCouponForm({...couponForm, user_id: e.target.value})}
                      required={couponForm.for_specific_user}
                    >
                      <option value="">Выберите пользователя</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={couponForm.is_active}
                      onChange={(e) => setCouponForm({...couponForm, is_active: e.target.checked})}
                    />
                    Активный
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetCouponForm}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCoupon ? '💾 Сохранить изменения' : '➕ Создать купон'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Загрузка купонов...</p>
          </div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Описание</th>
                  <th>Скидка</th>
                  <th>Лимит</th>
                  <th>Срок действия</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => {
                  const statusInfo = getCouponStatus(coupon);
                  const usagePercentage = coupon.usage_limit > 0 
                    ? (coupon.used_count / coupon.usage_limit) * 100 
                    : 0;
                  
                  return (
                    <tr key={coupon.id} className={statusInfo.status === 'expired' ? 'expired' : ''}>
                      <td>
                        <div className="coupon-code">
                          <strong>{coupon.code}</strong>
                          {coupon.for_specific_user && (
                            <span className="personal-badge">👤 Персональный</span>
                          )}
                        </div>
                      </td>
                      
                      <td>
                        <div className="coupon-description">
                          {coupon.description || 'Без описания'}
                          {coupon.user_name && (
                            <div className="user-info">
                              Для: {coupon.user_name} ({coupon.user_email})
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td>
                        <div className="discount-info">
                          {coupon.discount_type === 'percentage' ? (
                            <span className="discount-percentage">-{coupon.discount_value}%</span>
                          ) : (
                            <span className="discount-fixed">-{coupon.discount_value} ₽</span>
                          )}
                          {coupon.min_order_amount > 0 && (
                            <div className="min-order">
                              от {coupon.min_order_amount} ₽
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td>
                        <div className="usage-info">
                          <div className="usage-stats">
                            {coupon.usage_limit > 0 ? (
                              <>
                                {coupon.used_count} / {coupon.usage_limit}
                                <div className="usage-bar">
                                  <div 
                                    className="usage-progress"
                                    style={{ width: `${usagePercentage}%` }}
                                  ></div>
                                </div>
                              </>
                            ) : (
                              <span>Безлимитно</span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="validity-info">
                          <div>С: {new Date(coupon.valid_from).toLocaleDateString('ru-RU')}</div>
                          <div>
                            До: {coupon.valid_until 
                              ? new Date(coupon.valid_until).toLocaleDateString('ru-RU')
                              : 'Бессрочно'
                            }
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: statusInfo.color + '20',
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.color}`
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-action btn-edit"
                            onClick={() => handleEditCoupon(coupon)}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          
                          <button 
                            className={`btn-action ${coupon.is_active ? 'btn-block' : 'btn-unblock'}`}
                            onClick={() => handleToggleCouponStatus(coupon.id, coupon.is_active)}
                            title={coupon.is_active ? 'Деактивировать' : 'Активировать'}
                          >
                            {coupon.is_active ? '🚫' : '✅'}
                          </button>
                          
                          <button 
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteCoupon(coupon.id)}
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

            {coupons.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>Купоны не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCouponForm(true)}
                >
                  Создать первый купон
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CouponManagement;