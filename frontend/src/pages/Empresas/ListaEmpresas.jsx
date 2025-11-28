import React, { useEffect, useState } from 'react';
import SearchBar from '../../components/shared/SearchBar';
import SectionBanner from '../../components/shared/SectionBanner';
import { useAuth } from '../../contexts/AuthContext';
import { formatearFechaConHora } from '../../utils/dateUtils';
import { formatearTamano } from '../../utils/formatUtils';
import './ListaEmpresas.css';

const ListaEmpresas = ({ onViewChange, onEmpresaSelect }) => {
  const { token } = useAuth();
  
  

  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [archivosZip, setArchivosZip] = useState({});
  const [loadingArchivos, setLoadingArchivos] = useState({});
  const [configuraciones, setConfiguraciones] = useState({});
  const [loadingConfig, setLoadingConfig] = useState({});
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        const empresasCargadas = data.data || data.empresas || [];
        const empresasOrdenadas = [...empresasCargadas].sort((a, b) => {
          const nombreA = (a.razon_social || '').toLowerCase();
          const nombreB = (b.razon_social || '').toLowerCase();
          return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
        setEmpresas(empresasOrdenadas);
      } else {
        setError(data.detail || data.error || 'Error al cargar empresas');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const cargarArchivosZipEmpresa = async (empresaId) => {
    try {
      setLoadingArchivos(prev => ({ ...prev, [empresaId]: true }));
      
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
          setArchivosZip(prev => ({ ...prev, [empresaId]: archivosEmpresa }));
        }
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoadingArchivos(prev => ({ ...prev, [empresaId]: false }));
    }
  };

  const cargarConfiguracionEmpresa = async (empresaId) => {
    setLoadingConfig(prev => ({ ...prev, [empresaId]: true }));
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          setConfiguraciones(prev => ({ ...prev, [empresaId]: data.data }));
        } else {
          setConfiguraciones(prev => ({ ...prev, [empresaId]: null }));
        }
      } else {
        setConfiguraciones(prev => ({ ...prev, [empresaId]: null }));
      }
    } catch (error) {
      setConfiguraciones(prev => ({ ...prev, [empresaId]: null }));
    } finally {
      setLoadingConfig(prev => ({ ...prev, [empresaId]: false }));
    }
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
        const data = await response.json();
        alert('✅ Archivo descargado y eliminado automáticamente del servidor');
        
        // Recargar los archivos ZIP de la empresa
        cargarArchivosZipEmpresa(empresaSeleccionada?.id);
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
        // Recargar los archivos ZIP de la empresa
        cargarArchivosZipEmpresa(empresaSeleccionada?.id);
      } else {
        const data = await response.json();
        alert('Error al eliminar archivo: ' + (data.detail || data.message || 'Error desconocido'));
      }
    } catch (error) {
      alert('Error al eliminar archivo: ' + error.message);
    }
  };


  const eliminarEmpresa = async (e, empresaId) => {
    e.stopPropagation(); // Evita que se active la navegación al eliminar
    
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
        cargarEmpresas();
      } else {
        const data = await response.json();
        setError(data.detail || data.error || 'Error al eliminar empresa');
      }
    } catch (error) {
      setError('Error de conexión');
    }
  };


  const handleEditClick = (e, empresa) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que se active la navegación al editar
    
    
    // Navegar a la vista de editar empresa con el ID
    if (onViewChange) {
      onViewChange('editar-empresa', empresa.id);
    } else {
    }
  };

  const handleIconoClick = (e, empresa) => {
    // Si hay evento, evitar propagación (para botones internos)
    if (e) {
      e.stopPropagation();
    }
    // Establecer empresa seleccionada
    setEmpresaSeleccionada(empresa);
    if (onEmpresaSelect) {
      onEmpresaSelect(empresa);
    }
    // Redirigir a la pantalla de gestión de empresa
    if (onViewChange) {
      onViewChange('gestionar-empresa', empresa.id);
    }
  };


  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="empresas-container">
        <div className="error-message">
          <span className="error-icon">❌</span>
          <p>{error}</p>
          <button onClick={cargarEmpresas} className="btn btn-retry">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (empresas.length === 0) {
    return (
      <div className="empresas-container">
        <div className="empty-state">
          <span className="empty-icon">🏢</span>
          <h3>No hay empresas registradas</h3>
          <p>Comienza creando una nueva empresa</p>
        </div>
      </div>
    );
  }

  // Filtrar empresas basándose en el término de búsqueda
  const empresasFiltradas = empresas.filter(empresa => {
    if (!terminoBusqueda.trim()) {
      return true;
    }
    const busqueda = terminoBusqueda.toLowerCase().trim();
    const razonSocial = (empresa.razon_social || '').toLowerCase();
    const nit = (empresa.nit || '').toLowerCase();
    const representanteNombre = (empresa.representante_nombre || '').toLowerCase();
    
    return razonSocial.includes(busqueda) || 
           nit.includes(busqueda) || 
           representanteNombre.includes(busqueda);
  });

  return (
    <div className="empresas-container">
      <SectionBanner 
        title="MIS EMPRESAS"
        subtitle="Gestiona y administra todas tus empresas registradas"
        icon="📋"
      >
        <button 
          className="btn btn-primary"
          onClick={() => onViewChange && onViewChange('crear-empresa')}
        >
          ➕ Crear Empresa
        </button>
      </SectionBanner>

      <div className="empresa-form-card">
        <SearchBar
          placeholder="Buscar empresa por nombre, NIT o representante..."
          value={terminoBusqueda}
          onChange={setTerminoBusqueda}
        />
        
        {terminoBusqueda && (
          <div className="empresas-search-results">
            Mostrando {empresasFiltradas.length} de {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}
          </div>
        )}

        <div className="empresas-list">
        {empresasFiltradas.length === 0 && terminoBusqueda ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No se encontraron empresas</h3>
            <p>Intenta buscar con otro término</p>
            <button onClick={() => setTerminoBusqueda('')} className="btn btn-retry">
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          empresasFiltradas.map(empresa => (
          <div key={empresa.id}>
            <div 
              className={`empresa-row ${empresaSeleccionada && empresaSeleccionada.id === empresa.id ? 'empresa-seleccionada' : ''}`}
              onClick={() => handleIconoClick(null, empresa)}
              style={{ cursor: 'pointer' }}
            >
              <div className="empresa-icon-container">
                <span 
                  className="empresa-icon" 
                  title="Gestionar empresa"
                >
                  🏢
                </span>
                <span className="empresa-icon-label">Ver empresa</span>
              </div>
              
              <div className="empresa-info">
                <div className="empresa-main-info">
                  <div className="empresa-title">
                    <h3>{empresa.razon_social}</h3>
                    <span className="empresa-nit">NIT: {empresa.nit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de configuración de la empresa */}
            {configuraciones[empresa.id] && (
              <div className="empresa-config-section">
                <h4>
                  ⚙️ Configuración de {empresa.razon_social}
                </h4>
                {loadingConfig[empresa.id] ? (
                  <div className="loading-config">
                    <span className="loading-icon">🔄</span>
                    <p>Cargando configuración...</p>
                  </div>
                ) : configuraciones[empresa.id] ? (
                  <div className="config-details">
                    <div className="config-section">
                      <h5>📊 Tipos de Comprobantes</h5>
                      <div className="config-item">
                        <strong>📄 Factura:</strong>
                        <span>
                          {configuraciones[empresa.id].configuracion_comprobantes?.factura?.activo ? 
                            `✅ Sí (Código: ${configuraciones[empresa.id].configuracion_comprobantes.factura.codigo || 'N/A'})` : 
                            '❌ No'
                          }
                        </span>
                      </div>
                      <div className="config-item">
                        <strong>📋 Nota Crédito:</strong>
                        <span>
                          {configuraciones[empresa.id].configuracion_comprobantes?.nota_credito?.activo ? 
                            `✅ Sí (Código: ${configuraciones[empresa.id].configuracion_comprobantes.nota_credito.codigo || 'N/A'})` : 
                            '❌ No'
                          }
                        </span>
                      </div>
                      <div className="config-item">
                        <strong>📝 Nota Débito:</strong>
                        <span>
                          {configuraciones[empresa.id].configuracion_comprobantes?.nota_debito?.activo ? 
                            `✅ Sí (Código: ${configuraciones[empresa.id].configuracion_comprobantes.nota_debito.codigo || 'N/A'})` : 
                            '❌ No'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-config">
                    <span className="empty-icon">⚙️</span>
                    <p>No se pudo cargar la configuración</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        cargarConfiguracionEmpresa(empresa.id);
                      }} 
                      className="btn btn-retry"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sección de archivos ZIP de la empresa */}
            {archivosZip[empresa.id] && (
              <div className="empresa-zip-section">
                <h4>
                  📦 Archivos ZIP de {empresa.razon_social}
                  <span className="zip-count">({archivosZip[empresa.id].length} archivo{archivosZip[empresa.id].length !== 1 ? 's' : ''})</span>
                </h4>
                {loadingArchivos[empresa.id] ? (
                  <div className="loading-zip">
                    <span className="loading-icon">🔄</span>
                    <p>Cargando archivos ZIP...</p>
                  </div>
                ) : archivosZip[empresa.id].length === 0 ? (
                  <div className="empty-zip">
                    <span className="empty-icon">📭</span>
                    <p>No hay archivos ZIP generados para esta empresa</p>
                    <small>Genera archivos ZIP procesando archivos DIAN</small>
                  </div>
                ) : (
                  <div className="zip-files-list">
                    {archivosZip[empresa.id].map(archivo => (
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
                                📅 {formatearFechaConHora(archivo.fecha_generacion)}
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

export default ListaEmpresas;