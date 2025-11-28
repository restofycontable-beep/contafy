import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ConfiguracionUsuario.css';

const ConfiguracionUsuario = ({ onViewChange }) => {
  const { user, updateProfile, changePassword } = useAuth();
  
  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil', 'password', 'cuenta'
  
  // Estados para perfil
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    full_name: ''
  });
  
  // Actualizar datos del perfil cuando el usuario cambie
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || ''
      });
    }
  }, [user]);
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    
    if (!profileData.username || profileData.username.length < 3) {
      newErrors.username = 'El username debe tener al menos 3 caracteres';
    }
    
    if (!profileData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.current_password) {
      newErrors.current_password = 'Debes ingresar tu contraseña actual';
    }
    
    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      newErrors.new_password = 'La nueva contraseña debe tener al menos 6 caracteres';
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    if (!validateProfile()) {
      setMessage({ text: 'Por favor corrige los errores en el formulario', type: 'error' });
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setMessage({ text: 'Perfil actualizado exitosamente', type: 'success' });
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: result.error || 'Error al actualizar perfil', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    if (!validatePassword()) {
      setMessage({ text: 'Por favor corrige los errores en el formulario', type: 'error' });
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await changePassword(passwordData);
      
      if (result.success) {
        setMessage({ text: 'Contraseña actualizada exitosamente', type: 'success' });
        // Limpiar formulario
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: result.error || 'Error al cambiar contraseña', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="configuracion-usuario-container">
      <div className="configuracion-usuario-header-banner">
        <div className="welcome-section">
          <h1 className="configuracion-usuario-title">⚙️ Configuración</h1>
          <p className="configuracion-usuario-subtitle">
            Gestiona tu perfil y configuración de cuenta
          </p>
        </div>
      </div>

      <div className="configuracion-usuario-content-card">
        <div className="configuracion-usuario-tabs">
          <button
            className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            👤 Mi Perfil
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            🔐 Contraseña
          </button>
          <button
            className={`tab-button ${activeTab === 'cuenta' ? 'active' : ''}`}
            onClick={() => setActiveTab('cuenta')}
          >
            ℹ️ Mi Cuenta
          </button>
        </div>

        {message.text && (
          <div className={`message-alert ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="configuracion-usuario-section">
            <h2 className="section-title">Información del Perfil</h2>
            <form onSubmit={handleUpdateProfile} className="configuracion-usuario-form">
              <div className="form-group">
                <label htmlFor="username">Usuario *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  className={errors.username ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.username && (
                  <span className="error-message">{errors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className={errors.email ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group full-width">
                <label htmlFor="full_name">Nombre Completo</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleProfileChange}
                  disabled={loading}
                  placeholder="Opcional"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="configuracion-usuario-section">
            <h2 className="section-title">Cambiar Contraseña</h2>
            <form onSubmit={handleChangePassword} className="configuracion-usuario-form">
              <div className="form-group">
                <label htmlFor="current_password">Contraseña Actual *</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className={errors.current_password ? 'input-error' : ''}
                  disabled={loading}
                  placeholder="Ingresa tu contraseña actual"
                />
                {errors.current_password && (
                  <span className="error-message">{errors.current_password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="new_password">Nueva Contraseña *</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className={errors.new_password ? 'input-error' : ''}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.new_password && (
                  <span className="error-message">{errors.new_password}</span>
                )}
              </div>

              <div className="form-group full-width">
                <label htmlFor="confirm_password">Confirmar Nueva Contraseña *</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className={errors.confirm_password ? 'input-error' : ''}
                  disabled={loading}
                  placeholder="Repite la nueva contraseña"
                />
                {errors.confirm_password && (
                  <span className="error-message">{errors.confirm_password}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Cambiando...' : '🔐 Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'cuenta' && (
          <div className="configuracion-usuario-section">
            <h2 className="section-title">Información de la Cuenta</h2>
            <div className="account-info-grid">
              <div className="info-card">
                <div className="info-card-icon">📅</div>
                <div className="info-card-content">
                  <h3>Fecha de Registro</h3>
                  <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString('es-CO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'No disponible'}</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon">🕐</div>
                <div className="info-card-content">
                  <h3>Último Acceso</h3>
                  <p>{user?.last_login ? new Date(user.last_login).toLocaleString('es-CO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Nunca'}</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon">✅</div>
                <div className="info-card-content">
                  <h3>Estado de la Cuenta</h3>
                  <p>
                    <span className={`status-badge ${user?.is_active ? 'active' : 'inactive'}`}>
                      {user?.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon">🔒</div>
                <div className="info-card-content">
                  <h3>Verificación</h3>
                  <p>
                    <span className={`status-badge ${user?.is_verified ? 'verified' : 'unverified'}`}>
                      {user?.is_verified ? 'Verificada' : 'No verificada'}
                    </span>
                  </p>
                </div>
              </div>

              {user?.is_superuser && (
                <div className="info-card full-width">
                  <div className="info-card-icon">👑</div>
                  <div className="info-card-content">
                    <h3>Rol de Usuario</h3>
                    <p>
                      <span className="status-badge admin">Administrador</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionUsuario;

