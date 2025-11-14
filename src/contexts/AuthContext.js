import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const isHealthy = response.ok;
      setServerAvailable(isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('Server health check failed:', error);
      setServerAvailable(false);
      return false;
    }
  };

  const register = async (email, password, name, phone = '') => {
    if (!serverAvailable) {
      return { success: false, error: 'Сервер недоступен. Проверьте подключение.' };
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('token', data.data.token);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Ошибка регистрации' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Ошибка соединения с сервером' };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!serverAvailable) {
      return { success: false, error: 'Сервер недоступен. Проверьте подключение.' };
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('token', data.data.token);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Неверный email или пароль' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ошибка соединения с сервером' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const checkAuth = async () => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      setUser(null);
      return;
    }
    try {
      const userData = JSON.parse(savedUser);
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role_name === 'admin';
  };

  useEffect(() => {
    checkServerHealth();
    checkAuth();
    const healthCheckInterval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(healthCheckInterval);
  }, []);

  const value = {
    user,
    isLoading,
    serverAvailable,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    checkServerHealth,
    getAuthHeaders,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};