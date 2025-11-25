/**
 * Servicio para interactuar directamente con la API de Restofy
 * Todas las llamadas se hacen directamente a la API de Restofy usando las credenciales de la empresa
 */
const RestofyService = {
  /**
   * Limpia y normaliza la URL de Restofy
   * @param {string} url - URL de Restofy
   * @returns {string} URL limpia
   */
  _limpiarUrl(url) {
    if (!url) return null;
    return url.trim().replace(/\/$/, '');
  },

  /**
   * Valida que las credenciales estén presentes
   * @param {string} restofyUrl - URL de la API de Restofy
   * @param {string} restofyToken - Token de autenticación de Restofy
   * @returns {Object|null} Objeto de error si faltan credenciales, null si están OK
   */
  _validarCredenciales(restofyUrl, restofyToken) {
    if (!restofyUrl || !restofyToken) {
      console.warn('⚠️ RestofyService: Faltan credenciales', {
        tieneUrl: !!restofyUrl,
        tieneToken: !!restofyToken
      });
      return {
        success: false,
        error: 'URL y token de Restofy son requeridos. Configure las credenciales en la configuración de la empresa.',
        tiene_restofy: false
      };
    }
    return null;
  },

  /**
   * Realiza una petición POST a la API de Restofy con form-data
   * @param {string} restofyUrl - URL de la API de Restofy
   * @param {string} restofyToken - Token de autenticación de Restofy
   * @param {Object} formData - Datos a enviar como form-data
   * @returns {Promise<Object>} Respuesta de la API
   */
  async _hacerPeticion(restofyUrl, restofyToken, formData) {
    const url = this._limpiarUrl(restofyUrl);
    
    console.log('🌐 RestofyService: Realizando petición POST', {
      url: url,
      action: formData.action,
      page: formData.page,
      start_date: formData.start_date || 'N/A',
      end_date: formData.end_date || 'N/A',
      tieneToken: !!restofyToken,
      tokenPreview: restofyToken ? `${restofyToken.substring(0, 20)}...${restofyToken.substring(restofyToken.length - 10)}` : 'N/A'
    });

    try {
      // Crear form-data usando URLSearchParams (equivalente a application/x-www-form-urlencoded)
      // Esto es equivalente a cómo requests.post() en Python maneja data=dict
      const formDataToSend = new URLSearchParams();
      
      // Agregar cada campo del formData, asegurando que los valores estén en string
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== '') {
          // Convertir a string y trim para eliminar espacios
          const stringValue = String(value).trim();
          if (stringValue) {
            formDataToSend.append(key, stringValue);
            console.log(`  ✅ Agregando al body: ${key}=${stringValue}`);
          }
        }
      });

      // Log del body completo antes de enviar
      console.log('📦 RestofyService: Body completo a enviar', {
        bodyString: formDataToSend.toString(),
        bodyEntries: Array.from(formDataToSend.entries())
      });

      // IMPORTANTE: No especificar Content-Type - el navegador lo establecerá automáticamente
      // como application/x-www-form-urlencoded cuando usamos URLSearchParams
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${restofyToken}`,
          'Accept': 'application/json'
          // NO incluir Content-Type - el navegador lo establece automáticamente
        },
        body: formDataToSend
      });

      console.log('📊 RestofyService: Respuesta recibida', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ RestofyService: Petición exitosa', {
          status: data.status,
          tieneContent: !!data.content,
          contentLength: data.content ? data.content.length : 0,
          error: data.error || 'Ninguno'
        });
        return {
          success: true,
          data: data,
          status_code: response.status
        };
      } else {
        // Intentar parsear el error
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        let errorData = null;
        
        try {
          const errorText = await response.text();
          console.warn('⚠️ RestofyService: Error en respuesta', {
            status: response.status,
            errorText: errorText.substring(0, 200)
          });
          
          try {
            errorData = JSON.parse(errorText);
            errorMsg = errorData.error || errorData.message || errorData.detail || errorMsg;
          } catch (e) {
            errorMsg = errorText.substring(0, 200) || errorMsg;
          }
        } catch (e) {
          console.error('❌ RestofyService: Error parseando respuesta de error', e);
        }
        
        return {
          success: false,
          error: errorMsg,
          tiene_restofy: true,
          status_code: response.status
        };
      }
    } catch (error) {
      console.error('❌ RestofyService: Error en petición', {
        error: error.message,
        stack: error.stack,
        url: url
      });
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
        tiene_restofy: true
      };
    }
  },

  /**
   * Obtiene el listado de productos de Restofy
   * @param {string} restofyUrl - URL de la API de Restofy
   * @param {string} restofyToken - Token de autenticación de Restofy
   * @param {number} page - Número de página (default: 1)
   * @returns {Promise<Object>} Respuesta con los productos
   */
  async obtenerProductos(restofyUrl, restofyToken, page = 1) {
    console.log('📦 RestofyService.obtenerProductos: Iniciando', { page });
    
    const validationError = this._validarCredenciales(restofyUrl, restofyToken);
    if (validationError) {
      return validationError;
    }

    const formData = {
      action: 'products',
      page: page.toString()
    };

    const result = await this._hacerPeticion(restofyUrl, restofyToken, formData);
    
    if (result.success) {
      return {
        ...result,
        page: page
      };
    }
    
    return result;
  },

  /**
   * Obtiene el listado de categorías de Restofy
   * @param {string} restofyUrl - URL de la API de Restofy
   * @param {string} restofyToken - Token de autenticación de Restofy
   * @param {number} page - Número de página (default: 1)
   * @returns {Promise<Object>} Respuesta con las categorías
   */
  async obtenerCategorias(restofyUrl, restofyToken, page = 1) {
    console.log('📁 RestofyService.obtenerCategorias: Iniciando', { page });
    
    const validationError = this._validarCredenciales(restofyUrl, restofyToken);
    if (validationError) {
      return validationError;
    }

    const formData = {
      action: 'categories',
      page: page.toString()
    };

    const result = await this._hacerPeticion(restofyUrl, restofyToken, formData);
    
    if (result.success) {
      return {
        ...result,
        page: page
      };
    }
    
    return result;
  },

  /**
   * Obtiene el listado de facturas electrónicas generadas
   * @param {string} restofyUrl - URL de la API de Restofy
   * @param {string} restofyToken - Token de autenticación de Restofy
   * @param {number} page - Número de página (default: 1)
   * @param {string} startDate - Fecha de inicio (formato: YYYY-MM-DD HH:MM:SS)
   * @param {string} endDate - Fecha de fin (formato: YYYY-MM-DD HH:MM:SS)
   * @returns {Promise<Object>} Respuesta con las facturas
   */
  async obtenerFacturasElectronicas(restofyUrl, restofyToken, page = 1, startDate = null, endDate = null) {
    console.log('📄 RestofyService.obtenerFacturasElectronicas: Iniciando', {
      page,
      startDate,
      endDate
    });
    
    const validationError = this._validarCredenciales(restofyUrl, restofyToken);
    if (validationError) {
      return validationError;
    }

    const formData = {
      action: 'orders',
      page: page.toString()
    };
    
    // Agregar fechas si están presentes
    // Formato esperado: 'YYYY-MM-DD HH:MM:SS'
    if (startDate) {
      // Asegurar que la fecha esté en el formato correcto y sin espacios extra
      const startDateFormatted = String(startDate).trim();
      if (startDateFormatted) {
        formData.start_date = startDateFormatted;
        console.log('📅 RestofyService: Agregando start_date', { 
          original: startDate,
          formatted: startDateFormatted,
          length: startDateFormatted.length
        });
      }
    }
    if (endDate) {
      // Asegurar que la fecha esté en el formato correcto y sin espacios extra
      const endDateFormatted = String(endDate).trim();
      if (endDateFormatted) {
        formData.end_date = endDateFormatted;
        console.log('📅 RestofyService: Agregando end_date', { 
          original: endDate,
          formatted: endDateFormatted,
          length: endDateFormatted.length
        });
      }
    }

    // Log del objeto formData completo antes de enviar
    console.log('📋 RestofyService.obtenerFacturasElectronicas: formData completo', formData);

    const result = await this._hacerPeticion(restofyUrl, restofyToken, formData);
    
    if (result.success) {
      return {
        ...result,
        page: page
      };
    }
    
    return result;
  },

  /**
   * Obtiene el listado de items de las facturas electrónicas generadas
   * @param {string} restofyUrl - URL de la API de Restofy
   * @param {string} restofyToken - Token de autenticación de Restofy
   * @param {number} page - Número de página (default: 1)
   * @param {string} startDate - Fecha de inicio (formato: YYYY-MM-DD HH:MM:SS)
   * @param {string} endDate - Fecha de fin (formato: YYYY-MM-DD HH:MM:SS)
   * @returns {Promise<Object>} Respuesta con los items de facturas
   */
  async obtenerItemsFacturas(restofyUrl, restofyToken, page = 1, startDate = null, endDate = null) {
    console.log('🛒 RestofyService.obtenerItemsFacturas: Iniciando', {
      page,
      startDate,
      endDate
    });
    
    const validationError = this._validarCredenciales(restofyUrl, restofyToken);
    if (validationError) {
      return validationError;
    }

    const formData = {
      action: 'items',
      page: page.toString()
    };
    
    // Agregar fechas si están presentes
    // Formato esperado: 'YYYY-MM-DD HH:MM:SS'
    if (startDate) {
      // Asegurar que la fecha esté en el formato correcto y sin espacios extra
      const startDateFormatted = String(startDate).trim();
      if (startDateFormatted) {
        formData.start_date = startDateFormatted;
        console.log('📅 RestofyService: Agregando start_date', { 
          original: startDate,
          formatted: startDateFormatted,
          length: startDateFormatted.length
        });
      }
    }
    if (endDate) {
      // Asegurar que la fecha esté en el formato correcto y sin espacios extra
      const endDateFormatted = String(endDate).trim();
      if (endDateFormatted) {
        formData.end_date = endDateFormatted;
        console.log('📅 RestofyService: Agregando end_date', { 
          original: endDate,
          formatted: endDateFormatted,
          length: endDateFormatted.length
        });
      }
    }

    // Log del objeto formData completo antes de enviar
    console.log('📋 RestofyService.obtenerItemsFacturas: formData completo', formData);

    const result = await this._hacerPeticion(restofyUrl, restofyToken, formData);
    
    if (result.success) {
      return {
        ...result,
        page: page,
        items_per_page: 50
      };
    }
    
    return result;
  },

  /**
   * Verifica la conexión con la API de Restofy
   * Prueba obteniendo productos (página 1)
   * @param {string} restofyUrl - URL de la API de Restofy
   * @param {string} restofyToken - Token de autenticación de Restofy
   * @returns {Promise<Object>} Respuesta de verificación
   */
  async verificarConexion(restofyUrl, restofyToken) {
    console.log('🔍 RestofyService.verificarConexion: Iniciando verificación');
    
    const validationError = this._validarCredenciales(restofyUrl, restofyToken);
    if (validationError) {
      console.warn('⚠️ RestofyService.verificarConexion: Credenciales inválidas');
      return validationError;
    }

    // Probar obteniendo productos (página 1)
    const result = await this.obtenerProductos(restofyUrl, restofyToken, 1);
    
    if (result.success) {
      console.log('✅ RestofyService.verificarConexion: Conexión exitosa');
      return {
        ...result,
        message: 'Conexión exitosa con la API de Restofy'
      };
    } else {
      console.error('❌ RestofyService.verificarConexion: Conexión fallida', {
        error: result.error,
        status_code: result.status_code
      });
      return result;
    }
  }
};

export default RestofyService;
