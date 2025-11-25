/**
 * Utilidades para trabajar con credenciales de Restofy
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

/**
 * Obtiene las credenciales de Restofy desde la empresa
 * @param {number} empresaId - ID de la empresa
 * @param {Object} empresa - Objeto de empresa (opcional, si ya tiene las credenciales)
 * @param {string} token - Token de autenticación de la aplicación
 * @returns {Promise<Object>} Objeto con { restofyUrl, restofyToken, tieneRestofy, error }
 */
export const obtenerCredencialesRestofy = async (empresaId, empresa = null, token = null) => {
  console.log('🔑 restofyUtils.obtenerCredencialesRestofy: Iniciando', {
    empresaId,
    tieneEmpresa: !!empresa,
    tieneToken: !!token
  });

  // Si la empresa ya tiene las credenciales, usarlas directamente
  if (empresa && empresa.url_restofy && empresa.token_restofysas) {
    console.log('✅ restofyUtils: Credenciales encontradas en objeto empresa');
    return {
      restofyUrl: empresa.url_restofy,
      restofyToken: empresa.token_restofysas,
      tieneRestofy: true,
      error: null
    };
  }

  // Si no hay token, no podemos obtener las credenciales
  if (!token) {
    console.warn('⚠️ restofyUtils: No hay token de autenticación');
    return {
      restofyUrl: null,
      restofyToken: null,
      tieneRestofy: false,
      error: 'Token de autenticación requerido'
    };
  }

  // Si no hay empresaId, no podemos obtener las credenciales
  if (!empresaId) {
    console.warn('⚠️ restofyUtils: No hay ID de empresa');
    return {
      restofyUrl: null,
      restofyToken: null,
      tieneRestofy: false,
      error: 'ID de empresa requerido'
    };
  }

  // Obtener credenciales desde el backend
  try {
    console.log('🌐 restofyUtils: Obteniendo credenciales desde el backend', {
      empresaId,
      url: `${API_BASE_URL}/api/empresas/${empresaId}`
    });

    const response = await fetch(`${API_BASE_URL}/api/empresas/${empresaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ restofyUtils: Error obteniendo empresa', {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || errorData.detail
      });
      return {
        restofyUrl: null,
        restofyToken: null,
        tieneRestofy: false,
        error: errorData.error || errorData.detail || `Error ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      const empresaData = data.data;
      
      if (empresaData.url_restofy && empresaData.token_restofysas) {
        console.log('✅ restofyUtils: Credenciales obtenidas exitosamente', {
          tieneUrl: !!empresaData.url_restofy,
          tieneToken: !!empresaData.token_restofysas,
          urlPreview: empresaData.url_restofy.substring(0, 50) + '...'
        });
        return {
          restofyUrl: empresaData.url_restofy,
          restofyToken: empresaData.token_restofysas,
          tieneRestofy: true,
          error: null
        };
      } else {
        console.warn('⚠️ restofyUtils: Empresa no tiene credenciales de Restofy configuradas', {
          tieneUrl: !!empresaData.url_restofy,
          tieneToken: !!empresaData.token_restofysas
        });
        return {
          restofyUrl: null,
          restofyToken: null,
          tieneRestofy: false,
          error: 'Esta empresa no tiene integración con Restofy configurada. Configure la URL y token de Restofy en la configuración de la empresa.'
        };
      }
    } else {
      console.error('❌ restofyUtils: Respuesta inválida del backend', data);
      return {
        restofyUrl: null,
        restofyToken: null,
        tieneRestofy: false,
        error: data.error || 'Error al obtener datos de la empresa'
      };
    }
  } catch (error) {
    console.error('❌ restofyUtils: Error de conexión', {
      error: error.message,
      stack: error.stack
    });
    return {
      restofyUrl: null,
      restofyToken: null,
      tieneRestofy: false,
      error: `Error de conexión: ${error.message}`
    };
  }
};

/**
 * Verifica si una empresa tiene Restofy configurado
 * @param {Object} empresa - Objeto de empresa
 * @returns {boolean} True si tiene Restofy configurado
 */
export const tieneRestofyConfigurado = (empresa) => {
  return !!(empresa && empresa.url_restofy && empresa.token_restofysas);
};

