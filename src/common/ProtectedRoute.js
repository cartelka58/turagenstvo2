import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user?.role === 'admin' && !user?.role_name === 'admin') {
    return (
      <div className="access-denied">
        <h2>🚫 Доступ запрещен</h2>
        <p>У вас нет прав для доступа к этой странице</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;