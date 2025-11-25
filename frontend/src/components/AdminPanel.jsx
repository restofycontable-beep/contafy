import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminPanel.css';

const AdminPanel = ({ onViewChange }) => {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mostrarEmpresas, setMostrarEmpresas] = useState({});
  const [empresasUsuario, setEmpresasUsuario] = useState({});
  const [contadorEmpresas, setContadorEmpresas] = useState({});
  const [estadisticasDocumentos, setEstadisticasDocumentos] = useState({});
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState({});

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar contador de empresas y estadísticas de documentos para cada usuario
  useEffect(() => {
    if (usuarios.length > 0) {
      usuarios.forEach(usuario => {
        cargarContadorEmpresas(usuario.id);
        cargarEstadisticasDocumentos(usuario.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios`;
      // eslint-disable-next-line no-console
      console.log('🔄 Cargando usuarios desde:', url);
      // eslint-disable-next-line no-console
      console.log('🔑 Token disponible:', token ? 'Sí' : 'No');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // eslint-disable-next-line no-console
      console.log('📡 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      // eslint-disable-next-line no-console
      console.log('📦 Datos recibidos del backend:', data);
      // eslint-disable-next-line no-console
      console.log('📦 Tipo de data:', typeof data);
      // eslint-disable-next-line no-console
      console.log('📦 data.success:', data.success);
      // eslint-disable-next-line no-console
      console.log('📦 data.data:', data.data);
      // eslint-disable-next-line no-console
      console.log('📦 data.total:', data.total);
      // eslint-disable-next-line no-console
      console.log('📦 Es array data.data?:', Array.isArray(data.data));

      if (response.ok) {
        // El backend devuelve { success: true, data: [...], total: ... }
        if (data.success && data.data && Array.isArray(data.data)) {
          // eslint-disable-next-line no-console
          console.log('✅ Usuarios encontrados:', data.data.length);
          setUsuarios(data.data);
        } else if (Array.isArray(data)) {
          // Si la respuesta es directamente un array (fallback)
          // eslint-disable-next-line no-console
          console.log('✅ Usuarios encontrados (array directo):', data.length);
          setUsuarios(data);
        } else if (data.data && Array.isArray(data.data)) {
          // eslint-disable-next-line no-console
          console.log('✅ Usuarios encontrados (data.data):', data.data.length);
          setUsuarios(data.data);
        } else {
          // eslint-disable-next-line no-console
          console.warn('⚠️ Formato de respuesta inesperado:', data);
          setUsuarios([]);
          setError('No se encontraron usuarios o formato de respuesta inesperado');
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('❌ Error en la respuesta:', data);
        setError(data.error || data.detail || 'Error al cargar usuarios');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error cargando usuarios:', error);
      setError('Error de conexión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarContadorEmpresas = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios/${userId}/empresas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setContadorEmpresas(prev => ({
          ...prev,
          [userId]: data.total || 0
        }));
      }
    } catch (error) {
      // Error cargando contador
    }
  };

  const cargarEstadisticasDocumentos = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios/${userId}/estadisticas-documentos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEstadisticasDocumentos(prev => ({
          ...prev,
          [userId]: data.data
        }));
      }
    } catch (error) {
      // Error cargando estadísticas
    }
  };

  const cargarEmpresasUsuario = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios/${userId}/empresas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmpresasUsuario(prev => ({
          ...prev,
          [userId]: data.data || []
        }));
      }
    } catch (error) {
      // Error cargando empresas
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirm_password) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const url = usuarioEditando
        ? `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios/${usuarioEditando.id}`
        : `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios`;

      const method = usuarioEditando ? 'PUT' : 'POST';

      const bodyData = { ...formData };
      if (usuarioEditando && !bodyData.password) {
        delete bodyData.password;
        delete bodyData.confirm_password;
      } else if (bodyData.password) {
        delete bodyData.confirm_password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(usuarioEditando ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        setMostrarFormulario(false);
        setUsuarioEditando(null);
        resetForm();
        cargarUsuarios();
      } else {
        alert(data.error || 'Error al guardar usuario');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      username: usuario.username,
      email: usuario.email,
      full_name: usuario.full_name || '',
      password: '',
      confirm_password: ''
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (usuarioId, username) => {
    if (!window.confirm(`¿Estás seguro de que deseas desactivar al usuario "${username}"?\n\n⚠️ El usuario NO podrá iniciar sesión, pero TODOS sus datos (empresas, archivos, etc.) se mantendrán intactos.\n\n✅ Podrás reactivarlo cuando haya pagado.`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios/${usuarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Usuario desactivado exitosamente. Sus datos se mantienen y puede ser reactivado cuando pague.');
        cargarUsuarios();
      } else {
        alert(data.error || 'Error al desactivar usuario');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleActivar = async (usuarioId) => {
    if (!window.confirm(`¿Estás seguro de que deseas activar este usuario?\n\n✅ El usuario podrá iniciar sesión y tendrá acceso a TODAS sus empresas y datos guardados.`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/admin/usuarios/${usuarioId}/activar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Usuario activado exitosamente. Ahora tiene acceso a todas sus empresas y datos.');
        cargarUsuarios();
      } else {
        alert(data.error || 'Error al activar usuario');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      confirm_password: ''
    });
  };

  const formatearFecha = (fechaString) => {
    try {
      return new Date(fechaString).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaString;
    }
  };

  // Filtrar usuarios basándose en el término de búsqueda
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (!terminoBusqueda.trim()) {
      return true;
    }
    const busqueda = terminoBusqueda.toLowerCase().trim();
    const username = (usuario.username || '').toLowerCase();
    const email = (usuario.email || '').toLowerCase();
    const fullName = (usuario.full_name || '').toLowerCase();
    
    return username.includes(busqueda) || 
           email.includes(busqueda) || 
           fullName.includes(busqueda);
  });

  if (error && error.includes('permisos')) {
    return (
      <div className="admin-panel-container">
        <div className="error-message">
          <span className="error-icon">🔒</span>
          <p>No tienes permisos de administrador</p>
          <button onClick={() => onViewChange && onViewChange('dashboard')} className="btn btn-secondary">
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header-banner">
        <div className="welcome-section">
          <p className="admin-subtitle">
            👥 Administración de Clientes. Gestiona todos los usuarios del sistema
          </p>
        </div>
      </div>

      <div className="admin-content-card">
        <div className="admin-header">
          <div className="admin-header-top">
            <div className="admin-header-title">
              <h2>Gestión de Clientes</h2>
            </div>
            <div className="admin-actions">
              <div className="admin-search-container">
                <input
                  type="text"
                  placeholder="🔍 Buscar por usuario, email o nombre..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  className="admin-search-input"
                />
                {terminoBusqueda && (
                  <button
                    onClick={() => setTerminoBusqueda('')}
                    className="admin-search-clear"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setUsuarioEditando(null);
                  resetForm();
                  setMostrarFormulario(!mostrarFormulario);
                }}
              >
                {mostrarFormulario ? '❌ Cancelar' : '➕ Crear Cliente'}
              </button>
            </div>
          </div>
          {terminoBusqueda && (
            <div className="admin-search-results">
              Mostrando {usuariosFiltrados.length} de {usuarios.length} cliente{usuarios.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Formulario de crear/editar usuario */}
        {mostrarFormulario && (
          <div className="admin-form-section">
            <h3>{usuarioEditando ? '✏️ Editar Cliente' : '➕ Crear Nuevo Cliente'}</h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Usuario *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!usuarioEditando}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              {(!usuarioEditando || formData.password) && (
                <div className="form-row">
                  <div className="form-group">
                    <label>{usuarioEditando ? 'Nueva Contraseña' : 'Contraseña *'}</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!usuarioEditando}
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Contraseña *</label>
                    <input
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      required={!usuarioEditando || !!formData.password}
                      minLength={6}
                    />
                  </div>
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {usuarioEditando ? '💾 Actualizar' : '➕ Crear'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setUsuarioEditando(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="usuarios-list">
          {loading ? null : error ? (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <p>{error}</p>
              <button onClick={cargarUsuarios} className="btn btn-retry">
                Reintentar
              </button>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h3>No hay usuarios registrados</h3>
              <p>Comienza creando un nuevo cliente</p>
            </div>
          ) : usuariosFiltrados.length === 0 && terminoBusqueda ? (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <h3>No se encontraron usuarios</h3>
              <p>No hay usuarios que coincidan con "{terminoBusqueda}"</p>
              <button 
                className="btn btn-secondary" 
                onClick={() => setTerminoBusqueda('')}
                style={{ marginTop: '1rem' }}
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            usuariosFiltrados.map(usuario => (
              <div key={usuario.id} className="usuario-card">
                <div className="usuario-header">
                  <div className="usuario-avatar">
                    <span>{usuario.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="usuario-info">
                    <h3>{usuario.username}</h3>
                    <p className="usuario-email">{usuario.email}</p>
                    {usuario.full_name && (
                      <p className="usuario-name">{usuario.full_name}</p>
                    )}
                  </div>
                  <div className="usuario-status">
                    {usuario.is_superuser && (
                      <span className="badge badge-admin">👑 Admin</span>
                    )}
                    {usuario.is_active ? (
                      <span className="badge badge-active">✅ Activo</span>
                    ) : (
                      <span className="badge badge-inactive">❌ Inactivo</span>
                    )}
                  </div>
                </div>
                <div className="usuario-details">
                  <div className="detail-item">
                    <strong>Registro:</strong>
                    <span>{formatearFecha(usuario.created_at)}</span>
                  </div>
                  {usuario.last_login && (
                    <div className="detail-item">
                      <strong>Último acceso:</strong>
                      <span>{formatearFecha(usuario.last_login)}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Empresas:</strong>
                    <span className="empresas-count">
                      {contadorEmpresas[usuario.id] !== undefined 
                        ? `${contadorEmpresas[usuario.id]} empresa${contadorEmpresas[usuario.id] !== 1 ? 's' : ''}`
                        : 'Cargando...'}
                    </span>
                  </div>
                  {estadisticasDocumentos[usuario.id] && (
                    <div className="detail-item">
                      <strong>📄 Documentos gestionados (histórico):</strong>
                      <span className="documentos-count">
                        {estadisticasDocumentos[usuario.id].documentos_dian_aproximados || 0} doc. DIAN aprox.
                        {' '}({estadisticasDocumentos[usuario.id].total_filas_excel_generadas || 0} líneas Excel)
                      </span>
                      <span className="documentos-note" style={{fontSize: '11px', color: '#666', display: 'block', marginTop: '2px'}}>
                        ℹ️ Incluye archivos eliminados para control histórico
                      </span>
                    </div>
                  )}
                  {estadisticasDocumentos[usuario.id] && (
                    <div className="detail-item">
                      <strong>📦 Archivos (histórico):</strong>
                      <span className="archivos-count">
                        {estadisticasDocumentos[usuario.id].total_archivos_procesados || 0} procesados
                        {' '}({estadisticasDocumentos[usuario.id].total_archivos_procesados_activos || 0} activos)
                        {' • '}
                        {estadisticasDocumentos[usuario.id].total_archivos_zip_generados || 0} ZIP generados
                        {' '}({estadisticasDocumentos[usuario.id].total_archivos_zip_activos || 0} activos)
                      </span>
                    </div>
                  )}
                </div>
                <div className="usuario-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setMostrarEmpresas(prev => ({
                        ...prev,
                        [usuario.id]: !prev[usuario.id]
                      }));
                      if (!mostrarEmpresas[usuario.id] && !empresasUsuario[usuario.id]) {
                        cargarEmpresasUsuario(usuario.id);
                      }
                    }}
                  >
                    {mostrarEmpresas[usuario.id] ? '📦 Ocultar Empresas' : '📦 Ver Empresas'}
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setMostrarEstadisticas(prev => ({
                        ...prev,
                        [usuario.id]: !prev[usuario.id]
                      }));
                      if (!mostrarEstadisticas[usuario.id] && !estadisticasDocumentos[usuario.id]) {
                        cargarEstadisticasDocumentos(usuario.id);
                      }
                    }}
                  >
                    {mostrarEstadisticas[usuario.id] ? '📊 Ocultar Estadísticas' : '📊 Ver Estadísticas'}
                  </button>
                  {!usuario.is_superuser && (
                    <>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleEditar(usuario)}
                      >
                        ✏️ Editar
                      </button>
                      {usuario.is_active ? (
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleEliminar(usuario.id, usuario.username)}
                          title="Desactivar usuario (sus datos se mantienen)"
                        >
                          🗑️ Desactivar
                        </button>
                      ) : (
                        <button
                          className="btn btn-success btn-small"
                          onClick={() => handleActivar(usuario.id)}
                          title="Activar usuario (recuperará acceso a todos sus datos)"
                        >
                          ✅ Activar
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Empresas del usuario */}
                {mostrarEmpresas[usuario.id] && empresasUsuario[usuario.id] && (
                  <div className="usuario-empresas-section">
                    <div className="empresas-section-header">
                      <h4>📦 Empresas de {usuario.username}</h4>
                      <span className="empresas-total">
                        {empresasUsuario[usuario.id].length} empresa{empresasUsuario[usuario.id].length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {empresasUsuario[usuario.id].length === 0 ? (
                      <p className="no-empresas">No tiene empresas registradas</p>
                    ) : (
                      <div className="empresas-grid">
                        {empresasUsuario[usuario.id].map(empresa => (
                          <div key={empresa.id} className="empresa-mini-card">
                            <div className="empresa-mini-card-header">
                              <h5>{empresa.razon_social}</h5>
                              {empresa.nombre_comercial && empresa.nombre_comercial !== empresa.razon_social && (
                                <p className="empresa-nombre-comercial">{empresa.nombre_comercial}</p>
                              )}
                            </div>
                            <div className="empresa-mini-card-details">
                              <div className="empresa-detail-item">
                                <strong>NIT:</strong>
                                <span>{empresa.nit}</span>
                              </div>
                              {empresa.representante_nombre && (
                                <div className="empresa-detail-item">
                                  <strong>Representante:</strong>
                                  <span>{empresa.representante_nombre}</span>
                                </div>
                              )}
                              {empresa.created_at && (
                                <div className="empresa-detail-item">
                                  <strong>Registro:</strong>
                                  <span>{formatearFecha(empresa.created_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Estadísticas de documentos del usuario */}
                {mostrarEstadisticas[usuario.id] && estadisticasDocumentos[usuario.id] && (
                  <div className="usuario-estadisticas-section">
                    <div className="estadisticas-section-header">
                      <h4>📊 Estadísticas de Documentos - {usuario.username}</h4>
                    </div>
                    <div className="estadisticas-grid">
                      <div className="estadistica-card">
                        <div className="estadistica-icon">📄</div>
                        <div className="estadistica-content">
                          <h5>Documentos DIAN (Aprox.)</h5>
                          <p className="estadistica-value">
                            {estadisticasDocumentos[usuario.id].documentos_dian_aproximados || 0}
                          </p>
                          <p className="estadistica-note">
                            {estadisticasDocumentos[usuario.id].total_filas_excel_generadas || 0} líneas Excel generadas
                          </p>
                        </div>
                      </div>
                      <div className="estadistica-card">
                        <div className="estadistica-icon">📁</div>
                        <div className="estadistica-content">
                          <h5>Archivos Procesados</h5>
                          <p className="estadistica-value">
                            {estadisticasDocumentos[usuario.id].total_archivos_procesados || 0}
                          </p>
                          <p className="estadistica-note">
                            Total histórico (incluye eliminados)
                            <br />
                            {estadisticasDocumentos[usuario.id].total_archivos_procesados_activos || 0} activos
                          </p>
                        </div>
                      </div>
                      <div className="estadistica-card">
                        <div className="estadistica-icon">📦</div>
                        <div className="estadistica-content">
                          <h5>Archivos ZIP</h5>
                          <p className="estadistica-value">
                            {estadisticasDocumentos[usuario.id].total_archivos_zip_generados || 0}
                          </p>
                          <p className="estadistica-note">
                            Total histórico (incluye eliminados)
                            <br />
                            {estadisticasDocumentos[usuario.id].total_archivos_zip_activos || 0} activos
                          </p>
                        </div>
                      </div>
                    </div>
                    {estadisticasDocumentos[usuario.id].estadisticas_por_empresa && 
                     estadisticasDocumentos[usuario.id].estadisticas_por_empresa.length > 0 && (
                      <div className="estadisticas-empresas">
                        <h5>📋 Por Empresa:</h5>
                        <div className="estadisticas-empresas-list">
                          {estadisticasDocumentos[usuario.id].estadisticas_por_empresa.map((est, idx) => (
                            <div key={idx} className="estadistica-empresa-item">
                              <strong>{est.empresa_nombre}</strong> ({est.empresa_nit})
                              <div className="estadistica-empresa-detalle">
                                <span>📄 {est.documentos_dian_aproximados} doc. DIAN</span>
                                <span>📁 {est.archivos_procesados} archivos ({est.archivos_procesados_activos || 0} activos)</span>
                                <span>📦 {est.archivos_zip_generados} ZIPs ({est.archivos_zip_activos || 0} activos)</span>
                                <span>📊 {est.total_filas_excel} líneas Excel</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="estadistica-nota">
                      ℹ️ Nota: 1 línea DIAN puede generar hasta 4 líneas Excel. Los documentos DIAN son aproximados.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

