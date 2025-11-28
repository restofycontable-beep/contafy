/**
 * Servicio para manejar operaciones de cuentas globales
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

class CuentaGlobalService {
  /**
   * Obtiene todos los tipos de cuentas globales
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async getTiposCuentasGlobales(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuentas-globales/tipos`, {
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
      console.error('Error obteniendo tipos de cuentas globales:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener tipos de cuentas globales',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Obtiene todas las cuentas globales de una empresa
   * @param {number} empresaId - ID de la empresa
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async getCuentasGlobales(empresaId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuentas-globales/empresa/${empresaId}`, {
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
      console.error('Error obteniendo cuentas globales:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener cuentas globales',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Crea o actualiza una cuenta global
   * @param {number} empresaId - ID de la empresa
   * @param {Object} cuenta - Datos de la cuenta
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async saveCuentaGlobal(empresaId, cuenta, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuentas-globales/empresa/${empresaId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cuenta)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: data.message || 'Cuenta global guardada exitosamente'
      };
    } catch (error) {
      console.error('Error guardando cuenta global:', error);
      return {
        success: false,
        error: error.message || 'Error al guardar cuenta global'
      };
    }
  }

  /**
   * Elimina una cuenta global
   * @param {number} cuentaId - ID de la cuenta
   * @param {number} empresaId - ID de la empresa
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>}
   */
  static async deleteCuentaGlobal(cuentaId, empresaId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuentas-globales/${cuentaId}/empresa/${empresaId}`, {
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
        message: data.message || 'Cuenta global eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error eliminando cuenta global:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar cuenta global'
      };
    }
  }
}

export default CuentaGlobalService;

