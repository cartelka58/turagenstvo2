import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { user, getAuthHeaders } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: 2,
    status_id: 13
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
      } else {
        setError(data.message || 'Ошибка загрузки пользователей');
      }
    } catch (error) {
      setError('Ошибка соединения с сервером');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role_name === 'admin')) {
      fetchUsers();
    }
  }, [user]);

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role_id: 2,
      status_id: 13
    });
    setEditingUser(null);
    setShowUserForm(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Пользователь успешно создан!');
        resetUserForm();
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при создании пользователя');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...userForm };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Пользователь успешно обновлен!');
        resetUserForm();
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при обновлении пользователя');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Пользователь успешно удален!');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при удалении пользователя');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role_id: user.role_id,
      status_id: user.status_id || 13
    });
    setShowUserForm(true);
  };

  const handleToggleUserStatus = async (userId, currentStatusId) => {
    const newStatusId = currentStatusId === 13 ? 15 : 13;
    const action = newStatusId === 15 ? 'заблокирован' : 'разблокирован';
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status_id: newStatusId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Пользователь успешно ${action}!`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при обновлении статуса');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Сбросить пароль пользователя? Будет установлен временный пароль "password".')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Пароль успешно сброшен! Временный пароль: password');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Ошибка при сбросе пароля');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || 
                       (roleFilter === 'admin' && user.role_name === 'admin') ||
                       (roleFilter === 'user' && user.role_name === 'customer');
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.status_id === 13) ||
                         (statusFilter === 'blocked' && user.status_id === 15) ||
                         (statusFilter === 'inactive' && user.status_id === 14);

    return matchesSearch && matchesRole && matchesStatus;
  });

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
    total: users.length,
    admins: users.filter(u => u.role_name === 'admin').length,
    active: users.filter(u => u.status_id === 13).length,
    blocked: users.filter(u => u.status_id === 15).length
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>👥 Управление пользователями</h1>
        <p>Создание, редактирование и управление пользователями системы</p>
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
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Всего пользователей</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👑</div>
          <div className="stat-info">
            <div className="stat-number">{stats.admins}</div>
            <div className="stat-label">Администраторов</div>
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
            <div className="stat-number">{stats.blocked}</div>
            <div className="stat-label">Заблокированных</div>
          </div>
        </div>
      </div>

      <div className="admin-controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все роли</option>
            <option value="admin">Администраторы</option>
            <option value="user">Пользователи</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>

        <div className="controls-right">
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetUserForm();
              setShowUserForm(true);
            }}
          >
            <span className="btn-icon">+</span>
            Добавить пользователя
          </button>
        </div>
      </div>

      {showUserForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? '✏️ Редактировать пользователя' : '👤 Создать пользователя'}</h3>
              <button className="modal-close" onClick={resetUserForm}>×</button>
            </div>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Имя *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    required
                    placeholder="Введите имя пользователя"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="+7 (XXX) XXX-XX-XX"
                  />
                </div>

                <div className="form-group">
                  <label>Пароль {!editingUser && '*'}</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    required={!editingUser}
                    placeholder={editingUser ? "Оставьте пустым для сохранения текущего" : "Введите пароль"}
                  />
                  {editingUser && (
                    <small className="form-hint">Оставьте пустым, чтобы не менять пароль</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Роль</label>
                  <select
                    value={userForm.role_id}
                    onChange={(e) => setUserForm({...userForm, role_id: parseInt(e.target.value)})}
                  >
                    <option value={1}>👑 Администратор</option>
                    <option value={2}>👤 Пользователь</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Статус</label>
                  <select
                    value={userForm.status_id}
                    onChange={(e) => setUserForm({...userForm, status_id: parseInt(e.target.value)})}
                  >
                    <option value={13}>🟢 Активный</option>
                    <option value={15}>🔴 Заблокирован</option>
                    <option value={14}>⚫ Неактивный</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetUserForm}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? '💾 Сохранить изменения' : '➕ Создать пользователя'}
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
            <p>Загрузка пользователей...</p>
          </div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Контакт</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Дата регистрации</th>
                  <th>Последний вход</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className={user.id === editingUser?.id ? 'editing' : ''}>
                    <td className="user-id">#{user.id}</td>
                    
                    <td className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </td>
                    
                    <td className="user-contact">
                      {user.phone ? (
                        <a href={`tel:${user.phone}`} className="phone-link">
                          📞 {user.phone}
                        </a>
                      ) : (
                        <span className="no-phone">Не указан</span>
                      )}
                    </td>
                    
                    <td>
                      <span className={`role-badge ${user.role_name}`}>
                        {user.role_name === 'admin' ? '👑 Админ' : '👤 Пользователь'}
                      </span>
                    </td>
                    
                    <td>
                      <span className={`status-badge status-${user.status_id}`}>
                        {user.status_name === 'user_active' && '🟢 Активный'}
                        {user.status_name === 'user_blocked' && '🔴 Заблокирован'}
                        {user.status_name === 'user_inactive' && '⚫ Неактивный'}
                      </span>
                    </td>
                    
                    <td className="date-cell">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      <div className="date-time">
                        {new Date(user.created_at).toLocaleTimeString('ru-RU')}
                      </div>
                    </td>
                    
                    <td className="date-cell">
                      {user.last_login_at ? (
                        <>
                          {new Date(user.last_login_at).toLocaleDateString('ru-RU')}
                          <div className="date-time">
                            {new Date(user.last_login_at).toLocaleTimeString('ru-RU')}
                          </div>
                        </>
                      ) : (
                        <span className="never-logged">Никогда</span>
                      )}
                    </td>
                    
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-edit"
                          onClick={() => handleEditUser(user)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        
                        <button 
                          className={`btn-action ${user.status_id === 13 ? 'btn-block' : 'btn-unblock'}`}
                          onClick={() => handleToggleUserStatus(user.id, user.status_id)}
                          title={user.status_id === 13 ? 'Заблокировать' : 'Разблокировать'}
                        >
                          {user.status_id === 13 ? '🚫' : '✅'}
                        </button>
                        
                        <button 
                          className="btn-action btn-reset"
                          onClick={() => handleResetPassword(user.id)}
                          title="Сбросить пароль"
                        >
                          🔑
                        </button>
                        
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Пользователи не найдены</h3>
                <p>Попробуйте изменить параметры поиска или фильтрации</p>
                {users.length === 0 && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowUserForm(true)}
                  >
                    Добавить первого пользователя
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {filteredUsers.length > 0 && (
        <div className="table-footer">
          <div className="table-info">
            Показано {filteredUsers.length} из {users.length} пользователей
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;