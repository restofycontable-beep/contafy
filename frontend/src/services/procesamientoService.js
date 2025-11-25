const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api`;

class ProcesamientoService {
    /**
     * Procesa un archivo Excel
     */
    static async procesarExcel(file, nitEmpresa = "901906032") {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('nit_empresa', nitEmpresa);

            const response = await fetch(`${API_BASE_URL}/procesamiento/procesar-excel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar archivo Excel');
            }

            return data;
        } catch (error) {
            console.error('Error procesando archivo Excel:', error);
            throw error;
        }
    }

    /**
     * Procesa un archivo Excel para extraer terceros
     */
    static async procesarTerceros(file, nitEmpresa = "901906032") {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('nit_empresa', nitEmpresa);

            const response = await fetch(`${API_BASE_URL}/procesamiento/procesar-terceros`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar archivo de terceros');
            }

            return data;
        } catch (error) {
            console.error('Error procesando archivo de terceros:', error);
            throw error;
        }
    }

    /**
     * Lista archivos procesados
     */
    static async listarArchivosProcesados() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await fetch(`${API_BASE_URL}/procesamiento/archivos-procesados`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(10000) // 10 segundos de timeout
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || `Error al listar archivos procesados: ${response.status}`);
            }

            return data.data || [];

        } catch (error) {
            console.error('Error listando archivos procesados:', error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('No se puede conectar al servidor. Verifica que el backend esté funcionando.');
            }
            
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Intenta de nuevo.');
            }
            
            throw error;
        }
    }

    /**
     * Descarga un archivo procesado
     */
    static async descargarArchivo(archivoId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await fetch(`${API_BASE_URL}/procesamiento/descargar-archivo/${archivoId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al descargar archivo');
            }

            return data.data;
        } catch (error) {
            console.error('Error descargando archivo:', error);
            throw error;
        }
    }

    /**
     * Elimina un archivo procesado
     */
    static async eliminarArchivo(archivoId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await fetch(`${API_BASE_URL}/procesamiento/eliminar-archivo/${archivoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al eliminar archivo');
            }

            return data;
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            throw error;
        }
    }
}

export default ProcesamientoService;