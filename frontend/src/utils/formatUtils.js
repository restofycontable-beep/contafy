/**
 * Utilidades para formateo de datos
 */

/**
 * Formatea bytes a formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
export const formatearTamano = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formatea un número a formato de moneda
 * @param {number} cantidad - Cantidad a formatear
 * @param {string} moneda - Código de moneda (default: 'COP')
 * @returns {string} Cantidad formateada
 */
export const formatearMoneda = (cantidad, moneda = 'COP') => {
  if (cantidad === null || cantidad === undefined) return '$0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cantidad);
};

/**
 * Obtiene las iniciales de un nombre
 * @param {string} nombre - Nombre completo
 * @returns {string} Iniciales
 */
export const obtenerIniciales = (nombre) => {
  if (!nombre) return 'U';
  
  const palabras = nombre.trim().split(' ');
  if (palabras.length >= 2) {
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }
  return nombre.substring(0, 2).toUpperCase();
};

