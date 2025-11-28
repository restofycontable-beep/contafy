import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const ResetPassword = ({ token, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [validatingToken, setValidatingToken] = useState(true);

  const { resetPassword, validateResetToken } = useAuth();

  // Agregar clase al body para prevenir scroll
  useEffect(() => {
    document.body.classList.add('auth-active');
    return () => {
      document.body.classList.remove('auth-active');
    };
  }, []);

  // Validar token al cargar el componente
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenValid(false);
        setValidatingToken(false);
        return;
      }

      setValidatingToken(true);
      const result = await validateResetToken(token);
      
      if (result.success && result.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setErrors({ 
          general: result.error || 'El token de recuperación no es válido o ha expirado. Por favor, solicita un nuevo enlace de recuperación.' 
        });
      }
      setValidatingToken(false);
    };

    checkToken();
  }, [token, validateResetToken]);

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

    if (!formData.new_password) {
      newErrors.new_password = 'La contraseña es requerida';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Confirma tu contraseña';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!token) {
      setErrors({ general: 'Token inválido' });
      setTokenValid(false);
      return;
    }

    setLoading(true);
    setSuccess(false);
    
    try {
      const result = await resetPassword(
        token,
        formData.new_password,
        formData.confirm_password
      );
      
      if (result.success) {
        setSuccess(true);
        setErrors({});
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          if (onBackToLogin) {
            onBackToLogin();
          } else {
            window.location.href = '/';
          }
        }, 3000);
      } else {
        setErrors({ general: result.error || 'Error al restablecer contraseña' });
        if (result.error && result.error.includes('inválido') || result.error.includes('expirado')) {
          setTokenValid(false);
        }
      }
    } catch (error) {
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' });
      setTokenValid(false);
    }
    
    setLoading(false);
  };

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      window.location.href = '/';
    }
  };

  // Mostrar carga mientras se valida el token
  if (validatingToken) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logoContafy.png" alt="Contafy Logo" className="logo-image" />
            </div>
            <h2>Validando Enlace</h2>
            <p>Por favor espera mientras validamos tu enlace de recuperación...</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay token o el token no es válido
  if (!token || !tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logoContafy.png" alt="Contafy Logo" className="logo-image" />
            </div>
            <h2>Token Inválido</h2>
            <p>El enlace de recuperación no es válido</p>
          </div>
          <div className="error-message general-error">
            {errors.general || 'El token de recuperación no es válido o ha expirado. Por favor, solicita un nuevo enlace de recuperación.'}
          </div>
          <div className="auth-footer">
            <button 
              type="button" 
              className="link-button"
              onClick={handleBackToLogin}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logoContafy.png" alt="Contafy Logo" className="logo-image" />
            </div>
            <h2>¡Contraseña Restablecida!</h2>
            <p>Tu contraseña ha sido restablecida exitosamente</p>
          </div>
          <div className="success-message-container">
            <div className="success-message">
              <h3>¡Éxito!</h3>
              <p>Tu contraseña ha sido restablecida correctamente.</p>
              <p>Serás redirigido al inicio de sesión en unos segundos...</p>
            </div>
            <div className="auth-footer">
              <button 
                type="button" 
                className="link-button"
                onClick={handleBackToLogin}
              >
                Ir al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/logoContafy.png" alt="Contafy Logo" className="logo-image" />
          </div>
          <h2>Restablecer Contraseña</h2>
          <p>Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className={`auth-form ${loading ? 'loading' : ''}`}>
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="new_password">Nueva Contraseña</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className={errors.new_password ? 'error' : ''}
              placeholder="Mínimo 6 caracteres"
              disabled={loading || !tokenValid}
            />
            <div className="focus-indicator"></div>
            {errors.new_password && (
              <span className="error-message">{errors.new_password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={errors.confirm_password ? 'error' : ''}
              placeholder="Repite tu contraseña"
              disabled={loading || !tokenValid}
            />
            <div className="focus-indicator"></div>
            {errors.confirm_password && (
              <span className="error-message">{errors.confirm_password}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading || !tokenValid}
          >
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Recordaste tu contraseña?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={handleBackToLogin}
              disabled={loading}
            >
              Volver al inicio de sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

