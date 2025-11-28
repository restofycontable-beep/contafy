import React, { useEffect, useState } from 'react';
import NuevoDocumentoModal from '../../components/procesamiento/NuevoDocumentoModal';
import { useAuth } from '../../contexts/AuthContext';
import './GestionarEmpresa.css';

const GestionarEmpresa = ({ empresaId, onViewChange, onEmpresaLoaded }) => {
  const { token } = useAuth();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [archivosZip, setArchivosZip] = useState([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [mostrarInfoEmpresa, setMostrarInfoEmpresa] = useState(false);
  const [mostrarZips, setMostrarZips] = useState(false);
  const [mostrarNomina, setMostrarNomina] = useState(false);

  useEffect(() => {
    if (empresaId) {
      cargarEmpresa();
      cargarArchivosZip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const cargarEmpresa = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setEmpresa(data.data);
        // Notificar al Dashboard para mostrar en el header
        if (onEmpresaLoaded) {
          onEmpresaLoaded(data.data);
        }
      } else {
        setError(data.error || 'Error al cargar empresa');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const cargarArchivosZip = async () => {
    try {
      setLoadingArchivos(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/listar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const archivosEmpresa = data.data.filter(archivo => archivo.empresa_id === empresaId);
          setArchivosZip(archivosEmpresa);
        }
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoadingArchivos(false);
    }
  };

  const eliminarEmpresa = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/${empresaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        if (onViewChange) {
          onViewChange('mis-empresas');
        }
      } else {
        const data = await response.json();
        setError(data.detail || data.error || 'Error al eliminar empresa');
      }
    } catch (error) {
      setError('Error de conexión');
    }
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

  const formatearTamano = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const descargarArchivo = async (zipId, nombreArchivo) => {
    try {
      const confirmarDescarga = window.confirm(
        `📥 Descargando: ${nombreArchivo}\n\n⚠️ IMPORTANTE: Este archivo se eliminará automáticamente del servidor después de la descarga.\n\n¿Continuar?`
      );
      
      if (!confirmarDescarga) {
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/descargar/${zipId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        await eliminarArchivoDelServidor(zipId, nombreArchivo);
      } else {
        alert('Error al descargar archivo');
      }
    } catch (error) {
      alert('Error al descargar archivo: ' + error.message);
    }
  };

  const eliminarArchivoDelServidor = async (zipId, nombreArchivo) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/eliminar/${zipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Archivo descargado y eliminado automáticamente del servidor');
        cargarArchivosZip();
      } else {
        const errorData = await response.json();
        alert('⚠️ Archivo descargado, pero no se pudo eliminar del servidor: ' + (errorData.detail || errorData.message || 'Error desconocido'));
      }
    } catch (error) {
      alert('⚠️ Archivo descargado, pero error al eliminar del servidor: ' + error.message);
    }
  };

  const eliminarArchivoZip = async (zipId, nombreArchivo) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el archivo "${nombreArchivo}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/eliminar/${zipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ ' + data.message);
        cargarArchivosZip();
      } else {
        const data = await response.json();
        alert('Error al eliminar archivo: ' + (data.detail || data.message || 'Error desconocido'));
      }
    } catch (error) {
      alert('Error al eliminar archivo: ' + error.message);
    }
  };

  if (loading) {
    return null;
  }

  if (error || !empresa) {
    return (
      <div className="gestionar-empresa-container">
        <div className="error-message">
          <span className="error-icon">❌</span>
          <p>{error || 'Empresa no encontrada'}</p>
          <button onClick={() => onViewChange && onViewChange('mis-empresas')} className="btn btn-retry">
            Volver a Mis Empresas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gestionar-empresa-container">
      <div className="gestionar-empresa-header-banner">
        <div className="welcome-section">
          <p className="gestionar-empresa-subtitle">
            🏢 Gestión de {empresa.razon_social}
          </p>
        </div>
      </div>

      <div className="gestionar-empresa-content-card">
        <div className="empresa-header-info">
          <div className="empresa-header-icon">
            <span className="empresa-icon-large">🏢</span>
          </div>
          <div className="empresa-header-details">
            <h2>{empresa.razon_social}</h2>
            <p className="empresa-nit-header">NIT: {empresa.nit}</p>
          </div>
        </div>

        <div className="gestionar-empresa-actions-grid">
          <button
            className="action-card"
            onClick={() => setMostrarInfoEmpresa(!mostrarInfoEmpresa)}
            title="Ver información completa de la empresa"
          >
            <div className="action-card-icon">👁️</div>
            <div className="action-card-content">
              <h3>Ver Empresa</h3>
              <p>Ver todos los datos de la empresa</p>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => onViewChange && onViewChange('editar-empresa', empresaId)}
            title="Editar información de la empresa"
          >
            <div className="action-card-icon">✏️</div>
            <div className="action-card-content">
              <h3>Editar</h3>
              <p>Modificar información de la empresa</p>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => onViewChange && onViewChange('configuracion-empresa', empresaId)}
            title="Ver configuración completa de la empresa"
          >
            <div className="action-card-icon">⚙️</div>
            <div className="action-card-content">
              <h3>Configuración</h3>
              <p>Ver y editar configuración</p>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => setShowModal(true)}
            title="Importar y procesar archivo DIAN"
          >
            <div className="action-card-icon">📁</div>
            <div className="action-card-content">
              <h3>Importar Archivo DIAN</h3>
              <p>Procesar archivos de la DIAN</p>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => {
              setMostrarZips(!mostrarZips);
              if (!mostrarZips) {
                cargarArchivosZip();
              }
            }}
            title="Ver archivos ZIP de esta empresa"
          >
            <div className="action-card-icon">📦</div>
            <div className="action-card-content">
              <h3>Ver ZIPs</h3>
              <p>{archivosZip.length} archivo{archivosZip.length !== 1 ? 's' : ''} disponible{archivosZip.length !== 1 ? 's' : ''}</p>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => setMostrarNomina(!mostrarNomina)}
            title="Gestionar nómina de la empresa"
          >
            <div className="action-card-icon">💼</div>
            <div className="action-card-content">
              <h3>Nómina</h3>
              <p>Gestionar nómina</p>
            </div>
          </button>


          <button
            className="action-card action-card-danger"
            onClick={eliminarEmpresa}
            title="Eliminar esta empresa"
          >
            <div className="action-card-icon">🗑️</div>
            <div className="action-card-content">
              <h3>Eliminar</h3>
              <p>Eliminar esta empresa</p>
            </div>
          </button>
        </div>

        {/* Sección de información de la empresa */}
        {mostrarInfoEmpresa && (
          <div className="empresa-info-section">
            <h4>👁️ Información de {empresa.razon_social}</h4>
            <div className="info-empresa-detalle">
              <div className="info-grid-detalle">
                <div className="info-item-detalle">
                  <strong>NIT:</strong>
                  <span>{empresa.nit}</span>
                </div>
                <div className="info-item-detalle">
                  <strong>Razón Social:</strong>
                  <span>{empresa.razon_social}</span>
                </div>
                <div className="info-item-detalle">
                  <strong>Nombre Comercial:</strong>
                  <span>{empresa.nombre_comercial || 'No especificado'}</span>
                </div>
                <div className="info-item-detalle">
                  <strong>Representante Legal:</strong>
                  <span>{empresa.representante_nombre}</span>
                </div>
                <div className="info-item-detalle">
                  <strong>NIT Representante:</strong>
                  <span>{empresa.representante_nit}</span>
                </div>
                <div className="info-item-detalle">
                  <strong>Dirección:</strong>
                  <span>{empresa.direccion || 'No especificada'}</span>
                </div>
                <div className="info-item-detalle">
                  <strong>Fecha de Registro:</strong>
                  <span>{new Date(empresa.created_at).toLocaleString('es-ES')}</span>
                </div>
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setMostrarInfoEmpresa(false)}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Sección de archivos ZIP */}
        {mostrarZips && (
          <div className="empresa-zip-section">
            <h4>
              📦 Archivos ZIP de {empresa.razon_social}
              <span className="zip-count">({archivosZip.length} archivo{archivosZip.length !== 1 ? 's' : ''})</span>
            </h4>
            {loadingArchivos ? (
              <div className="loading-zip">
                <span className="loading-icon">🔄</span>
                <p>Cargando archivos ZIP...</p>
              </div>
            ) : (
              <div className="zip-files-list">
                {archivosZip.map(archivo => (
                  <div key={archivo.id} className="zip-file-item">
                    <div className="zip-file-info">
                      <span className="zip-icon">
                        {archivo.tipo_procesamiento === 'ventas' ? '📊' : '🛒'}
                      </span>
                      <div className="zip-details">
                        <strong>{archivo.nombre_archivo}</strong>
                        <div className="zip-meta">
                          <span className="zip-type">
                            {archivo.tipo_procesamiento === 'ventas' ? '📈 Ventas' : '🛒 Compras'}
                          </span>
                          <span className="zip-date">
                            📅 {formatearFecha(archivo.fecha_generacion)}
                          </span>
                          <span className="zip-size">
                            💾 {formatearTamano(archivo.tamano_bytes)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="zip-actions">
                      <button
                        className="btn btn-download-small"
                        onClick={() => descargarArchivo(archivo.id, archivo.nombre_archivo)}
                        title="Descargar archivo"
                      >
                        Descargar
                      </button>
                      <button
                        className="btn btn-delete-small"
                        onClick={() => eliminarArchivoZip(archivo.id, archivo.nombre_archivo)}
                        title="Eliminar archivo"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setMostrarZips(false)}
              style={{ marginTop: '1.5rem' }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Sección de Nómina */}
        {mostrarNomina && (
          <div className="empresa-nomina-section">
            <h4>💼 Nómina - {empresa.razon_social}</h4>
            <div className="nomina-content">
              <p>Funcionalidades de nómina estarán disponibles próximamente.</p>
              <div className="nomina-placeholder">
                <span className="placeholder-icon">💼</span>
                <p>Módulo de nómina en desarrollo</p>
                <small>Aquí se implementarán las funcionalidades de gestión de nómina</small>
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setMostrarNomina(false)}
            >
              Cerrar
            </button>
          </div>
        )}


        <div className="gestionar-empresa-footer">
          <button
            className="btn btn-secondary"
            onClick={() => onViewChange && onViewChange('mis-empresas')}
          >
            ⬅️ Volver a Mis Empresas
          </button>
        </div>
      </div>

      {/* Modal para procesar archivo DIAN */}
      <NuevoDocumentoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(result) => {
          setShowModal(false);
          alert('Archivo procesado exitosamente');
        }}
        empresaSeleccionada={empresa}
      />
    </div>
  );
};

export default GestionarEmpresa;

