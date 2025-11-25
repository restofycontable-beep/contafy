import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = ({ onToggleMode, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  // Agregar clase al body para prevenir scroll
  useEffect(() => {
    document.body.classList.add('auth-active');
    return () => {
      document.body.classList.remove('auth-active');
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El usuario es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(formData.username, formData.password);
      
      if (!result.success) {
        setErrors({ general: result.error });
      }
      // Si es exitoso, el AuthContext manejará la redirección
    } catch (error) {
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' });
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/logoContafy.png" alt="Contafy Logo" className="logo-image" />
          </div>
          <h2>Iniciar Sesión</h2>
          <p>Accede a tu cuenta de Contafy</p>
        </div>

        <form onSubmit={handleSubmit} className={`auth-form ${loading ? 'loading' : ''}`}>
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Usuario o Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              placeholder="Ingresa tu usuario o email"
              disabled={loading}
            />
            <div className="focus-indicator"></div>
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
            <div className="focus-indicator"></div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {onForgotPassword && (
            <div style={{ textAlign: 'right', marginTop: '-10px' }}>
              <button
                type="button"
                className="link-button"
                onClick={onForgotPassword}
                disabled={loading}
                style={{ fontSize: '14px', padding: '0' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes cuenta?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onToggleMode}
              disabled={loading}
            >
              Registrarse
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;