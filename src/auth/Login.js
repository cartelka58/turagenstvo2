  import React, { useState } from 'react';
  import { NavLink, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';

  const Login = () => {
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });
    const [error, setError] = useState('');

    
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    };

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h2>Вход в аккаунт</h2>
            <p className="auth-subtitle">Войдите, чтобы управлять своими бронированиями</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="Используйте 'password'"
                />
                <small className="password-hint">Для демо используйте пароль: password</small>
              </div>
              
              <button type="submit" disabled={isLoading} className="auth-button">
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </form>
            
            <div className="auth-links">
              <p>Ещё нет аккаунта? <NavLink to="/register">Зарегистрироваться</NavLink></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default Login;