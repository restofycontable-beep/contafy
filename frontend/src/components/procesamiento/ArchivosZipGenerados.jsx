import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/ArchivosZipGenerados.css';

const ArchivosZipGenerados = () => {
  const { token } = useAuth();
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🎯 Componente ArchivosZipGenerados montado');

  useEffect(() => {
    console.log('🔄 useEffect ejecutado - cargando archivos');
    cargarArchivosZip();
  }, []);

  const cargarArchivosZip = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando archivos ZIP...');
      console.log('🔑 Token disponible:', token ? 'Sí' : 'No');
      
      const url = `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/listar`;
      console.log('🌐 URL de la petición:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Datos recibidos:', data);

      if (data.success) {
        console.log('✅ Archivos cargados exitosamente:', data.data?.length || 0, 'archivos');
        setArchivos(data.data || []);
      } else {
        console.error('❌ Error en la respuesta:', data);
        setError(data.message || 'Error al cargar archivos ZIP');
      }
    } catch (error) {
      console.error('❌ Error cargando archivos ZIP:', error);
      setError('Error de conexión al servidor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const descargarArchivo = async (zipId, nombreArchivo) => {
    try {
      console.log('🔄 Iniciando descarga de ZIP:', zipId, nombreArchivo);
      
      // Mostrar notificación sobre eliminación automática
      const confirmarDescarga = window.confirm(
        `📥 Descargando: ${nombreArchivo}\n\n⚠️ IMPORTANTE: Este archivo se eliminará automáticamente del servidor después de la descarga.\n\n¿Continuar?`
      );
      
      if (!confirmarDescarga) {
        console.log('❌ Usuario canceló la descarga');
        return;
      }
      
      console.log('✅ Usuario confirmó la descarga, procediendo...');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/descargar/${zipId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Respuesta descarga:', response.status, response.statusText);

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
        
        console.log('✅ Archivo descargado exitosamente, procediendo a eliminar del servidor...');
        
        // Eliminar el archivo del servidor después de la descarga
        await eliminarArchivoDelServidor(zipId, nombreArchivo);
        
      } else {
        const data = await response.json();
        console.error('❌ Error al descargar:', data);
        alert('Error al descargar archivo: ' + (data.detail || data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      alert('Error al descargar archivo: ' + error.message);
    }
  };

  const eliminarArchivoDelServidor = async (zipId, nombreArchivo) => {
    try {
      console.log('🗑️ Eliminando archivo del servidor:', zipId, nombreArchivo);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/eliminar/${zipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Respuesta eliminación:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Archivo eliminado del servidor:', data);
        
        // Recargar la lista de archivos
        console.log('🔄 Recargando lista de archivos...');
        await cargarArchivosZip();
        
        alert('✅ Archivo descargado y eliminado automáticamente del servidor');
      } else {
        const data = await response.json();
        console.error('❌ Error eliminando archivo:', data);
        alert('⚠️ Archivo descargado, pero no se pudo eliminar del servidor: ' + (data.detail || data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error eliminando archivo del servidor:', error);
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
        // Recargar la lista de archivos
        cargarArchivosZip();
      } else {
        const data = await response.json();
        alert('Error al eliminar archivo: ' + (data.detail || data.message || 'Error desconocido'));
      }
    } catch (error) {
      alert('Error al eliminar archivo: ' + error.message);
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

  if (loading) {
    return (
      <div className="archivos-zip-container">
        <div className="loading-message">
          <span className="loading-icon">🔄</span>
          <p>Cargando archivos ZIP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="archivos-zip-container">
        <div className="error-message">
          <span className="error-icon">❌</span>
          <p>{error}</p>
          <button onClick={cargarArchivosZip} className="btn btn-retry">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="archivos-zip-container">
      <div className="archivos-zip-header">
        <h2>📦 Archivos ZIP Generados</h2>
        <p>Descarga los modelos de ventas y compras generados</p>
        <button onClick={cargarArchivosZip} className="btn btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {archivos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No hay archivos ZIP generados</h3>
          <p>Genera modelos de ventas o compras para ver archivos aquí</p>
        </div>
      ) : (
        <div className="archivos-zip-list">
          {archivos.map(archivo => (
            <div key={archivo.id} className="archivo-zip-item">
              <div className="archivo-zip-info">
                <div className="archivo-zip-icon">
                  {archivo.tipo_procesamiento === 'ventas' ? '📊' : '🛒'}
                </div>
                
                <div className="archivo-zip-details">
                  <h4>{archivo.nombre_archivo}</h4>
                  <div className="archivo-zip-meta">
                    <span className="tipo-procesamiento">
                      {archivo.tipo_procesamiento === 'ventas' ? 'Modelo Ventas' : 'Modelo Compras'}
                    </span>
                    <span className="empresa">Empresa: {archivo.empresa?.razon_social || archivo.empresa_nombre || 'N/A'}</span>
                    <span className="cedula">NIT: {archivo.numero_cedula}</span>
                    <span className="fecha">Generado: {formatearFecha(archivo.fecha_generacion)}</span>
                    <span className="tamano">Tamaño: {formatearTamano(archivo.tamano_bytes)}</span>
                  </div>
                </div>
              </div>

              <div className="archivo-zip-actions">
                <button
                  className="btn btn-download"
                  onClick={() => descargarArchivo(archivo.id, archivo.nombre_archivo)}
                  title="Descargar archivo ZIP"
                >
                  Descargar
                </button>
                <button
                  className="btn btn-delete"
                  onClick={() => eliminarArchivoZip(archivo.id, archivo.nombre_archivo)}
                  title="Eliminar archivo ZIP"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivosZipGenerados;
