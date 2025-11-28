/**
 * Utilidades para formateo de fechas
 */

/**
 * Formatea una fecha a formato español completo
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatearFechaCompleta = (fecha) => {
  if (!fecha) return 'No disponible';
  
  try {
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha a formato corto con hora
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatearFechaConHora = (fecha) => {
  if (!fecha) return 'N/A';
  
  try {
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    return fechaObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return fecha;
  }
};

/**
 * Formatea una fecha a formato corto sin hora
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatearFechaCorta = (fecha) => {
  if (!fecha) return 'N/A';
  
  try {
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return fecha;
  }
};

/**
 * Obtiene la fecha actual formateada en español
 * @returns {string} Fecha actual formateada
 */
export const obtenerFechaActual = () => {
  return formatearFechaCompleta(new Date());
};

