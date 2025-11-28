import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthContainer from '../auth/AuthContainer';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar componente de autenticación
  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  // Si está autenticado, mostrar el contenido protegido
  return children;
};

export default ProtectedRoute;