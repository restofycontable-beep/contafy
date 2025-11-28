import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const ForgotPassword = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { requestPasswordReset } = useAuth();

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

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
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
    setSuccess(false);
    
    try {
      const result = await requestPasswordReset(formData.email);
      
      if (result.success) {
        setSuccess(true);
        setErrors({});
      } else {
        setErrors({ general: result.error || 'Error al solicitar recuperación de contraseña' });
      }
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
          <h2>Recuperar Contraseña</h2>
          <p>Ingresa tu email para recibir el enlace de recuperación</p>
        </div>

        {success ? (
          <div className="success-message-container">
            <div className="success-message">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                <h3 style={{ marginBottom: '12px', color: '#4CAF50' }}>¡Email enviado!</h3>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                  Revisa tu bandeja de entrada y la carpeta de spam.
                </p>
              </div>
            </div>
            <div className="auth-footer">
              <button 
                type="button" 
                className="link-button"
                onClick={onBackToLogin}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`auth-form ${loading ? 'loading' : ''}`}>
            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="tu@email.com"
                disabled={loading}
              />
              <div className="focus-indicator"></div>
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}

        {!success && (
          <div className="auth-footer">
            <p>
              ¿Recordaste tu contraseña?{' '}
              <button 
                type="button" 
                className="link-button"
                onClick={onBackToLogin}
                disabled={loading}
              >
                Volver al inicio de sesión
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

