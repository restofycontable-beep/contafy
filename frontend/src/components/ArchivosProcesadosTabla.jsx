import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import ProcesamientoService from '../services/procesamientoService';
import '../styles/archivos-procesados-tabla.css';

const ArchivosProcesadosTabla = forwardRef((props, ref) => {
    const [archivos, setArchivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarArchivos();
    }, []);

    const cargarArchivos = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await ProcesamientoService.listarArchivosProcesados();
            
            if (response.success) {
                setArchivos(response.archivos || []);
            } else {
                // Si es error 401, no mostrar como error crítico
                if (response.error && response.error.includes('401')) {
('📋 Sin autorización para cargar archivos procesados - normal en dashboard');
                    setArchivos([]);
                } else {
                    setError('Error al cargar archivos: ' + (response.error || 'Error desconocido'));
                }
            }
        } catch (error) {
            // Si es error de autenticación, no mostrar como error crítico
            if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
('📋 Sin autorización para cargar archivos procesados - normal en dashboard');
                setArchivos([]);
            } else {
('Error cargando archivos:', error);
                setError(error.message || 'Error de conexión');
            }
        } finally {
            setLoading(false);
        }
    };

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
        cargarArchivos
    }));

    const descargarArchivo = async (archivoId, nombreArchivo) => {
        try {
(`Iniciando descarga del archivo ID: ${archivoId}, Nombre: ${nombreArchivo}`);
            
            const response = await ProcesamientoService.descargarArchivo(archivoId);
            
            // Verificar que la respuesta sea válida
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            // Crear blob y descargar
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo || `archivo_${archivoId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
(`Descarga completada: ${nombreArchivo}`);
            
        } catch (error) {
('Error en descarga:', error);
            alert('Error al descargar archivo: ' + error.message);
        }
    };

    const eliminarArchivo = async (archivoId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            try {
                // Aquí iría la llamada al servicio de eliminación
                await cargarArchivos(); // Recargar lista
            } catch (error) {
                alert('Error al eliminar archivo: ' + error.message);
            }
        }
    };

    const formatearTamaño = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleString('es-ES');
    };

    if (loading) {
        return (
            <div className="archivos-loading">
                <div className="spinner"></div>
                <p>Cargando archivos procesados...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="archivos-error">
                <p>❌ {error}</p>
                <div className="error-actions">
                    <button onClick={cargarArchivos} className="btn-reload">
                        🔄 Reintentar
                    </button>
                    <button onClick={() => window.location.reload()} className="btn-refresh-page">
                        🔄 Recargar página
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="archivos-procesados-container">
            <div className="archivos-header">
                <h3>📁 Archivos Procesados</h3>
                <button onClick={cargarArchivos} className="btn-refresh">
                    🔄 Actualizar
                </button>
            </div>

            {archivos.length === 0 ? (
                <div className="archivos-empty">
                    <p>📭 No hay archivos procesados</p>
                    <small>Sube un archivo Excel para ver los resultados aquí</small>
                </div>
            ) : (
                <div className="archivos-table-container">
                    <table className="archivos-table">
                        <thead>
                            <tr>
                                <th>📄 Nombre Archivo</th>
                                <th>📊 Tamaño</th>
                                <th>📅 Fecha Procesamiento</th>
                                <th>📝 Descripción</th>
                                <th>⚡ Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archivos.map((archivo) => (
                                <tr key={archivo.id}>
                                    <td className="archivo-nombre">
                                        <span className="file-icon">📄</span>
                                        {archivo.nombre_archivo}
                                    </td>
                                    <td className="archivo-tamaño">
                                        {formatearTamaño(archivo.tamano_bytes)}
                                    </td>
                                    <td className="archivo-fecha">
                                        {formatearFecha(archivo.fecha_procesamiento)}
                                    </td>
                                    <td className="archivo-descripcion">
                                        {archivo.descripcion}
                                    </td>
                                    <td className="archivo-acciones">
                                        <button
                                            onClick={() => descargarArchivo(archivo.id, archivo.nombre_archivo)}
                                            className="btn-descargar"
                                            title="Descargar archivo"
                                        >
                                            ⬇️ Descargar
                                        </button>
                                        <button
                                            onClick={() => eliminarArchivo(archivo.id)}
                                            className="btn-eliminar"
                                            title="Eliminar archivo"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
});

export default ArchivosProcesadosTabla; 