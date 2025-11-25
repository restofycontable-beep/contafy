import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RestofyService from '../services/restofyService';
import '../styles/facturas-electronicas.css';
import { obtenerCredencialesRestofy } from '../utils/restofyUtils';

const FacturasElectronicas = ({ empresaId, empresa }) => {
  const { token } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tieneRestofy, setTieneRestofy] = useState(false);
  const [restofyUrl, setRestofyUrl] = useState(null);
  const [restofyToken, setRestofyToken] = useState(null);
  const [fechasInicializadas, setFechasInicializadas] = useState(false);
  const [credencialesCargadas, setCredencialesCargadas] = useState(false);

  // Convertir fecha de formato datetime-local (YYYY-MM-DDTHH:MM) a formato API (YYYY-MM-DD HH:MM:SS)
  // Para start_date: agrega 00:00:01 al inicio del día (formato: YYYY-MM-DD 00:00:01)
  // Para end_date: agrega 23:59:59 al final del día (formato: YYYY-MM-DD 23:59:59)
  // Formato requerido por la API de Restofy: 'YYYY-MM-DD HH:MM:SS'
  // Ejemplo: '2025-01-01 00:00:01' para start_date
  // Ejemplo: '2025-01-30 23:59:59' para end_date
  const convertirFechaParaAPI = (fechaLocal, esFechaInicio = false) => {
    if (!fechaLocal) return null;
    
    // El input datetime-local devuelve formato: YYYY-MM-DDTHH:MM
    // Necesitamos: YYYY-MM-DD HH:MM:SS
    
    if (fechaLocal.includes('T')) {
      // Tiene hora: convertir T a espacio y extraer fecha y hora
      const [fecha] = fechaLocal.split('T');
      
      if (esFechaInicio) {
        // Para fecha de inicio: siempre usar 00:00:01 al inicio del día
        // Ignorar la hora seleccionada y usar siempre el inicio del día
        return `${fecha} 00:00:01`;
      } else {
        // Para fecha de fin: siempre usar 23:59:59 al final del día
        // Ignorar la hora seleccionada y usar siempre el final del día
        return `${fecha} 23:59:59`;
      }
    } else {
      // Solo tiene fecha (YYYY-MM-DD) - formato alternativo
      if (esFechaInicio) {
        return `${fechaLocal} 00:00:01`;
      } else {
        return `${fechaLocal} 23:59:59`;
      }
    }
  };

  // Obtener fecha por defecto (último mes) en formato para input datetime-local
  // Retorna formato: YYYY-MM-DDTHH:MM (formato datetime-local)
  const obtenerFechaPorDefecto = (diasAtras = 30) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    // Establecer hora a las 00:00 para fecha de inicio
    fecha.setHours(0, 0, 0, 0);
    return fecha.toISOString().slice(0, 16);
  };
  
  // Obtener fecha de fin por defecto (hoy) en formato para input datetime-local
  const obtenerFechaFinPorDefecto = () => {
    const fecha = new Date();
    // Establecer hora a las 23:59 para fecha de fin (se convertirá a 23:59:59)
    fecha.setHours(23, 59, 0, 0);
    return fecha.toISOString().slice(0, 16);
  };

  // Obtener credenciales de Restofy desde la empresa
  useEffect(() => {
    const cargarCredenciales = async () => {
      if (!empresaId) {
        console.warn('⚠️ FacturasElectronicas: No hay ID de empresa');
        return;
      }

      console.log('🔑 FacturasElectronicas: Cargando credenciales de Restofy', {
        empresaId,
        tieneEmpresa: !!empresa
      });

      const credenciales = await obtenerCredencialesRestofy(empresaId, empresa, token);
      
      if (credenciales.tieneRestofy) {
        console.log('✅ FacturasElectronicas: Credenciales cargadas exitosamente');
        setRestofyUrl(credenciales.restofyUrl);
        setRestofyToken(credenciales.restofyToken);
        setTieneRestofy(true);
        setError(null);
      } else {
        console.warn('⚠️ FacturasElectronicas: No se pudieron obtener credenciales', {
          error: credenciales.error
        });
        setTieneRestofy(false);
        setError(credenciales.error);
      }
      
      setCredencialesCargadas(true);
    };

    cargarCredenciales();
  }, [empresaId, empresa, token]);

  const cargarFacturas = async () => {
    if (!restofyUrl || !restofyToken || !startDate || !endDate) {
      console.warn('⚠️ FacturasElectronicas: Faltan datos para cargar facturas', {
        tieneUrl: !!restofyUrl,
        tieneToken: !!restofyToken,
        tieneStartDate: !!startDate,
        tieneEndDate: !!endDate
      });
      return;
    }

    console.log('📄 FacturasElectronicas: Cargando facturas', {
      page,
      startDate,
      endDate
    });

    setLoading(true);
    setError(null);

    try {
      // Convertir fechas al formato que espera la API
      // start_date debe tener formato: YYYY-MM-DD HH:MM:SS (preferiblemente 00:00:01)
      // end_date debe tener formato: YYYY-MM-DD HH:MM:SS (preferiblemente 23:59:59)
      const startDateAPI = convertirFechaParaAPI(startDate, true);  // true = es fecha de inicio
      const endDateAPI = convertirFechaParaAPI(endDate, false);     // false = es fecha de fin

      console.log('📅 FacturasElectronicas: Fechas convertidas', {
        startDateOriginal: startDate,
        startDateAPI,
        endDateOriginal: endDate,
        endDateAPI
      });

      // Llamar directamente a la API de Restofy
      const result = await RestofyService.obtenerFacturasElectronicas(
        restofyUrl,
        restofyToken,
        page,
        startDateAPI,
        endDateAPI
      );

      if (result.success) {
        // La respuesta tiene estructura: { status: 1, content: [...], error: "" }
        const responseData = result.data;
        if (responseData && responseData.status === 1) {
          const facturasObtenidas = responseData.content || [];
          console.log('✅ FacturasElectronicas: Facturas obtenidas exitosamente', {
            cantidad: facturasObtenidas.length,
            page
          });
          setFacturas(facturasObtenidas);
          setTieneRestofy(true);
          setError(null);
        } else {
          console.warn('⚠️ FacturasElectronicas: Respuesta con error de la API', {
            status: responseData.status,
            error: responseData.error
          });
          setFacturas([]);
          setError(responseData.error || 'No se pudieron obtener las facturas');
        }
      } else {
        console.error('❌ FacturasElectronicas: Error al obtener facturas', {
          error: result.error,
          status_code: result.status_code
        });
        setFacturas([]);
        setError(result.error);
        setTieneRestofy(result.tiene_restofy !== undefined ? result.tiene_restofy : true);
      }
    } catch (err) {
      console.error('❌ FacturasElectronicas: Excepción al cargar facturas', {
        error: err.message,
        stack: err.stack
      });
      setFacturas([]);
      setError('Error al cargar las facturas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Establecer fechas por defecto cuando cambie empresaId y las credenciales estén cargadas
  useEffect(() => {
    if (empresaId && credencialesCargadas) {
      console.log('📅 FacturasElectronicas: Inicializando fechas por defecto');
      // Fecha de inicio: hace 30 días a las 00:00:01
      const fechaInicio = obtenerFechaPorDefecto(30);
      // Fecha de fin: hoy a las 23:59:59
      const fechaFin = obtenerFechaFinPorDefecto();
      setStartDate(fechaInicio);
      setEndDate(fechaFin);
      setPage(1);
      // Marcar fechas como inicializadas después de un pequeño delay
      setTimeout(() => {
        setFechasInicializadas(true);
      }, 0);
    } else {
      setFechasInicializadas(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, credencialesCargadas]);

  // Cargar facturas cuando se inicialicen las fechas por primera vez
  useEffect(() => {
    if (empresaId && restofyUrl && restofyToken && startDate && endDate && fechasInicializadas && tieneRestofy) {
      console.log('🔄 FacturasElectronicas: Cargando facturas iniciales');
      cargarFacturas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechasInicializadas, tieneRestofy, restofyUrl, restofyToken]);

  // Cargar facturas cuando cambie page (no cuando cambien las fechas manualmente)
  useEffect(() => {
    if (empresaId && restofyUrl && restofyToken && startDate && endDate && fechasInicializadas && page > 1 && tieneRestofy) {
      console.log('🔄 FacturasElectronicas: Cambiando página', { page });
      cargarFacturas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleBuscar = () => {
    console.log('🔍 FacturasElectronicas: Buscar facturas manualmente');
    setPage(1);
    cargarFacturas();
  };

  const handleLimpiarFiltros = () => {
    console.log('🧹 FacturasElectronicas: Limpiando filtros');
    const fechaInicio = obtenerFechaPorDefecto(30);
    const fechaFin = obtenerFechaFinPorDefecto();
    setStartDate(fechaInicio);
    setEndDate(fechaFin);
    setPage(1);
    setError(null);
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '-';
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

  const formatearMoneda = (valor) => {
    if (!valor) return '$0';
    const num = parseFloat(valor);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const abrirLinkFactura = (link) => {
    if (link) {
      console.log('🔗 FacturasElectronicas: Abriendo link de factura', { link });
      window.open(link, '_blank');
    }
  };

  const obtenerEstadoBadge = (estado, descripcionEstado) => {
    const estadoLower = (descripcionEstado || '').toLowerCase();
    if (estadoLower.includes('pago') || estadoLower.includes('corriente')) {
      return <span className="badge badge-success">{descripcionEstado || 'Activo'}</span>;
    } else if (estadoLower.includes('pendiente')) {
      return <span className="badge badge-warning">{descripcionEstado || 'Pendiente'}</span>;
    } else {
      return <span className="badge badge-info">{descripcionEstado || `Estado ${estado}`}</span>;
    }
  };

  // Mostrar estado de carga de credenciales
  if (!credencialesCargadas) {
    return (
      <div className="facturas-container">
        <div className="facturas-loading">
          <span className="loading-icon">🔄</span>
          <p>Cargando credenciales de Restofy...</p>
        </div>
      </div>
    );
  }

  if (!tieneRestofy) {
    return (
      <div className="facturas-container">
        <div className="facturas-error">
          <div className="error-icon">⚠️</div>
          <h3>Restofy no configurado</h3>
          <p>Esta empresa no tiene integración con Restofy configurada.</p>
          <p>Configure la URL y token de Restofy en la configuración de la empresa.</p>
          {error && (
            <p className="error-detail" style={{ marginTop: '10px', color: '#c33', fontSize: '0.9em' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="facturas-container">
      <div className="facturas-header">
        <h3>📄 Facturas Electrónicas - {empresa?.razon_social || 'Empresa'}</h3>
        <p className="facturas-subtitle">Listado de facturas electrónicas generadas</p>
      </div>

      <div className="facturas-filters">
        <div className="filter-group">
          <label htmlFor="start-date">Fecha de inicio:</label>
          <input
            type="datetime-local"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="end-date">Fecha de fin:</label>
          <input
            type="datetime-local"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-actions">
          <button onClick={handleBuscar} className="btn btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : '🔍 Buscar'}
          </button>
          <button onClick={handleLimpiarFiltros} className="btn btn-secondary">
            Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div className="facturas-error-message">
          <span className="error-icon">❌</span>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="facturas-loading">
          <span className="loading-icon">🔄</span>
          <p>Cargando facturas...</p>
        </div>
      )}

      {!loading && !error && facturas.length === 0 && fechasInicializadas && (
        <div className="facturas-empty">
          <span className="empty-icon">📭</span>
          <h4>No se encontraron facturas</h4>
          <p>No hay facturas electrónicas para el rango de fechas seleccionado.</p>
        </div>
      )}

      {!loading && !error && facturas.length > 0 && (
        <>
          <div className="facturas-table-container">
            <table className="facturas-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha Aprobación</th>
                  <th>Adquiriente</th>
                  <th>Documento</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((factura) => (
                  <tr key={factura.id}>
                    <td>
                      <strong>{factura.num_factura || factura.numero}</strong>
                    </td>
                    <td>{formatearFecha(factura.fecha_factura_aprobacion)}</td>
                    <td>{factura.nombre_adquiriente || 'N/A'}</td>
                    <td>{factura.documento_adquiriente || 'N/A'}</td>
                    <td className="factura-total">{formatearMoneda(factura.total)}</td>
                    <td>{obtenerEstadoBadge(factura.estado, factura.descripcion_estado)}</td>
                    <td>
                      {factura.link && (
                        <button
                          onClick={() => abrirLinkFactura(factura.link)}
                          className="btn btn-link"
                          title="Ver factura en DIAN"
                        >
                          🔗 Ver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="facturas-pagination">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || loading}
              className="btn btn-secondary"
            >
              ← Anterior
            </button>
            <span className="pagination-info">Página {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={facturas.length === 0 || loading}
              className="btn btn-secondary"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FacturasElectronicas;
