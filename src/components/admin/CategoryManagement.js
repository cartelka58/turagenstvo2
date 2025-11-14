import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CategoryManagement = () => {
  const { user, getAuthHeaders } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '🏖️'
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.message || 'Ошибка загрузки категорий');
      }
    } catch (error) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      icon: '🏖️'
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Категория успешно создана!');
        resetCategoryForm();
        fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при создании категории');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Категория успешно обновлена!');
        resetCategoryForm();
        fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при обновлении категории');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Категория успешно удалена!');
        fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Ошибка при удалении категории');
      }
    } catch (error) {
      setError('Ошибка соединения: ' + error.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '🏖️'
    });
    setShowCategoryForm(true);
  };

  const iconOptions = ['🏖️', '⛰️', '🏙️', '🧗', '🏛️', '🌋', '🏜️', '❄️', '🌅', '🏕️', '🗼', '🏰', '🌴', '🏞️', '🕌'];

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
        <h1>📂 Управление категориями</h1>
        <p>Создание, редактирование и управление категориями туров</p>
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
          <div className="stat-icon">📂</div>
          <div className="stat-info">
            <div className="stat-number">{categories.length}</div>
            <div className="stat-label">Всего категорий</div>
          </div>
        </div>
      </div>

      <div className="admin-controls">
        <div className="controls-right">
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetCategoryForm();
              setShowCategoryForm(true);
            }}
          >
            <span className="btn-icon">+</span>
            Добавить категорию
          </button>
        </div>
      </div>

      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCategory ? '✏️ Редактировать категорию' : '📂 Создать категорию'}</h3>
              <button className="modal-close" onClick={resetCategoryForm}>×</button>
            </div>
            
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Название категории *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    required
                    placeholder="Пляжный отдых"
                  />
                </div>
                
                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    placeholder="Описание категории"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Иконка</label>
                  <div className="icon-selector">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${categoryForm.icon === icon ? 'selected' : ''}`}
                        onClick={() => setCategoryForm({...categoryForm, icon})}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                    placeholder="🏖️"
                    className="icon-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetCategoryForm}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? '💾 Сохранить изменения' : '➕ Создать категорию'}
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
            <p>Загрузка категорий...</p>
          </div>
        ) : (
          <>
            <div className="categories-grid">
              {categories.map(category => (
                <div key={category.id} className="category-card">
                  <div className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    <h3 className="category-name">{category.name}</h3>
                  </div>
                  
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                  
                  <div className="category-meta">
                    <span className="category-id">ID: {category.id}</span>
                    <span className="category-date">
                      Создана: {new Date(category.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  
                  <div className="category-actions">
                    <button 
                      className="btn-action btn-edit"
                      onClick={() => handleEditCategory(category)}
                      title="Редактировать"
                    >
                      ✏️ Редактировать
                    </button>
                    
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteCategory(category.id)}
                      title="Удалить"
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>Категории не найдены</h3>
                <p>Создайте первую категорию для организации туров</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCategoryForm(true)}
                >
                  Добавить категорию
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;