import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/modal-nuevo-documento.css';

const NuevoDocumentoModal = ({ isOpen, onClose, onSuccess, empresaSeleccionada }) => {
    const { token } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [archivoProcesado, setArchivoProcesado] = useState(null);
    const [mostrarOpciones, setMostrarOpciones] = useState(false);
    const [procesandoZip, setProcesandoZip] = useState(false);
    const [zipGenerado, setZipGenerado] = useState(null);

    // Agregar useEffect para debug del estado
    React.useEffect(() => {
        // Estado actualizado
    }, [zipGenerado, mostrarOpciones, procesandoZip, message, error]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))) {
            setSelectedFile(file);
            setError('');
            setMessage('Archivo seleccionado: ' + file.name + ' (' + (file.size / 1024).toFixed(2) + ' KB)');
            setMostrarOpciones(false);
            setArchivoProcesado(null);
            setZipGenerado(null);
        } else {
            setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
            setSelectedFile(null);
        }
        // Limpiar el input para forzar nueva selección
        event.target.value = '';
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setError('Por favor selecciona un archivo primero');
            return;
        }

        if (!empresaSeleccionada) {
            setError('Por favor selecciona una empresa primero');
            return;
        }

        setIsProcessing(true);
        setError('');
        setMessage('Procesando archivo DIAN...');

        try {
            // Simular procesamiento del archivo DIAN (no lo guardamos en BD)
            setArchivoProcesado({
                nombre: selectedFile.name,
                contenido: selectedFile,
                empresa: empresaSeleccionada
            });
            
            setMessage('Archivo DIAN procesado. Selecciona el tipo de modelo a generar:');
            setMostrarOpciones(true);
            
        } catch (error) {
            console.error('Error procesando archivo:', error);
            setError('Error al procesar el archivo: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const generarZipVentas = async () => {
        if (!archivoProcesado) return;

        setProcesandoZip(true);
        setError('');
        setMessage('Generando ZIP de ventas...');

        try {
            const formData = new FormData();
            formData.append('archivo_dian', archivoProcesado.contenido);
            formData.append('empresa_id', empresaSeleccionada.id);
            formData.append('nit_empresa', empresaSeleccionada.nit);


            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/generar-ventas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            
            const result = await response.json();

            if (response.ok && result.success) {
                setZipGenerado(result.data);
                setMessage(`✅ ZIP de ventas generado exitosamente: ${result.data.nombre_archivo}`);
                onSuccess && onSuccess(result);
                
                // Forzar re-renderizado
                setTimeout(() => {
                }, 100);
            } else {
                console.error('❌ Error en la respuesta:', result);
                setError(result.message || 'Error al generar ZIP de ventas');
            }
        } catch (error) {
            console.error('❌ Error generando ZIP de ventas:', error);
            setError('Error al generar ZIP de ventas: ' + error.message);
        } finally {
            setProcesandoZip(false);
        }
    };

    const generarZipCompras = async () => {
        if (!archivoProcesado) return;

        setProcesandoZip(true);
        setError('');
        setMessage('Generando ZIP de compras...');

        try {
            const formData = new FormData();
            formData.append('archivo_dian', archivoProcesado.contenido);
            formData.append('empresa_id', empresaSeleccionada.id);
            formData.append('nit_empresa', empresaSeleccionada.nit);

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/generar-compras`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setZipGenerado(result.data);
                setMessage(`✅ ZIP de compras generado exitosamente: ${result.data.nombre_archivo}`);
                onSuccess && onSuccess(result);
            } else {
                setError(result.message || 'Error al generar ZIP de compras');
            }
        } catch (error) {
            console.error('Error generando ZIP de compras:', error);
            setError('Error al generar ZIP de compras: ' + error.message);
        } finally {
            setProcesandoZip(false);
        }
    };

    const generarZipAmbos = async () => {
        if (!archivoProcesado) return;

        setProcesandoZip(true);
        setError('');
        setMessage('Generando ZIP con todos los modelos (Ventas + Compras + Terceros)...');

        try {
            const formData = new FormData();
            formData.append('archivo_dian', archivoProcesado.contenido);
            formData.append('empresa_id', empresaSeleccionada.id);
            formData.append('nit_empresa', empresaSeleccionada.nit);


            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/generar-ambos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setZipGenerado(result.data);
                setMessage(`✅ ZIP con todos los modelos generado exitosamente: ${result.data.nombre_archivo}`);
                onSuccess && onSuccess(result);
            } else {
                setError(result.message || 'Error al generar ZIP con todos los modelos');
            }
        } catch (error) {
            console.error('Error generando ZIP con ambos modelos:', error);
            setError('Error al generar ZIP con todos los modelos: ' + error.message);
        } finally {
            setProcesandoZip(false);
        }
    };

    const descargarZip = async () => {
        if (!zipGenerado) return;

        try {
            // Mostrar notificación sobre eliminación automática
            const confirmarDescarga = window.confirm(
                `📥 Descargando: ${zipGenerado.nombre_archivo}\n\n⚠️ IMPORTANTE: Este archivo se eliminará automáticamente del servidor después de la descarga.\n\n¿Continuar?`
            );
            
            if (!confirmarDescarga) {
                return;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/descargar/${zipGenerado.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = zipGenerado.nombre_archivo;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                // Eliminar el archivo del servidor después de la descarga
                await eliminarZipDelServidor();
                
            } else {
                setError('Error al descargar el archivo ZIP');
            }
        } catch (error) {
            console.error('Error descargando ZIP:', error);
            setError('Error al descargar el archivo ZIP: ' + error.message);
        }
    };

    const eliminarZipDelServidor = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/eliminar/${zipGenerado.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                setMessage('✅ Archivo ZIP descargado y eliminado automáticamente del servidor');
                setZipGenerado(null); // Limpiar el estado del ZIP
            } else {
                setMessage('⚠️ Archivo descargado, pero no se pudo eliminar del servidor');
            }
        } catch (error) {
            console.error('Error eliminando ZIP del servidor:', error);
            setMessage('⚠️ Archivo descargado, pero error al eliminar del servidor');
        }
    };

    const generarTerceros = async () => {
        if (!archivoProcesado) return;

        setProcesandoZip(true);
        setError('');
        setMessage('Generando ZIP de terceros...');

        try {
            const formData = new FormData();
            const archivoParaEnviar = archivoProcesado.contenido instanceof File
                ? archivoProcesado.contenido
                : new File([archivoProcesado.contenido], archivoProcesado.nombre, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            formData.append('archivo_dian', archivoParaEnviar);
            formData.append('empresa_id', empresaSeleccionada.id);
            formData.append('nit_empresa', empresaSeleccionada.nit);


            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/zip/generar-terceros`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setZipGenerado(result.data);
                setMessage(`✅ ZIP de terceros generado exitosamente: ${result.data.nombre_archivo}`);
                onSuccess && onSuccess(result);
            } else {
                console.error('❌ Error en la respuesta:', result);
                setError(result.message || 'Error al generar ZIP de terceros');
            }
        } catch (error) {
            console.error('Error generando ZIP de terceros:', error);
            setError('Error al generar ZIP de terceros: ' + error.message);
        } finally {
            setProcesandoZip(false);
        }
    };


    const handleClose = () => {
        // Solo permitir cerrar si no está procesando y no hay archivos generados
        if (!isProcessing && !procesandoZip && !zipGenerado) {
            setSelectedFile(null);
            setMessage('');
            setError('');
            setArchivoProcesado(null);
            setMostrarOpciones(false);
            setZipGenerado(null);
            onClose();
        } else if (zipGenerado) {
            // Si hay archivos generados, mostrar mensaje de confirmación
            if (window.confirm(`¿Estás seguro de que quieres cerrar? Los archivos ZIP generados se mantendrán guardados.`)) {
                setSelectedFile(null);
                setMessage('');
                setError('');
                setArchivoProcesado(null);
                setMostrarOpciones(false);
                setZipGenerado(null);
                onClose();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Procesar Archivo DIAN</h2>
                    <button 
                        className="close-button" 
                        onClick={handleClose}
                        disabled={isProcessing || procesandoZip}
                        title={zipGenerado ? "Hay archivos generados. Haz clic para confirmar el cierre." : "Cerrar"}
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {!mostrarOpciones ? (
                        <>
                            <div className="file-upload-section">
                                <label htmlFor="file-input" className="file-upload-label">
                                    <div className="upload-area">
                                        <i className="upload-icon">📁</i>
                                        <span>Seleccionar archivo DIAN</span>
                                        <small>Formatos soportados: .xlsx, .xls</small>
                                    </div>
                                </label>
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={isProcessing}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {selectedFile && (
                                <div className="file-info">
                                    <p><strong>Archivo seleccionado:</strong> {selectedFile.name}</p>
                                    <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    {empresaSeleccionada && (
                                        <p><strong>Empresa:</strong> {empresaSeleccionada.razon_social} (NIT: {empresaSeleccionada.nit})</p>
                                    )}
                                </div>
                            )}

                            {!empresaSeleccionada && (
                                <div className="message warning">
                                    ⚠️ Por favor selecciona una empresa antes de procesar el archivo
                                </div>
                            )}

                            <div className="processing-info">
                                <h4>Información del proceso:</h4>
                                <ul>
                                    <li>El archivo debe ser un reporte DIAN con columnas específicas</li>
                                    <li>Se procesarán facturas electrónicas y notas de crédito</li>
                                    <li>Se generarán archivos ZIP con modelos de ventas o compras</li>
                                    <li>Los archivos ZIP se guardarán en la base de datos</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="opciones-procesamiento">
                            <h3>Archivo DIAN Procesado</h3>
                            <p><strong>Archivo:</strong> {archivoProcesado?.nombre}</p>
                            <p><strong>Empresa:</strong> {empresaSeleccionada?.razon_social}</p>
                            
                            {!zipGenerado ? (
                                <div className="botones-modelos">
                                    <h4>Selecciona el tipo de procesamiento:</h4>
                                    <div className="botones-container">
                                        <button 
                                            className="btn btn-ventas" 
                                            onClick={generarZipVentas}
                                            disabled={procesandoZip}
                                        >
                                            {procesandoZip ? 'Generando...' : '📊 Generar Modelo Ventas'}
                                        </button>
                                        <button 
                                            className="btn btn-compras" 
                                            onClick={generarZipCompras}
                                            disabled={procesandoZip}
                                        >
                                            {procesandoZip ? 'Generando...' : '🛒 Generar Modelo Compras'}
                                        </button>
                                        <button 
                                            className="btn btn-ambos" 
                                            onClick={generarZipAmbos}
                                            disabled={procesandoZip}
                                        >
                                            {procesandoZip ? 'Generando...' : '🎯 Descargar Todos los Modelos (Ventas + Compras + Terceros)'}
                                        </button>
                                        <button 
                                            className="btn btn-terceros" 
                                            onClick={generarTerceros}
                                            disabled={procesandoZip}
                                        >
                                            {procesandoZip ? 'Generando...' : '👥 Generar Modelo Terceros'}
                                        </button>
                                    </div>
                                </div>
                            ) : zipGenerado ? (
                                <div className="zip-generado">
                                    <h4>✅ ZIP Generado Exitosamente</h4>
                                    <div className="zip-info">
                                        <p><strong>Archivo:</strong> {zipGenerado.nombre_archivo}</p>
                                        <p><strong>Tamaño:</strong> {zipGenerado.tamano_mb} MB</p>
                                        <p><strong>Tipo:</strong> {zipGenerado.tipo_procesamiento}</p>
                                        <p><strong>Modelos generados:</strong> {zipGenerado.modelos_generados}</p>
                                    </div>
                                    <div className="botones-descarga">
                                        <button 
                                            className="btn btn-download" 
                                            onClick={descargarZip}
                                        >
                                            📥 Descargar ZIP
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => {
                                                setZipGenerado(null);
                                                setMostrarOpciones(false);
                                            }}
                                        >
                                            🔄 Generar Otro Modelo
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {message && (
                        <div className="message success">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="message error">
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleClose}
                        disabled={isProcessing || procesandoZip}
                    >
                        Cancelar
                    </button>
                    {!mostrarOpciones && (
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSubmit}
                            disabled={!selectedFile || isProcessing || procesandoZip || !empresaSeleccionada}
                        >
                            {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NuevoDocumentoModal; 