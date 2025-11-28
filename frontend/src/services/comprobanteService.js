/**
 * Servicio para manejar operaciones de tipos de comprobantes
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

class ComprobanteService {
  /**
   * Obtiene todos los comprobantes de una empresa
   * @param {number} empresaId - ID de la empresa
   * @param {string} categoria - Opcional: 'venta' o 'compra' para filtrar
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async getComprobantes(empresaId, categoria = null, token) {
    try {
      let url = `${API_BASE_URL}/api/tipos-comprobantes/empresa/${empresaId}`;
      if (categoria) {
        url += `?categoria=${categoria}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error obteniendo comprobantes:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener comprobantes',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Crea un nuevo comprobante
   * @param {number} empresaId - ID de la empresa
   * @param {Object} comprobante - Datos del comprobante
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async createComprobante(empresaId, comprobante, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tipos-comprobantes/empresa/${empresaId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(comprobante)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: data.message || 'Comprobante creado exitosamente'
      };
    } catch (error) {
      console.error('Error creando comprobante:', error);
      return {
        success: false,
        error: error.message || 'Error al crear comprobante'
      };
    }
  }

  /**
   * Actualiza un comprobante existente
   * @param {number} comprobanteId - ID del comprobante
   * @param {number} empresaId - ID de la empresa
   * @param {Object} updates - Campos a actualizar
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async updateComprobante(comprobanteId, empresaId, updates, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tipos-comprobantes/${comprobanteId}/empresa/${empresaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: data.message || 'Comprobante actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error actualizando comprobante:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar comprobante'
      };
    }
  }

  /**
   * Elimina un comprobante (soft delete)
   * @param {number} comprobanteId - ID del comprobante
   * @param {number} empresaId - ID de la empresa
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async deleteComprobante(comprobanteId, empresaId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tipos-comprobantes/${comprobanteId}/empresa/${empresaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Comprobante eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error eliminando comprobante:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar comprobante'
      };
    }
  }

  /**
   * Migra comprobantes desde JSON a la tabla
   * @param {number} empresaId - ID de la empresa
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async migrateComprobantes(empresaId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tipos-comprobantes/empresa/${empresaId}/migrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: data.message || 'Migración completada'
      };
    } catch (error) {
      console.error('Error migrando comprobantes:', error);
      return {
        success: false,
        error: error.message || 'Error al migrar comprobantes'
      };
    }
  }

  /**
   * Convierte comprobantes de la tabla al formato JSON antiguo (para compatibilidad)
   * @param {Array} comprobantes - Lista de comprobantes de la tabla
   * @returns {Object} Formato JSON compatible
   */
  static convertToJsonFormat(comprobantes) {
    const resultado = {};
    comprobantes.forEach(comp => {
      resultado[comp.tipo_comprobante] = {
        activo: comp.activo,
        codigo: comp.codigo
      };
    });
    return resultado;
  }

  /**
   * Convierte formato JSON antiguo a formato de tabla
   * @param {Object} jsonData - Datos en formato JSON antiguo
   * @param {string} categoria - 'venta' o 'compra'
   * @returns {Array} Lista de comprobantes para la tabla
   */
  static convertFromJsonFormat(jsonData, categoria) {
    const resultado = [];
    Object.keys(jsonData).forEach(tipo => {
      resultado.push({
        tipo_comprobante: tipo,
        categoria: categoria,
        codigo: jsonData[tipo].codigo || '',
        activo: jsonData[tipo].activo !== undefined ? jsonData[tipo].activo : true
      });
    });
    return resultado;
  }
}

export default ComprobanteService;

