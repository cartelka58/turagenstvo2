    import React, { useState, useEffect } from 'react';
    import { useAuth } from '../../contexts/AuthContext';

    const TourManagement = () => {
    const { user, getAuthHeaders } = useAuth();
    const [tours, setTours] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingTour, setEditingTour] = useState(null);
    const [showTourForm, setShowTourForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [tourForm, setTourForm] = useState({
        name: '',
        description: '',
        short_description: '',
        price: '',
        duration_days: '',
        category_id: '',
        image_url: '',
        destination: '',
        departure_city: 'Москва',
        is_discounted: false,
        discount_percentage: 0,
        original_price: '',
        is_popular: false,
        is_featured: false,
        max_travelers: 20,
        included_services: ['перелет', 'отель', 'питание'],
        not_included_services: ['виза', 'страховка']
    });

    const fetchTours = async () => {
        try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/tours');
        const data = await response.json();
        
        if (data.success) {
            setTours(data.data);
        } else {
            setError(data.message || 'Ошибка загрузки туров');
        }
        } catch (error) {
        setError('Ошибка соединения с сервером');
        } finally {
        setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
        const response = await fetch('http://localhost:5000/api/categories');
        const data = await response.json();
        
        if (data.success) {
            setCategories(data.data);
        }
        } catch (error) {
        console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchTours();
        fetchCategories();
    }, []);

    const resetTourForm = () => {
        setTourForm({
        name: '',
        description: '',
        short_description: '',
        price: '',
        duration_days: '',
        category_id: '',
        image_url: '',
        destination: '',
        departure_city: 'Москва',
        is_discounted: false,
        discount_percentage: 0,
        original_price: '',
        is_popular: false,
        is_featured: false,
        max_travelers: 20,
        included_services: ['перелет', 'отель', 'питание'],
        not_included_services: ['виза', 'страховка']
        });
        setEditingTour(null);
        setShowTourForm(false);
    };

    const handleCreateTour = async (e) => {
        e.preventDefault();
        try {
        const formData = {
            ...tourForm,
            price: parseInt(tourForm.price),
            duration_days: parseInt(tourForm.duration_days),
            discount_percentage: parseInt(tourForm.discount_percentage),
            original_price: tourForm.original_price ? parseInt(tourForm.original_price) : null,
            max_travelers: parseInt(tourForm.max_travelers)
        };

        const response = await fetch('http://localhost:5000/api/tours', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            setSuccess('Тур успешно создан!');
            resetTourForm();
            fetchTours();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(data.message || 'Ошибка при создании тура');
        }
        } catch (error) {
        setError('Ошибка соединения: ' + error.message);
        }
    };

    const handleUpdateTour = async (e) => {
        e.preventDefault();
        try {
        const formData = {
            ...tourForm,
            price: parseInt(tourForm.price),
            duration_days: parseInt(tourForm.duration_days),
            discount_percentage: parseInt(tourForm.discount_percentage),
            original_price: tourForm.original_price ? parseInt(tourForm.original_price) : null,
            max_travelers: parseInt(tourForm.max_travelers),
            is_active: true
        };

        const response = await fetch(`http://localhost:5000/api/tours/${editingTour.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            setSuccess('Тур успешно обновлен!');
            resetTourForm();
            fetchTours();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(data.message || 'Ошибка при обновлении тура');
        }
        } catch (error) {
        setError('Ошибка соединения: ' + error.message);
        }
    };

    const handleDeleteTour = async (tourId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот тур?')) return;
        
        try {
        const response = await fetch(`http://localhost:5000/api/tours/${tourId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            setSuccess('Тур успешно удален!');
            fetchTours();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(data.message || 'Ошибка при удалении тура');
        }
        } catch (error) {
        setError('Ошибка соединения: ' + error.message);
        }
    };

    const handleEditTour = (tour) => {
        setEditingTour(tour);
        setTourForm({
        name: tour.name,
        description: tour.description,
        short_description: tour.short_description,
        price: tour.price,
        duration_days: tour.duration_days,
        category_id: tour.category_id,
        image_url: tour.image_url,
        destination: tour.destination,
        departure_city: tour.departure_city || 'Москва',
        is_discounted: tour.is_discounted,
        discount_percentage: tour.discount_percentage || 0,
        original_price: tour.original_price || '',
        is_popular: tour.is_popular,
        is_featured: tour.is_featured,
        max_travelers: tour.max_travelers || 20,
        included_services: Array.isArray(tour.included_services) ? tour.included_services : ['перелет', 'отель', 'питание'],
        not_included_services: Array.isArray(tour.not_included_services) ? tour.not_included_services : ['виза', 'страховка']
        });
        setShowTourForm(true);
    };

    const handleToggleTourStatus = async (tourId, currentStatus) => {
        const newStatus = !currentStatus;
        
        try {
        const response = await fetch(`http://localhost:5000/api/tours/${tourId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ is_active: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            setSuccess(`Тур успешно ${newStatus ? 'активирован' : 'деактивирован'}!`);
            fetchTours();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(data.message || 'Ошибка при обновлении статуса');
        }
        } catch (error) {
        setError('Ошибка соединения: ' + error.message);
        }
    };

    const filteredTours = tours.filter(tour => {
        const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tour.destination.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || tour.category_id === categoryFilter;
        
        return matchesSearch && matchesCategory;
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
        total: tours.length,
        active: tours.filter(t => t.status_id === 1).length,
        popular: tours.filter(t => t.is_popular).length,
        discounted: tours.filter(t => t.is_discounted).length
    };

    return (
        <div className="admin-panel">
        <div className="admin-header">
            <h1>🏔️ Управление турами</h1>
            <p>Создание, редактирование и управление турами</p>
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
            <div className="stat-icon">🏔️</div>
            <div className="stat-info">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Всего туров</div>
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
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
                <div className="stat-number">{stats.popular}</div>
                <div className="stat-label">Популярных</div>
            </div>
            </div>
            <div className="stat-card">
            <div className="stat-icon">🎁</div>
            <div className="stat-info">
                <div className="stat-number">{stats.discounted}</div>
                <div className="stat-label">Со скидкой</div>
            </div>
            </div>
        </div>

        <div className="admin-controls">
            <div className="controls-left">
            <div className="search-box">
                <input
                type="text"
                placeholder="Поиск по названию или направлению..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>
            
            <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
            >
                <option value="all">Все категории</option>
                {categories.map(category => (
                <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                </option>
                ))}
            </select>
            </div>

            <div className="controls-right">
            <button 
                className="btn btn-primary"
                onClick={() => {
                resetTourForm();
                setShowTourForm(true);
                }}
            >
                <span className="btn-icon">+</span>
                Добавить тур
            </button>
            </div>
        </div>

        {showTourForm && (
            <div className="modal-overlay">
            <div className="modal large-modal">
                <div className="modal-header">
                <h3>{editingTour ? '✏️ Редактировать тур' : '🏔️ Создать тур'}</h3>
                <button className="modal-close" onClick={resetTourForm}>×</button>
                </div>
                
                <form onSubmit={editingTour ? handleUpdateTour : handleCreateTour} className="modal-form">
                <div className="form-grid">
                    <div className="form-group full-width">
                    <label>Название тура *</label>
                    <input
                        type="text"
                        value={tourForm.name}
                        onChange={(e) => setTourForm({...tourForm, name: e.target.value})}
                        required
                        placeholder="Название тура"
                    />
                    </div>
                    
                    <div className="form-group">
                    <label>Цена (руб) *</label>
                    <input
                        type="number"
                        value={tourForm.price}
                        onChange={(e) => setTourForm({...tourForm, price: e.target.value})}
                        required
                        placeholder="45000"
                    />
                    </div>
                    
                    <div className="form-group">
                    <label>Длительность (дней) *</label>
                    <input
                        type="number"
                        value={tourForm.duration_days}
                        onChange={(e) => setTourForm({...tourForm, duration_days: e.target.value})}
                        required
                        placeholder="7"
                    />
                    </div>
                    
                    <div className="form-group">
                    <label>Категория *</label>
                    <select
                        value={tourForm.category_id}
                        onChange={(e) => setTourForm({...tourForm, category_id: e.target.value})}
                        required
                    >
                        <option value="">Выберите категорию</option>
                        {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                        </option>
                        ))}
                    </select>
                    </div>
                    
                    <div className="form-group">
                    <label>Направление *</label>
                    <input
                        type="text"
                        value={tourForm.destination}
                        onChange={(e) => setTourForm({...tourForm, destination: e.target.value})}
                        required
                        placeholder="Анталия"
                    />
                    </div>
                    
                    <div className="form-group">
                    <label>Город вылета</label>
                    <input
                        type="text"
                        value={tourForm.departure_city}
                        onChange={(e) => setTourForm({...tourForm, departure_city: e.target.value})}
                        placeholder="Москва"
                    />
                    </div>
                    
                    <div className="form-group full-width">
                    <label>Краткое описание</label>
                    <input
                        type="text"
                        value={tourForm.short_description}
                        onChange={(e) => setTourForm({...tourForm, short_description: e.target.value})}
                        placeholder="Краткое описание тура"
                    />
                    </div>
                    
                    <div className="form-group full-width">
                    <label>Полное описание</label>
                    <textarea
                        value={tourForm.description}
                        onChange={(e) => setTourForm({...tourForm, description: e.target.value})}
                        placeholder="Полное описание тура"
                        rows="4"
                    />
                    </div>
                    
                    <div className="form-group full-width">
                    <label>URL изображения</label>
                    <input
                        type="text"
                        value={tourForm.image_url}
                        onChange={(e) => setTourForm({...tourForm, image_url: e.target.value})}
                        placeholder="/images/tour.jpg"
                    />
                    </div>
                    
                    <div className="form-group">
                    <label>Макс. участников</label>
                    <input
                        type="number"
                        value={tourForm.max_travelers}
                        onChange={(e) => setTourForm({...tourForm, max_travelers: e.target.value})}
                        placeholder="20"
                    />
                    </div>
                    
                    <div className="form-group checkbox-group">
                    <label>
                        <input
                        type="checkbox"
                        checked={tourForm.is_discounted}
                        onChange={(e) => setTourForm({...tourForm, is_discounted: e.target.checked})}
                        />
                        Скидка
                    </label>
                    </div>
                    
                    {tourForm.is_discounted && (
                    <>
                        <div className="form-group">
                        <label>Процент скидки</label>
                        <input
                            type="number"
                            value={tourForm.discount_percentage}
                            onChange={(e) => setTourForm({...tourForm, discount_percentage: e.target.value})}
                            placeholder="15"
                            min="1"
                            max="99"
                        />
                        </div>
                        
                        <div className="form-group">
                        <label>Исходная цена</label>
                        <input
                            type="number"
                            value={tourForm.original_price}
                            onChange={(e) => setTourForm({...tourForm, original_price: e.target.value})}
                            placeholder="50000"
                        />
                        </div>
                    </>
                    )}
                    
                    <div className="form-group checkbox-group">
                    <label>
                        <input
                        type="checkbox"
                        checked={tourForm.is_popular}
                        onChange={(e) => setTourForm({...tourForm, is_popular: e.target.checked})}
                        />
                        Популярный
                    </label>
                    </div>
                    
                    <div className="form-group checkbox-group">
                    <label>
                        <input
                        type="checkbox"
                        checked={tourForm.is_featured}
                        onChange={(e) => setTourForm({...tourForm, is_featured: e.target.checked})}
                        />
                        Рекомендуемый
                    </label>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={resetTourForm}>
                    Отмена
                    </button>
                    <button type="submit" className="btn btn-primary">
                    {editingTour ? '💾 Сохранить изменения' : '➕ Создать тур'}
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
                <p>Загрузка туров...</p>
            </div>
            ) : (
            <>
                <table className="users-table">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Тур</th>
                    <th>Категория</th>
                    <th>Направление</th>
                    <th>Цена</th>
                    <th>Длительность</th>
                    <th>Статус</th>
                    <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTours.map(tour => (
                    <tr key={tour.id} className={tour.id === editingTour?.id ? 'editing' : ''}>
                        <td className="user-id">#{tour.id}</td>
                        
                        <td className="user-info">
                        <div className="user-avatar">
                            {tour.category_icon || '🏔️'}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{tour.name}</div>
                            <div className="user-email">{tour.short_description}</div>
                        </div>
                        </td>
                        
                        <td>
                        <span className="role-badge">
                            {tour.category_icon} {tour.category_name}
                        </span>
                        </td>
                        
                        <td className="user-contact">
                        {tour.destination}
                        </td>
                        
                        <td>
                        <div className="price-info">
                            {tour.is_discounted ? (
                            <>
                                <span className="discounted-price">{tour.price?.toLocaleString('ru-RU')} ₽</span>
                                <span className="original-price">{tour.original_price?.toLocaleString('ru-RU')} ₽</span>
                            </>
                            ) : (
                            <span className="normal-price">{tour.price?.toLocaleString('ru-RU')} ₽</span>
                            )}
                        </div>
                        </td>
                        
                        <td>
                        {tour.duration_days} дней
                        </td>
                        
                        <td>
                        <span className={`status-badge status-${tour.status_id}`}>
                            {tour.status_id === 1 ? '🟢 Активный' : '🔴 Неактивный'}
                        </span>
                        <div className="tour-badges">
                            {tour.is_popular && <span className="badge-small popular">Популярный</span>}
                            {tour.is_discounted && <span className="badge-small discount">Скидка</span>}
                        </div>
                        </td>
                        
                        <td>
                        <div className="action-buttons">
                            <button 
                            className="btn-action btn-edit"
                            onClick={() => handleEditTour(tour)}
                            title="Редактировать"
                            >
                            ✏️
                            </button>
                            
                            <button 
                            className={`btn-action ${tour.status_id === 1 ? 'btn-block' : 'btn-unblock'}`}
                            onClick={() => handleToggleTourStatus(tour.id, tour.status_id === 1)}
                            title={tour.status_id === 1 ? 'Деактивировать' : 'Активировать'}
                            >
                            {tour.status_id === 1 ? '🚫' : '✅'}
                            </button>
                            
                            <button 
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteTour(tour.id)}
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

                {filteredTours.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🏔️</div>
                    <h3>Туры не найдены</h3>
                    <p>Попробуйте изменить параметры поиска или фильтрации</p>
                    {tours.length === 0 && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowTourForm(true)}
                    >
                        Добавить первый тур
                    </button>
                    )}
                </div>
                )}
            </>
            )}
        </div>

        {filteredTours.length > 0 && (
            <div className="table-footer">
            <div className="table-info">
                Показано {filteredTours.length} из {tours.length} туров
            </div>
            </div>
        )}
        </div>
    );
    };

    export default TourManagement;